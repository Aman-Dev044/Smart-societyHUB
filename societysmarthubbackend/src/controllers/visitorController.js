import mongoose from "mongoose";
import Visitor from "../models/Visitor.js";
import User from "../models/user.js";
import Notification from "../models/Notification.js";
import { createNotification } from "./notificationController.js"; 
import { logActivity } from "../utils/logActivity.js"; 
import { attachBaseUrl, attachBaseUrlToArray } from "../utils/addBaseUrl.js";
import {
  DEFAULT_VISIT_DURATION_MINS,
  MAX_VISIT_DURATION_MINS,
  isVisitorOverstay,
  minsOverstayed,
} from "../config/staffOverstay.js";

// ==============================
// CREATE VISITOR
// ==============================

export const createVisitor = async (req, res) => {
  try {
    const {
      visitorName,
      visitorPhone,
      vehicleNumber,
      purpose,
      visitDate,
      visitTime,
      flatNumber,
      memberId,
    } = req.body;

    let finalMemberId = memberId;
    let finalFlatNumber = flatNumber;

    // SECURE: If user is a regular resident, enforce their own data
    if (req.user.role === "user") {
      finalMemberId = req.user.id;
      
      // Fetch user's actual flat number to prevent spoofing
      const user = await User.findById(req.user.id);
      if (user && user.unit && user.unit.flatNumber) {
        finalFlatNumber = user.unit.flatNumber;
      }
    }

    // Generate a unique 4-digit verification code
    const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();

    const newVisitor = await Visitor.create({
      society: req.user.society,
      visitorName,
      visitorPhone,
      vehicleNumber,
      purpose,
      visitDate,
      visitTime,
      flatNumber: finalFlatNumber,
      memberId: finalMemberId,
      verificationCode,
    });

    // Explicitly add verificationCode to the response data to ensure it's returned
    const responseData = newVisitor.toObject();
    responseData.verificationCode = verificationCode;

    // [NEW] Trigger notification for the resident (Marked as Read so it shows in 'Sent' logs)
    if (finalMemberId) {
      await createNotification({
        sender: finalMemberId, // Set as sender to appear in 'Sent' tab
        recipient: finalMemberId,
        society: req.user.society,
        title: "Visitor Approval Generated", // Changed title to distinguish
        message: `Visitor Code Generated for ${visitorName}`, 
        category: "visitor",
        targetAudience: "specific",
        type: "success",
        isRead: true, // Mark as Read
        link: "/member/visitors",
      }).catch(err => console.error("Notification Error:", err));

      // [FINAL FAIL-SAFE] Trigger notification for GUARDS
      const currentSociety = new mongoose.Types.ObjectId(req.user.society);
      
      const guards = await User.find({
        society: currentSociety,
        role: { $regex: /^guard$/i } // Case-insensitive check
      });

      for (const guard of guards) {
        await createNotification({
          recipient: guard._id,
          society: req.user.society,
          title: "Visitor Alert",
          message: `Visitor ${visitorName} is arriving for flat ${finalFlatNumber}.`,
          category: "visitor",
          type: "info",
        }).catch(err => console.error("Direct Notification Error:", err));
      }

      // [NEW] Log Activity
      logActivity({
        userId: req.user.id,
        societyId: req.user.society,
        action: "visitor_entry",
        description: `New visitor pre-approved: ${visitorName} for flat ${finalFlatNumber}.`,
        meta: { visitorId: newVisitor._id, flatNumber: finalFlatNumber }
      });
      }


    return res.status(201).json({
      success: true,
      message: "Visitor created successfully",
      verificationCode, // Top-level for easy access
      data: responseData,
    });
  } catch (error) {
    console.error("Create Visitor Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating visitor",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// ==============================
// APPROVE VISITOR
// ==============================

export const approveVisitor = async (req, res) => {
  try {
    // SECURE_FLOW: Guard must provide the code given by the visitor
    const { visitorId, codeEnteredByGuard } = req.body;

    if (!visitorId || !codeEnteredByGuard) {
      return res.status(400).json({
        success: false,
        message: "Visitor ID and Verification Code are required",
      });
    }

    const visitor = await Visitor.findOne({
      _id: visitorId,
      society: req.user.society,
    });

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: "Visitor not found",
      });
    }

    // Already Approved Check
    if (visitor.status === "Approved") {
      return res.status(400).json({
        success: false,
        message: "Visitor already approved",
      });
    }

    // Already Rejected Check
    if (visitor.status === "Rejected") {
      return res.status(400).json({
        success: false,
        message: "Rejected visitor cannot be approved",
      });
    }

    // SECURE_FLOW: Verify if the code matches
    if (visitor.verificationCode !== codeEnteredByGuard) {
      return res.status(400).json({
        success: false,
        message: "Invalid Verification Code. Access Denied!",
      });
    }

    visitor.status = "Approved";
    visitor.approvedByGuard = true;
    visitor.entryTime = new Date();

    await visitor.save();

    // [NEW] Auto-mark related visitor notifications as read for all guards
    await Notification.updateMany(
      { 
        society: req.user.society, 
        category: "visitor",
        message: { $regex: new RegExp(visitor.visitorName, "i") },
        isRead: false 
      },
      { isRead: true }
    );

    // [NEW] Log Activity
    logActivity({
      userId: req.user.id,
      societyId: req.user.society,
      action: "visitor_entry",
      description: `Visitor ${visitor.visitorName} entered for flat ${visitor.flatNumber}.`,
      meta: { visitorId: visitor._id, flatNumber: visitor.flatNumber }
    });

    return res.status(200).json({
      success: true,
      message: "Visitor approved successfully",
      data: visitor,
    });
  } catch (error) {
    console.error("Approve Visitor Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while approving visitor",
      error: error.message,
    });
  }
};

