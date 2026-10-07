import Staff from "../models/Staff.js";
import StaffAttendance from "../models/StaffAttendance.js";
import User from "../models/user.js";
import mongoose from "mongoose";
import { attachBaseUrl, attachBaseUrlToArray } from "../utils/addBaseUrl.js";
import { flatsFromBody, normalizeFlatNumbers } from "../utils/flatNumbers.js";
import { createNotification } from "./notificationController.js";
import { logActivity } from "../utils/logActivity.js";
import {
  STAFF_OVERSTAY_HOURS,
  ONE_TIME_OVERSTAY_HOURS,
  hoursInside,
  isOverstay,
  overstayMsFor,
  overstayHoursFor,
} from "../config/staffOverstay.js";

// Purane staff records me flatNumbers field hai hi nahi (ye field baad me add
// hui). .lean() par Mongoose ka default [] bhi nahi lagta, isliye yahan legacy
// flatNumber se array bana dete hain - frontend ko hamesha array hi milta hai.
const withFlats = (staff) => {
  if (staff.flatNumbers?.length) return staff;

  const legacy = (staff.flatNumber || "")
    .split(",")
    .map((f) => f.trim())
    .filter((f) => f && f !== "N/A");

  return { ...staff, flatNumbers: legacy };
};

// Attendance record par overstay info chipkao, taaki guard ki list me
// cron ka wait kiye bina hi red badge dikh sake.
const withOverstay = (staff, attendance, now) => {
  if (!attendance) return null;
  return {
    ...attendance,
    // Daily aur One-time dono par overstay lagta hai, bas threshold alag hai.
    isOverstay: isOverstay(attendance, now, overstayMsFor(staff)),
    // UI "X hrs se zyada" likh sake, isliye threshold bhi bhej dete hain.
    overstayAfterHours: overstayHoursFor(staff),
    hoursInside: attendance.exitTime
      ? null
      : hoursInside(attendance.entryTime, now),
  };
};

export const createStaff = async (req, res) => {
  try {
    const {
      staffName,
      mobileNumber,
      role,
      flatNumber,
      vehicleNumber,
      photo,
      guardId,
    } = req.body;

    const existingStaff = await Staff.findOne({ mobileNumber });

    if (existingStaff) {
      return res.status(400).json({
        success: false,
        message: "Staff already exists",
      });
    }

    // [MODULE-C]: Handle document uploads and photo
    const documentArray = [];
    let photoUrl = "";

    if (req.files) {
      if (req.files.photo) {
        photoUrl = `/uploads/staff/documents/${req.files.photo[0].filename}`;
      }
      if (req.files.aadharCard) {
        documentArray.push({
          docType: "Aadhar Card",
          docUrl: `/uploads/staff/documents/${req.files.aadharCard[0].filename}`,
        });
      }
      if (req.files.policeVerification) {
        documentArray.push({
          docType: "Police Verification",
          docUrl: `/uploads/staff/documents/${req.files.policeVerification[0].filename}`,
        });
      }
    }

    // Ek se zyada flats support karte hain; flatNumber display mirror hai.
    const flatNumbers = flatsFromBody(req.body);

    const newStaff = await Staff.create({
      society: req.user.society,
      staffName,
      mobileNumber,
      role,
      flatNumbers,
      flatNumber: flatNumbers.join(", "),
      vehicleNumber,
      photo: photoUrl || photo, // Use uploaded photo URL or provided photo string
      guardId,
      documents: documentArray, // [MODULE-C]: Save document paths
      isVerified: false, // [MODULE-C]: Default to unverified
      staffType: "Daily", // Registered staff is always Daily
    });

    return res.status(201).json({
      success: true,
      message: "Staff created successfully",
      data: attachBaseUrl(req, newStaff, ["photo"]),
    });
  } catch (error) {
    console.error("CRITICAL ERROR in createStaff:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating staff",
      error: error.message,
    });
  }
};

