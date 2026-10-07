import mongoose from "mongoose";
import Notification from "../models/Notification.js";
import User from "../models/user.js";
import { sendPushToUsers } from "../services/pushService.js";
import { getPushStatus } from "../config/firebase.js";

/**
 * [FCM] Push ko fire-and-forget bhejte hain.
 *
 * DB row pehle hi ban chuki hoti hai aur wahi source of truth hai, isliye
 * FCM ka round-trip API response ko slow nahi karna chahiye — guard gate par
 * form submit kare to usko turant response milna chahiye, Firebase ka wait
 * nahi. Error sirf log hota hai, caller tak nahi jata.
 */
function firePush(userIds, { title, message, category, type, link, notificationId }) {
  const targets = (userIds || []).filter(Boolean);
  if (targets.length === 0) return;

  sendPushToUsers(targets, {
    title,
    body: message,
    link,
    data: {
      category: category || "general",
      type: type || "info",
      notificationId,
    },
  }).catch((err) => console.error("[fcm] push dispatch failed:", err.message));
}

// Create a new notification
export const createNotification = async (data) => {
  try {
    const {
      sender,
      recipient,
      society,
      title,
      message,
      category,
      type,
      targetAudience,
      link,
      isRead,
    } = data;

    // Robust boolean conversion for isRead
    let finalIsRead = false;
    if (isRead === true || isRead === "true" || isRead === 1 || isRead === "1") {
      finalIsRead = true;
    }

    // Handle Broadcast (All users in society or Global if SuperAdmin)
    if (targetAudience && targetAudience !== "specific") {
      const query = {};
      
      // If society is provided, filter by society, otherwise it's global (for SuperAdmin)
      if (society) {
        query.society = new mongoose.Types.ObjectId(society);
      }

      // Filter by audience type
      if (targetAudience === "owners") {
        query["unit.ownershipType"] = "owner";
      } else if (targetAudience === "tenants") {
        query["unit.ownershipType"] = "tenant";
      } else if (targetAudience === "guards") {
        query.role = "guard";
      } else if (targetAudience === "admins") {
        query.role = "society_admin"; // Specific for Society Admins
      } else if (targetAudience === "all") {
        // Platform wide or Society wide "All"
        query.role = { $in: ["user", "society_admin", "guard", "superadmin"] };
      } else {
        query.role = "user";
      }

      const users = await User.find(query).select("_id role");
      
      let userIds = users.map(u => u._id);

      // [Safety] Always ensure sender is included in the recipient list for broadcasts 
      if (sender) {
        const senderId = new mongoose.Types.ObjectId(sender);
        if (!userIds.some(id => id.toString() === senderId.toString())) {
          userIds.push(senderId);
        }
      }
      
      const notifications = userIds.map((userId) => {
        const isSelf = sender && userId.toString() === sender.toString();
        return {
          sender: sender ? new mongoose.Types.ObjectId(sender) : null,
          recipient: userId,
          society: society ? new mongoose.Types.ObjectId(society) : null,
          title,
          message,
          category,
          type,
          targetAudience,
          link,
          isRead: isSelf ? true : finalIsRead 
        };
      });

      if (notifications.length > 0) {
        const created = await Notification.insertMany(notifications);

        // [FCM] Sender ko apni hi broadcast ka push nahi bhejte (uske liye
        // notification already isRead: true hoti hai).
        firePush(
          userIds.filter((id) => !sender || id.toString() !== sender.toString()),
          { title, message, category, type, link },
        );

        return created;
      }
      return [];
    }

    // Handle Single User Notification - Using Notification.create for direct persistence
    const isSelfSingle = sender && recipient.toString() === sender.toString();
    
    const newNotification = await Notification.create({
      sender: sender ? new mongoose.Types.ObjectId(sender) : null,
      recipient: new mongoose.Types.ObjectId(recipient),
      society: society ? new mongoose.Types.ObjectId(society) : null,
      title,
      message,
      category,
      type,
      targetAudience: "specific",
      link,
      isRead: isSelfSingle ? true : finalIsRead
    });

    // [FCM] Yahi wo jagah hai jahan se resident ke phone par push jata hai —
    // gate entry request, visitor approval, overstay alert, notice, complaint,
    // sab isi function se guzarte hain.
    if (!isSelfSingle) {
      firePush([recipient], {
        title,
        message,
        category,
        type,
        link,
        notificationId: newNotification._id,
      });
    }

    return newNotification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

// [UPDATED] - Fetch notifications for logged-in user with Pagination & Filters
export const getMyNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { category, isRead } = req.query;

    const userObjectId = new mongoose.Types.ObjectId(req.user.id);
    
    // Special handling for 'Sent' notifications - Group by title/message to avoid duplicates in UI
    if (category === 'Sent') {
      const notifications = await Notification.aggregate([
        { $match: { sender: userObjectId } },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: {
              title: "$title",
              message: "$message",
              createdAt: { $dateToString: { format: "%Y-%m-%d %H:%M", date: "$createdAt" } }
            },
            doc: { $first: "$$ROOT" }
          }
        },
        { $replaceRoot: { newRoot: "$doc" } },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit }
      ]);

      const totalGrouped = await Notification.aggregate([
        { $match: { sender: userObjectId } },
        {
          $group: {
            _id: {
              title: "$title",
              message: "$message",
              createdAt: { $dateToString: { format: "%Y-%m-%d %H:%M", date: "$createdAt" } }
            }
          }
        },
        { $count: "count" }
      ]);

      const total = totalGrouped.length > 0 ? totalGrouped[0].count : 0;

      return res.json({
        status: "success",
        count: notifications.length,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        data: notifications,
      });
    }

    // Default query: user is recipient
    let query = { recipient: userObjectId };

  

    // Normal Category Filtering
    if (category && category !== 'All') {
      if (category === 'Unread') {
        query.isRead = false;
        query.sender = { $ne: userObjectId };
      } else if (category === 'Read' || category === 'Resolved') {
        query.isRead = true;
      } else if (category === 'Payment Alerts') {
        query.category = 'payment';
      } else if (category === 'Security') {
        query.category = { $in: ['visitor', 'alert'] };
      }
    } else if (isRead !== undefined) {
      query.isRead = isRead === 'true';
      if (query.isRead === false) {
        query.sender = { $ne: userObjectId };
      }
    }

    // [Safety] Explicit override for known tabs
    if (category === 'Unread') {
      query.isRead = false;
      query.sender = { $ne: userObjectId };
    }
    if (category === 'Read') query.isRead = true;

    // it should definitely NOT show up. The query { isRead: false } already ensures this.

    const total = await Notification.countDocuments(query);
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      status: "success",
      count: notifications.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