// ==============================
// REJECT VISITOR
// ==============================

export const rejectVisitor = async (req, res) => {
  try {
    const { visitorId } = req.body;

    if (!visitorId) {
      return res.status(400).json({
        success: false,
        message: "Visitor ID is required",
      });
    }

    const visitor = await Visitor.findOne({
      _id: visitorId,
      society: req.user.society,
    });

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: "Visitor not found",
      });
    }

    // Already Rejected Check
    if (visitor.status === "Rejected") {
      return res.status(400).json({
        success: false,
        message: "Visitor already rejected",
      });
    }

    // Already Approved Check
    if (visitor.status === "Approved") {
      return res.status(400).json({
        success: false,
        message: "Approved visitor cannot be rejected",
      });
    }

    visitor.status = "Rejected";

    await visitor.save();

    return res.status(200).json({
      success: true,
      message: "Visitor rejected successfully",
      data: visitor,
    });
  } catch (error) {
    console.error("Reject Visitor Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while rejecting visitor",
      error: error.message,
    });
  }
};

// ==============================
// VISITOR EXIT
// ==============================

export const visitorExit = async (req, res) => {
  try {
    const { visitorId } = req.body;

    if (!visitorId) {
      return res.status(400).json({
        success: false,
        message: "Visitor ID is required",
      });
    }

    const visitor = await Visitor.findOne({
      _id: visitorId,
      society: req.user.society,
    });

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: "Visitor not found",
      });
    }

    // Exit Already Marked
    if (visitor.exitTime) {
      return res.status(400).json({
        success: false,
        message: "Visitor exit already marked",
      });
    }

    visitor.exitTime = new Date();

    await visitor.save();

    // [NEW] Log Activity
    logActivity({
      userId: req.user.id,
      societyId: req.user.society,
      action: "visitor_exit",
      description: `Visitor ${visitor.visitorName} exited from flat ${visitor.flatNumber}.`,
      meta: { visitorId: visitor._id, flatNumber: visitor.flatNumber }
    });

    return res.status(200).json({
      success: true,
      message: "Visitor exit marked successfully",
      data: visitor,
    });
  } catch (error) {
    console.error("Visitor Exit Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while marking visitor exit",
      error: error.message,
    });
  }
};