// ==============================
// [ONE-TIME] GUARD GATE REQUEST — technician / delivery capture
// ==============================
//
// Pehle ye API seedha attendance laga deti thi. Ab flow approval-based hai:
//   guard form bharta hai -> resident ko push jata hai -> resident "Allow"
//   dabata hai -> tab entry lagti hai.
//
// Mobile number bilkul hata diya gaya hai — guard ko technician se number
// poochhne ki zaroorat nahi, photo + flat + purpose se kaam ho jata hai.
export const oneTimeEntryRequest = async (req, res) => {
  try {
    const flatNumber = String(req.body.flatNumber || "").trim();
    const purpose = String(req.body.purpose || "").trim();
    const description = String(req.body.description || "").trim();

    // Spec me naam nahi hai, par web form bheje to le lete hain (optional).
    const staffName = String(req.body.staffName || "").trim();

    if (!flatNumber || !purpose) {
      return res.status(400).json({
        success: false,
        message: "Flat Number aur Purpose zaroori hain",
      });
    }

    // Photo zaroori hai. uploadOneTimeStaffPhoto `.fields()` use karta hai to
    // req.files aata hai; `.single()` wale purane callers ke liye req.file bhi
    // check kar lete hain.
    const photoFile = req.files?.photo?.[0] || req.file || null;

    if (!photoFile) {
      return res.status(400).json({
        success: false,
        message: "Photo zaroori hai",
      });
    }

    // Us flat ke sab active residents — notification sabko jayegi, jo pehle
    // respond kare uska jawab chalega.
    const residents = await User.find({
      society: req.user.society,
      "unit.flatNumber": flatNumber,
      role: "user",
      isActive: true,
    }).select("_id name");

    if (residents.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Flat ${flatNumber} ka koi active resident nahi mila`,
      });
    }

    // Har gate visit apna alag record hai. Pehle mobileNumber se purana record
    // reuse hota tha, par ab number hi nahi hai — aur one-time ke liye reuse
    // galat bhi hoga, kyunki har visit ka apna approval, purpose aur photo hai.
    const staff = await Staff.create({
      society: req.user.society,
      staffType: "One-time",
      staffName, // khaali ho sakta hai
      mobileNumber: "", // one-time me number nahi liya jata
      role: "One-time Visitor",
      purpose,
      description,
      photo: `/uploads/staff/onetime/${photoFile.filename}`,
      flatNumbers: [flatNumber],
      flatNumber,
      approvalStatus: "Pending",
      requestedByGuard: req.user.id,
      // Approval se pehle andar nahi hai. Schema ka default Date.now hai,
      // isliye explicitly null bhejna zaroori hai.
      entryTime: null,
    });

    const who = staffName || purpose;
    const descLine = description ? ` Detail: ${description}.` : "";

    for (const resident of residents) {
      await createNotification({
        recipient: resident._id,
        society: req.user.society,
        title: "Entry Request from Guard",
        message:
          `${who} aapke flat ${flatNumber} ke liye gate par hai. ` +
          `Purpose: ${purpose}.${descLine} Approve karne ke liye tap karein.`,
        category: "visitor",
        type: "warning",
        link: "/member",
      }).catch((err) =>
        console.error("One-time entry notification error:", err.message),
      );
    }

    logActivity({
      userId: req.user.id,
      societyId: req.user.society,
      action: "visitor_entry",
      description:
        `One-time entry request raised for ${who} (${purpose}) at flat ${flatNumber}.`,
      meta: { staffId: staff._id, flatNumber, purpose },
    });

    return res.status(201).json({
      success: true,
      message:
        "Entry request resident ko bhej di gayi. Approval ka wait karein.",
      data: attachBaseUrl(req, staff, ["photo"]),
    });
  } catch (error) {
    console.error("One-time Entry Request Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating one-time entry request",
      error: error.message,
    });
  }
};

// ==============================
// [ONE-TIME] Resident request ko approve / reject karta hai
// ==============================
//
// Approve hone par hi StaffAttendance bante hai — yahi "entry lag gayi" hai.
export const respondToOneTimeRequest = async (req, res) => {
  try {
    const { staffId, action, rejectionReason } = req.body;

    if (!staffId || !["approve", "reject"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'staffId aur action ("approve" | "reject") zaroori hain',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(staffId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid staffId",
      });
    }

    const staff = await Staff.findOne({
      _id: staffId,
      society: req.user.society,
      staffType: "One-time",
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "One-time entry request nahi mili",
      });
    }

    // SECURE: sirf usi flat ka resident respond kar sakta hai (admin exempt).
    if (req.user.role === "user") {
      const me = await User.findById(req.user.id).select("unit.flatNumber");
      if (!me?.unit?.flatNumber || me.unit.flatNumber !== staff.flatNumber) {
        return res.status(403).json({
          success: false,
          message: "Ye request aapke flat ki nahi hai",
        });
      }
    }

    if (staff.approvalStatus !== "Pending") {
      return res.status(400).json({
        success: false,
        message: `Is request par pehle hi response ja chuka hai (${staff.approvalStatus})`,
      });
    }

    const now = new Date();
    staff.respondedBy = req.user.id;
    staff.respondedAt = now;

    let attendance = null;

    if (action === "reject") {
      staff.approvalStatus = "Rejected";
      staff.rejectionReason = rejectionReason || "";
      await staff.save();
    } else {
      staff.approvalStatus = "Approved";
      staff.entryTime = now;
      await staff.save();

      // Resident ka "Allow" = entry lag gayi.
      attendance = await StaffAttendance.create({
        society: staff.society,
        staff: staff._id,
        entryTime: now,
        date: now.toISOString().split("T")[0],
      });
    }

    const approved = staff.approvalStatus === "Approved";
    const who = staff.staffName || staff.purpose;

    // Guards ko turant batao — unki screen poll par refresh hoti hai.
    const guards = await User.find({
      society: req.user.society,
      role: { $regex: /^guard$/i },
      isActive: true,
    }).select("_id");

    const guardMessage = approved
      ? `${who} (${staff.purpose}) ko flat ${staff.flatNumber} ne approve kar diya. Entry lag gayi, access de sakte hain.`
      : `${who} (${staff.purpose}) ko flat ${staff.flatNumber} ne reject kar diya.` +
        (staff.rejectionReason ? ` Reason: ${staff.rejectionReason}` : "");

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
        console.error("One-time response notification error:", err.message),
      );
    }

    logActivity({
      userId: req.user.id,
      societyId: req.user.society,
      action: "visitor_entry",
      description:
        `One-time entry ${staff.approvalStatus.toLowerCase()} for ${who} ` +
        `(${staff.purpose}) at flat ${staff.flatNumber}.`,
      meta: { staffId: staff._id, flatNumber: staff.flatNumber },
    });

    return res.status(200).json({
      success: true,
      message: approved
        ? "Entry approve ho gayi, attendance lag gayi"
        : "Entry reject kar di gayi",
      data: attachBaseUrl(req, staff, ["photo"]),
      attendance,
    });
  } catch (error) {
    console.error("One-time Response Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while responding to one-time request",
      error: error.message,
    });
  }
};

// ==============================
// [ONE-TIME] Guard ka alag tab — sirf One-time (technician) wale
// ==============================
//
// Normal visitors / daily staff ke saath mix nahi hote. Guard yahi se exit
// bhi mark karta hai (POST /api/staff/exit), isliye response me attendance
// aur isInside flag bhejte hain.
//
// Query params:
//   status  = Pending | Approved | Rejected   (default: sab)
//   inside  = true -> sirf wo jo abhi andar hain (approved + exit nahi hua)
//   flat    = kisi ek flat ke
//   page / limit  (default 1 / 50)
export const oneTimeStaffList = async (req, res) => {
  try {
    const { status, inside, flat } = req.query;

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);

    const query = {
      society: req.user.society,
      staffType: "One-time",
    };

    if (status && ["Pending", "Approved", "Rejected"].includes(status)) {
      query.approvalStatus = status;
    }

    if (flat) {
      query.flatNumber = String(flat).trim();
    }

    // "inside" wale sirf approved ho sakte hain.
    if (inside === "true") {
      query.approvalStatus = "Approved";
    }

    const total = await Staff.countDocuments(query);

    let staffList = await Staff.find(query)
      .populate("requestedByGuard", "name")
      .populate("respondedBy", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // One-time staff ka ek hi attendance record hota hai (approval par banta
    // hai), isliye ek query me sabka utha lete hain.
    const ids = staffList.map((s) => s._id);

    const attendanceList = ids.length
      ? await StaffAttendance.find({
          staff: { $in: ids },
          society: req.user.society,
        })
          .sort({ createdAt: -1 })
          .lean()
      : [];

    const attendanceByStaff = new Map();
    for (const record of attendanceList) {
      const key = String(record.staff);
      // sort ke karan pehla record hi latest hai
      if (!attendanceByStaff.has(key)) attendanceByStaff.set(key, record);
    }

    const now = new Date();

    let data = staffList.map((staff) => {
      const attendance = attendanceByStaff.get(String(staff._id)) || null;

      const isInside = Boolean(
        staff.approvalStatus === "Approved" &&
          attendance?.entryTime &&
          !attendance?.exitTime,
      );

      return {
        ...staff,
        // UI ko kuch dikhane ke liye — one-time entry me naam optional hai.
        displayName: staff.staffName || staff.purpose || "One-time Visitor",
        attendance,
        isInside,
        hoursInside: isInside ? hoursInside(attendance.entryTime, now) : 0,
        // Technician allowed time se zyada andar hai — guard ko red badge
        // dikhane ke liye, cron ka wait kiye bina.
        isOverstay: isOverstay(attendance, now, overstayMsFor(staff)),
        overstayAfterHours: ONE_TIME_OVERSTAY_HOURS,
        canMarkExit: isInside,
      };
    });

    if (inside === "true") {
      data = data.filter((item) => item.isInside);
    }

    return res.status(200).json({
      success: true,
      message: "One-time staff list fetched successfully",
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      count: data.length,
      data: attachBaseUrlToArray(req, data, ["photo"]),
    });
  } catch (error) {
    console.error("One-time Staff List Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching one-time staff list",
      error: error.message,
    });
  }
};

// ==============================
// [ONE-TIME] Resident ke pending approval cards
// ==============================
export const myPendingOneTimeApprovals = async (req, res) => {
  try {
    const query = {
      society: req.user.society,
      staffType: "One-time",
      approvalStatus: "Pending",
    };

    // Resident ko sirf apne flat ki requests. Admin/guard ko sab dikhti hain.
    if (req.user.role === "user") {
      const me = await User.findById(req.user.id).select("unit.flatNumber");

      if (!me?.unit?.flatNumber) {
        return res.status(400).json({
          success: false,
          message: "Aapke account par flat number set nahi hai",
        });
      }

      query.flatNumber = me.unit.flatNumber;
    }

    const pending = await Staff.find(query)
      .populate("requestedByGuard", "name")
      .sort({ createdAt: -1 })
      .lean();

    const data = pending.map((staff) => ({
      ...staff,
      displayName: staff.staffName || staff.purpose || "One-time Visitor",
    }));

    return res.status(200).json({
      success: true,
      message: "Pending one-time approvals fetched successfully",
      count: data.length,
      data: attachBaseUrlToArray(req, data, ["photo"]),
    });
  } catch (error) {
    console.error("Pending One-time Approvals Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching pending approvals",
      error: error.message,
    });
  }
};

export const searchStaff = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    let dbQuery = {
      society: req.user.society,
      $or: [
        { staffName: { $regex: query, $options: "i" } },
        { mobileNumber: { $regex: query, $options: "i" } },
      ],
    };

    const staffList = await Staff.find(dbQuery).lean();

    const today = new Date().toISOString().split("T")[0];

    const todayAttendance = await StaffAttendance.find({
      society: req.user.society,
      date: today,
    }).lean();

    const now = new Date();

    const updatedStaff = staffList.map((staff) => {
      const attendance = todayAttendance.find(
        (item) => item.staff.toString() === staff._id.toString(),
      );

      return {
        ...withFlats(staff),
        todayLog: withOverstay(staff, attendance, now),
      };
    });

    return res.status(200).json({
      success: true,
      message: "Staff searched successfully",
      totalStaff: updatedStaff.length,
      overstayHours: STAFF_OVERSTAY_HOURS,
      data: attachBaseUrlToArray(req, updatedStaff, ["photo"]),
    });
  } catch (error) {
    console.error("Search Staff Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while searching staff",
      error: error.message,
    });
  }
};

export const staffEntry = async (req, res) => {
  try {
    const { staffId } = req.body;

    if (!staffId) {
      return res.status(400).json({
        success: false,
        message: "Staff ID is required",
      });
    }

    const staff = await Staff.findOne({
      _id: staffId,
      society: req.user.society,
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    if (staff.status === "Blocked") {
      return res.status(403).json({
        success: false,
        message: "This staff is blocked by admin",
      });
    }

    const today = new Date().toISOString().split("T")[0];

    let attendance = await StaffAttendance.findOne({
      staff: staffId,
      society: req.user.society,
      date: today,
    });

    if (attendance?.entryTime) {
      return res.status(400).json({
        success: false,
        message: "Entry already marked today",
      });
    }

    if (!attendance) {
      attendance = await StaffAttendance.create({
        society: req.user.society,
        staff: staffId,
        entryTime: new Date(),
        date: today,
      });
    } else {
      attendance.entryTime = new Date();
      await attendance.save();
    }

    return res.status(200).json({
      success: true,
      message: "Staff entry marked successfully",
      data: attendance,
    });
  } catch (error) {
    console.error("Staff Entry Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while marking staff entry",
      error: error.message,
    });
  }
};

export const staffExit = async (req, res) => {
  try {
    const { staffId } = req.body;

    if (!staffId) {
      return res.status(400).json({
        success: false,
        message: "Staff ID is required",
      });
    }

    const staff = await Staff.findOne({
      _id: staffId,
      society: req.user.society,
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    const today = new Date().toISOString().split("T")[0];

    // Pehle aaj ka open record dhoondho.
    let attendance = await StaffAttendance.findOne({
      staff: staffId,
      society: req.user.society,
      date: today,
      exitTime: null,
    });

    // Na mile to koi bhi open record. Zaroori hai kyunki entry raat 11 baje
    // lag sakti hai aur exit agle din 1 baje — tab `date` kal ka hota hai aur
    // sirf aaj dhoondhne par guard exit mark hi nahi kar pata tha.
    if (!attendance) {
      attendance = await StaffAttendance.findOne({
        staff: staffId,
        society: req.user.society,
        exitTime: null,
      }).sort({ entryTime: -1 });
    }

    if (!attendance) {
      // Aaj ka record hai par exit already ho chuka hai? Alag message do,
      // warna "Please mark entry first" confusing lagta hai.
      const closedToday = await StaffAttendance.findOne({
        staff: staffId,
        society: req.user.society,
        date: today,
      });

      return res.status(400).json({
        success: false,
        message: closedToday
          ? "Exit already marked today"
          : "Please mark entry first",
      });
    }

    attendance.exitTime = new Date();

    await attendance.save();

    return res.status(200).json({
      success: true,
      message: "Staff exit marked successfully",
      data: attendance,
    });
  } catch (error) {
    console.error("Staff Exit Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while marking staff exit",
      error: error.message,
    });
  }
};

export const staffLogs = async (req, res) => {
  try {
    const { type } = req.query; // Filter by staffType (Daily/One-time)
    const today = new Date().toISOString().split("T")[0];

    let query = {
      society: req.user.society,
    };

    if (type) {
      query.staffType = type;
    }

    // Sort by createdAt: -1 to show newest staff at the top
    const staffList = await Staff.find(query).sort({ createdAt: -1 }).lean();

    const attendanceList = await StaffAttendance.find({
      society: req.user.society,
      date: today,
    }).lean();

    const now = new Date();

    const updatedLogs = staffList.map((staff) => {
      const attendance = attendanceList.find(
        (item) => item.staff.toString() === staff._id.toString(),
      );

      return {
        ...withFlats(staff),
        todayLog: withOverstay(staff, attendance, now),
      };
    });

    return res.status(200).json({
      success: true,
      message: "Staff logs fetched successfully",
      totalLogs: updatedLogs.length,
      overstayHours: STAFF_OVERSTAY_HOURS,
      oneTimeOverstayHours: ONE_TIME_OVERSTAY_HOURS,
      data: attachBaseUrlToArray(req, updatedLogs, ["photo"]),
    });
  } catch (error) {
    console.error("Staff Logs Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching staff logs",
      error: error.message,
    });
  }
};
export const getStaffAttendanceHistory = async (req, res) => {
  try {
    const { staffId } = req.params;

    if (!staffId) {
      return res.status(400).json({
        success: false,
        message: "Staff ID is required",
      });
    }

    const history = await StaffAttendance.find({
      staff: staffId,
      society: req.user.society,
    })
      .populate("staff", "staffName role flatNumber flatNumbers photo")
      .sort({
        createdAt: -1,
      });

    const updatedHistory = history.map(log => {
      const logObj = log.toObject();
      if (logObj.staff) {
        logObj.staff = attachBaseUrl(req, logObj.staff, ["photo"]);
      }
      return logObj;
    });

    return res.status(200).json({
      success: true,
      message: "Staff attendance history fetched successfully",
      totalHistory: updatedHistory.length,
      data: updatedHistory,
    });
  } catch (error) {
    console.error("Get Staff Attendance History Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching staff attendance history",
      error: error.message,
    });
  }
};

export const blockStaff = async (req, res) => {
  try {
    const { staffId, blockedReason, blockedBy } = req.body;

    if (!staffId) {
      return res.status(400).json({
        success: false,
        message: "Staff ID is required",
      });
    }

    if (!blockedReason) {
      return res.status(400).json({
        success: false,
        message: "Blocked reason is required",
      });
    }

    const staff = await Staff.findOne({
      _id: staffId,
      society: req.user.society,
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    if (staff.status === "Blocked") {
      return res.status(400).json({
        success: false,
        message: "Staff is already blocked",
      });
    }

    staff.status = "Blocked";
    staff.blockedReason = blockedReason;
    staff.blockedBy = blockedBy || null;
    staff.blockedAt = new Date();

    await staff.save();

    return res.status(200).json({
      success: true,
      message: "Staff blocked successfully",
      data: staff,
    });
  } catch (error) {
    console.error("Block Staff Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while blocking staff",
      error: error.message,
    });
  }
};

export const unblockStaff = async (req, res) => {
  try {
    const { staffId } = req.body;

    if (!staffId) {
      return res.status(400).json({
        success: false,
        message: "Staff ID is required",
      });
    }

    const staff = await Staff.findOne({
      _id: staffId,
      society: req.user.society,
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    if (staff.status === "Active") {
      return res.status(400).json({
        success: false,
        message: "Staff is already active",
      });
    }

    staff.status = "Active";
    staff.blockedReason = "";
    staff.blockedBy = null;
    staff.blockedAt = null;

    await staff.save();

    return res.status(200).json({
      success: true,
      message: "Staff unblocked successfully",
      data: staff,
    });
  } catch (error) {
    console.error("Unblock Staff Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while unblocking staff",
      error: error.message,
    });
  }
};

export const blockedStaffList = async (req, res) => {
  try {
    const blockedStaff = await Staff.find({
      status: "Blocked",
      society: req.user.society,
    }).sort({
      blockedAt: -1,
    });

    return res.status(200).json({
      success: true,
      message: blockedStaff.length ? "Blocked staff fetched successfully" : "No blocked staff found",
      totalBlockedStaff: blockedStaff.length,
      data: blockedStaff,
    });
  } catch (error) {
    console.error("Blocked Staff List Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching blocked staff",
      error: error.message,
    });
  }
};

// ==============================
// [MODULE-C]: VERIFY STAFF DOCUMENTS
// ==============================
export const verifyStaff = async (req, res) => {
  try {
    const { staffId } = req.params;

    if (!staffId) {
      return res.status(400).json({
        success: false,
        message: "Staff ID is required",
      });
    }

    const staff = await Staff.findOne({
      _id: staffId,
      society: req.user.society,
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    // [MODULE-C]: If documents are uploaded during verification, add them
    if (req.files) {
      const documentArray = staff.documents || [];
      if (req.files.aadharCard) {
        documentArray.push({
          docType: "Aadhar Card",
          docUrl: `/uploads/staff/documents/${req.files.aadharCard[0].filename}`,
        });
      }
      if (req.files.policeVerification) {
        documentArray.push({
          docType: "Police Verification",
          docUrl: `/uploads/staff/documents/${req.files.policeVerification[0].filename}`,
        });
      }
      staff.documents = documentArray;
    }

    staff.isVerified = true;
    staff.verifiedBy = new mongoose.Types.ObjectId(req.user.id); 
    staff.verifiedAt = new Date();

    await staff.save();

    // Fetch and populate verifiedBy to show Admin Name and Email
    const updatedStaff = await Staff.findById(staff._id).populate("verifiedBy", "name email");

    return res.status(200).json({
      success: true,
      message: `${staff.staffName} has been verified successfully`,
      data: updatedStaff,
    });
  } catch (error) {
    console.error("Verify Staff Error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while verifying staff",
      error: error.message,
    });
  }
};


// ==============================
// UPDATE STAFF FLATS
// Staff naye flats me kaam shuru kar de ya chhod de to list yahan se badlti hai.
// ==============================
export const updateStaffFlats = async (req, res) => {
  try {
    const { staffId } = req.params;

    const flatNumbers = normalizeFlatNumbers(
      req.body.flatNumbers ?? req.body.flatNumber,
    );

    if (flatNumbers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Kam se kam ek flat number zaroori hai",
      });
    }

    const staff = await Staff.findOne({
      _id: staffId,
      society: req.user.society,
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    staff.flatNumbers = flatNumbers;
    await staff.save(); // pre-save hook flatNumber mirror update kar dega

    return res.status(200).json({
      success: true,
      message: "Staff flats updated successfully",
      data: attachBaseUrl(req, staff, ["photo"]),
    });
  } catch (error) {
    console.error("Update Staff Flats Error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while updating staff flats",
      error: error.message,
    });
  }
};