// [NEW] GET - Notification stats for cards
export const getNotificationStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Unread count: Must be recipient AND not sender
    const unreadCount = await Notification.countDocuments({ 
      recipient: userObjectId, 
      isRead: false,
      sender: { $ne: userObjectId }
    });

    const highPriorityCount = await Notification.countDocuments({ 
      recipient: userObjectId, 
      category: { $in: ['alert', 'visitor'] },
      sender: { $ne: userObjectId }
    });

    const readCount = await Notification.countDocuments({ 
      recipient: userObjectId, 
      isRead: true,
      sender: { $ne: userObjectId }
    });

    const paymentCount = await Notification.countDocuments({
      recipient: userObjectId,
      category: 'payment',
      sender: { $ne: userObjectId }
    });

    res.json({
      status: "success",
      data: {
        unread: unreadCount,
        highPriority: highPriorityCount,
        read: readCount,
        payment: paymentCount
      }
    });
  } catch (error) {
    next(error);
  }
};

//  PATCH - Mark a single notification as read
export const markAsRead = async (req, res, next) => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(req.user.id);
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: userObjectId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({
      status: "success",
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

//  PATCH - Mark all notifications as read
export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { isRead: true }
    );

    res.json({
      status: "success",
      message: "All notifications marked as read",
    });
  } catch (error) {
    next(error);
  }
};

// GET - Unread count for bell icon
export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user.id,
      isRead: false,
    });

    res.json({
      status: "success",
      unreadCount: count,
    });
  } catch (error) {
    next(error);
  }
};

//  POST - Manual broadcast by Society Admin or SuperAdmin
export const broadcastManual = async (req, res, next) => {
  try {
    const { title, message, category, targetAudience, societyId, recipientId } = req.body;

    const finalSocietyId = societyId || req.user.society;

    await createNotification({
      sender: req.user.id,
      recipient: targetAudience === "specific" ? recipientId : null,
      society: finalSocietyId,
      title,
      message,
      category: category || "general",
      targetAudience: targetAudience || "all",
      type: "info",
    });

    res.status(201).json({
      status: "success",
      message: targetAudience === "specific" ? "Notification sent to member" : "Broadcast notification sent successfully",
    });
  } catch (error) {
    next(error);
  }
};

// ==============================
// [FCM] DEVICE TOKEN MANAGEMENT
// ==============================

// POST - Device token register karo.
// Frontend login ke baad aur token refresh hone par ye call karta hai.
export const registerFcmToken = async (req, res, next) => {
  try {
    const token = typeof req.body?.token === "string" ? req.body.token.trim() : "";

    if (token.length < 20) {
      return res.status(400).json({
        status: "error",
        message: "Valid FCM token required",
      });
    }

    // Ek token ek hi user ka hona chahiye. Same browser/phone par guard logout
    // karke resident login kare, to token purane user ke doc me reh jata hai
    // aur usko dusre ke push milne lagte hain. Isliye pehle baaki sabse hatao.
    await User.updateMany(
      { _id: { $ne: req.user.id }, fcmTokens: token },
      { $pull: { fcmTokens: token } },
    );

    // $addToSet duplicate token add nahi karta.
    await User.updateOne(
      { _id: req.user.id },
      { $addToSet: { fcmTokens: token } },
    );

    res.json({
      status: "success",
      message: "Device registered for push notifications",
    });
  } catch (error) {
    next(error);
  }
};

// DELETE - Logout par device token hata do, warna logged-out device par
// bhi push aate rahenge.
export const unregisterFcmToken = async (req, res, next) => {
  try {
    const token = typeof req.body?.token === "string" ? req.body.token.trim() : "";

    if (!token) {
      return res.status(400).json({
        status: "error",
        message: "FCM token required",
      });
    }

    await User.updateOne(
      { _id: req.user.id },
      { $pull: { fcmTokens: token } },
    );

    res.json({
      status: "success",
      message: "Device unregistered",
    });
  } catch (error) {
    next(error);
  }
};

// GET - Push setup live hai ya nahi (live server par debugging ke liye).
// Credentials kabhi expose nahi karta, sirf enabled flag + reason.
export const pushStatus = async (req, res, next) => {
  try {
    res.json({ status: "success", push: getPushStatus() });
  } catch (error) {
    next(error);
  }
};