// ==============================
// VISITOR HISTORY
// ==============================
export const visitorHistory = async (req, res) => {
  try {
    const { flatNumber } = req.params;

    let query = {
      society: req.user.society,
    };

    // SECURE: If user is a regular resident, only show their flat's history
    if (req.user.role === "user") {
      const user = await User.findById(req.user.id);
      if (user && user.unit && user.unit.flatNumber) {
        query.flatNumber = user.unit.flatNumber;
      } else {
        return res.status(400).json({
          success: false,
          message: "Unit information not found for your account",
        });
      }
    } else {
      // For Admin/Guard, use the provided flatNumber or "all"
      if (flatNumber && flatNumber.toLowerCase() !== "all") {
        query.flatNumber = flatNumber;
      }
    }

    // SECURE_FLOW: Mask verification code if the user is a Guard
    let projection = {};
    if (req.user.role === "guard") {
      projection = { verificationCode: 0 };
    }

    const visitors = await Visitor.find(query, projection)
      .sort({ createdAt: -1 })
      .lean();

    // Guard ki list me cron ka wait kiye bina overstay dikhe, isliye yahin
    // calculate karke bhejte hain (wahi helpers jo cron use karta hai).
    const now = new Date();
    const enriched = visitors.map((v) => ({
      ...v,
      isOverstay: isVisitorOverstay(v, now),
      minsOverstayed: minsOverstayed(v, now),
    }));

    return res.status(200).json({
      success: true,
      message: "Visitor history fetched successfully",
      totalVisitors: enriched.length,
      defaultDurationMins: DEFAULT_VISIT_DURATION_MINS,
      data: attachBaseUrlToArray(req, enriched, ["photo"]),
    });
  } catch (error) {
    console.error("Visitor History Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching visitor history",
      error: error.message,
    });
  }
};


// ==============================
// [POINT 3] GATE ENTRY - Guard surprise visitor / technician capture karta hai
// ==============================
export const gateEntry = async (req, res) => {
  try {
    const { visitorName, visitorPhone, vehicleNumber, purpose, flatNumber } =
      req.body;

    if (!visitorName || !visitorPhone || !flatNumber || !purpose) {
      return res.status(400).json({
        success: false,
        message: "Visitor Name, Phone, Flat Number aur Purpose zaroori hain",
      });
    }

    // Us flat ke sab active residents dhoondho - notification sabko jayegi.
    const residents = await User.find({
      society: req.user.society,
      "unit.flatNumber": flatNumber,
      role: "user",
      isActive: true,
    }).select("_id name");

    if (residents.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Flat " + flatNumber + " ka koi active resident nahi mila",
      });
    }

    const photoUrl = req.file ? "/uploads/visitors/" + req.file.filename : "";

    const now = new Date();
    const visitor = await Visitor.create({
      society: req.user.society,
      requestType: "gate_request",
      visitorName,
      visitorPhone,
      vehicleNumber: vehicleNumber || "",
      purpose,
      flatNumber,
      photo: photoUrl,
      memberId: residents[0]._id,
      createdByGuard: req.user.id,
      status: "Pending",
      visitDate: now.toISOString().split("T")[0],
      visitTime: now.toTimeString().slice(0, 5),
    });

    // Resident ko ping - card ka poora data /visitors/pending-approvals se aata hai
    const vehicleLine = vehicleNumber ? " Vehicle: " + vehicleNumber + "." : "";
    for (const resident of residents) {
      await createNotification({
        recipient: resident._id,
        society: req.user.society,
        title: "Entry Request from Guard",
        message:
          visitorName + " (" + purpose + ") aapke flat " + flatNumber +
          " ke liye gate par hai." + vehicleLine +
          " Approve karne ke liye tap karein.",
        category: "visitor",
        type: "warning",
        link: "/member",
      }).catch((err) =>
        console.error("Gate entry notification error:", err.message),
      );
    }

    logActivity({
      userId: req.user.id,
      societyId: req.user.society,
      action: "visitor_entry",
      description:
        "Gate entry request raised for " + visitorName + " (" + purpose +
        ") at flat " + flatNumber + ".",
      meta: { visitorId: visitor._id, flatNumber, vehicleNumber },
    });

    return res.status(201).json({
      success: true,
      message: "Entry request resident ko bhej di gayi. Approval ka wait karein.",
      data: attachBaseUrl(req, visitor, ["photo"]),
    });
  } catch (error) {
    console.error("Gate Entry Error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating gate entry",
      error: error.message,
    });
  }
};

