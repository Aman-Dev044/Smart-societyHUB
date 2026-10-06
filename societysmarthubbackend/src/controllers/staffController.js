import Staff from "../models/Staff.js";
import StaffAttendance from "../models/StaffAttendance.js";
import mongoose from "mongoose";
import { attachBaseUrl, attachBaseUrlToArray } from "../utils/addBaseUrl.js";
import {
  STAFF_OVERSTAY_HOURS,
  hoursInside,
  isOverstay,
  isDailyStaff,
} from "../config/staffOverstay.js";

// Attendance record par overstay info chipkao, taaki guard ki list me
// cron ka wait kiye bina hi red badge dikh sake.
const withOverstay = (staff, attendance, now) => {
  if (!attendance) return null;
  return {
    ...attendance,
    isOverstay: isDailyStaff(staff) && isOverstay(attendance, now),
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

    const newStaff = await Staff.create({
      society: req.user.society,
      staffName,
      mobileNumber,
      role,
      flatNumber,
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
// ONE-TIME STAFF ENTRY (GUARD)
// ==============================
export const oneTimeStaffEntry = async (req, res) => {
  try {
    const { staffName, mobileNumber } = req.body;

    if (!staffName || !mobileNumber) {
      return res.status(400).json({
        success: false,
        message: "Staff Name and Mobile Number are required",
      });
    }

    // 1. Check if staff exists
    let staff = await Staff.findOne({
      mobileNumber,
      society: req.user.society,
      staffType: "One-time",
    });

    let photoUrl = "";
    if (req.files && req.files.photo) {
      photoUrl = `/uploads/staff/documents/${req.files.photo[0].filename}`;
    }

    if (!staff) {
      // Create new One-time staff
      staff = await Staff.create({
        society: req.user.society,
        staffName,
        mobileNumber,
        staffType: "One-time",
        photo: photoUrl,
        role: "One-time Visitor",
        flatNumber: "N/A",
      });
    } else if (photoUrl) {
      // Update photo if provided
      staff.photo = photoUrl;
      await staff.save();
    }

    // 2. Mark Attendance (Entry)
    const today = new Date().toISOString().split("T")[0];

    // Check if already checked in today (just in case)
    const existingAttendance = await StaffAttendance.findOne({
      staff: staff._id,
      society: req.user.society,
      date: today,
      exitTime: null,
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: "This visitor is already inside the society",
      });
    }

    const attendance = await StaffAttendance.create({
      society: req.user.society,
      staff: staff._id,
      entryTime: new Date(),
      date: today,
    });

    return res.status(201).json({
      success: true,
      message: "One-time staff entry marked successfully",
      staff: attachBaseUrl(req, staff, ["photo"]),
      attendance,
    });
  } catch (error) {
    console.error("One-time Staff Entry Error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong during one-time entry",
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
        ...staff,
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

    const attendance = await StaffAttendance.findOne({
      staff: staffId,
      society: req.user.society,
      date: today,
    });

    if (!attendance) {
      return res.status(400).json({
        success: false,
        message: "Please mark entry first",
      });
    }

    if (attendance.exitTime) {
      return res.status(400).json({
        success: false,
        message: "Exit already marked today",
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
        ...staff,
        todayLog: withOverstay(staff, attendance, now),
      };
    });

    return res.status(200).json({
      success: true,
      message: "Staff logs fetched successfully",
      totalLogs: updatedLogs.length,
      overstayHours: STAFF_OVERSTAY_HOURS,
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
      .populate("staff", "staffName role flatNumber photo")
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