// ==============================
// [POINT 3] Resident gate request ko approve / reject karta hai
// ==============================
export const respondToGateRequest = async (req, res) => {
  try {
    const { visitorId, action, allowedDurationMins, rejectionReason } = req.body;

    if (!visitorId || !["approve", "reject"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'visitorId aur action ("approve" | "reject") zaroori hain',
      });
    }

    const visitor = await Visitor.findOne({
      _id: visitorId,
      society: req.user.society,
      requestType: "gate_request",
    });

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: "Gate request nahi mili",
      });
    }

    // SECURE: sirf usi flat ka resident respond kar sakta hai (admin exempt)
    if (req.user.role === "user") {
      const me = await User.findById(req.user.id).select("unit.flatNumber");
      if (!me || !me.unit || me.unit.flatNumber !== visitor.flatNumber) {
        return res.status(403).json({
          success: false,
          message: "Ye request aapke flat ki nahi hai",
        });
      }
    }

    if (visitor.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message:
          "Is request par pehle hi response ja chuka hai (" + visitor.status + ")",
      });
    }

    const now = new Date();
    visitor.respondedBy = req.user.id;
    visitor.respondedAt = now;

    if (action === "reject") {
      visitor.status = "Rejected";
      visitor.rejectionReason = rejectionReason || "";
    } else {
      // Resident jitni der allow kare; na bhejne par standard time.
      let mins = Number(allowedDurationMins) || DEFAULT_VISIT_DURATION_MINS;
      mins = Math.min(Math.max(Math.round(mins), 1), MAX_VISIT_DURATION_MINS);

      visitor.status = "Approved";
      visitor.allowedDurationMins = mins;
      visitor.entryTime = now;
    }

    await visitor.save();

    // Guards ko turant batao - unki screen poll par refresh hoti hai
    const guards = await User.find({
      society: req.user.society,
      role: { $regex: /^guard$/i },
      isActive: true,
    }).select("_id");

    const approved = visitor.status === "Approved";
    const guardMessage = approved
      ? visitor.visitorName + " ko flat " + visitor.flatNumber +
        " ne approve kar diya. Allowed: " + visitor.allowedDurationMins +
        " min. Access de sakte hain."
      : visitor.visitorName + " ko flat " + visitor.flatNumber +
        " ne reject kar diya." +
        (visitor.rejectionReason ? " Reason: " + visitor.rejectionReason : "");

    for (const guard of guards) {
      await createNotification({
        recipient: guard._id,
        society: req.user.society,
        title: approved ? "Entry Approved" : "Entry Rejected",
        message: guardMessage,
        category: "visitor",
        type: approved ? "success" : "error",
        link: "/daily-staff",
      }).catch((err) =>
        console.error("Gate response notification error:", err.message),
      );
    }

    logActivity({
      userId: req.user.id,
      societyId: req.user.society,
      action: "visitor_entry",
      description:
        "Gate request " + visitor.status.toLowerCase() + " for " +
        visitor.visitorName + " at flat " + visitor.flatNumber + ".",
      meta: {
        visitorId: visitor._id,
        flatNumber: visitor.flatNumber,
        allowedDurationMins: visitor.allowedDurationMins,
      },
    });

    return res.status(200).json({
      success: true,
      message: approved
        ? "Entry approve ho gayi (" + visitor.allowedDurationMins + " min)"
        : "Entry reject kar di gayi",
      data: attachBaseUrl(req, visitor, ["photo"]),
    });
  } catch (error) {
    console.error("Gate Response Error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while responding to gate request",
      error: error.message,
    });
  }
};

// ==============================
// [POINT 3] Resident ke pending gate requests (notification card ka data)
// ==============================
export const myPendingApprovals = async (req, res) => {
  try {
    const query = {
      society: req.user.society,
      requestType: "gate_request",
      status: "Pending",
    };

    if (req.user.role === "user") {
      const me = await User.findById(req.user.id).select("unit.flatNumber");
      if (!me || !me.unit || !me.unit.flatNumber) {
        return res.status(400).json({
          success: false,
          message: "Aapke account par flat number set nahi hai",
        });
      }
      query.flatNumber = me.unit.flatNumber;
    }

    const pending = await Visitor.find(query)
      .populate("createdByGuard", "name")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Pending approvals fetched successfully",
      totalPending: pending.length,
      defaultDurationMins: DEFAULT_VISIT_DURATION_MINS,
      data: attachBaseUrlToArray(req, pending, ["photo"]),
    });
  } catch (error) {
    console.error("Pending Approvals Error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching pending approvals",
      error: error.message,
    });
  }
};
