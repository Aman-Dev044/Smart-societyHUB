import express from "express";

const router = express.Router();

import auth from "../middleware/auth.js";
import { permit } from "../middleware/roles.js";

import {
  createStaff,
  searchStaff,
  staffEntry,
  staffExit,
  staffLogs,
  oneTimeStaffEntry,
  blockStaff,
  unblockStaff,
  blockedStaffList,
  getStaffAttendanceHistory,
  verifyStaff, // [MODULE-C]: Added verification controller
  updateStaffFlats,
  } from "../controllers/staffController.js";

  import {
  createStaffValidation,
  validationMiddleware,
  } from "../middleware/staffValidation.js";

  import { uploadStaffDocuments } from "../middleware/upload.js"; // [MODULE-C]: Handle document uploads

  // Test route to verify router is working
  router.get("/test", (req, res) => res.json({ message: "Staff routes are accessible" }));

  // ==============================
  // COMMUNITY STAFF DIRECTORY (Residents can view)
  // ==============================
  // Moving this to the top to ensure priority
  router.get("/directory", auth, permit("user", "society_admin", "guard"), staffLogs);

  // ==============================
  // ONE-TIME STAFF ENTRY (GUARD)
  // ==============================
  router.post(
  "/one-time-entry",
  auth,
  permit("guard", "society_admin"),
  uploadStaffDocuments,
  oneTimeStaffEntry,
  );

  // ==============================
  // MEMBER CREATE STAFF
  // ==============================

  router.post(
  "/create",
  auth,
  permit("society_admin", "guard"),
  uploadStaffDocuments, // [MODULE-C]: Handle document uploads
  createStaffValidation,
  validationMiddleware,
  createStaff,
  );

// ==============================
// [MODULE-C]: ADMIN VERIFY STAFF
// ==============================

router.patch(
  "/verify-member/:staffId",
  auth,
  permit("society_admin"),
  uploadStaffDocuments, // Add this to handle file uploads
  verifyStaff,
);

// ==============================
// GUARD SEARCH STAFF
// ==============================

router.get(
  "/search",
  auth,
  permit("guard", "society_admin"),
  searchStaff,
);

// ==============================
// GUARD STAFF ENTRY
// ==============================

router.post(
  "/entry",
  auth,
  permit("guard", "society_admin"),
  staffEntry,
);

// ==============================
// GUARD STAFF EXIT
// ==============================

router.post(
  "/exit",
  auth,
  permit("guard", "society_admin"),
  staffExit,
);

// ==============================
// ADMIN STAFF LOGS
// ==============================

router.get("/logs", auth, permit("society_admin", "guard"), staffLogs);

// ==============================
// ADMIN BLOCK STAFF
// ==============================

router.post("/block", auth, permit("society_admin"), blockStaff);

// ==============================
// ADMIN UNBLOCK STAFF
// ==============================

router.post("/unblock", auth, permit("society_admin"), unblockStaff);

// ==============================
// ADMIN BLOCKED STAFF LIST
// ==============================

router.get(
  "/blocked-list",
  auth,
  permit("society_admin", "guard"),
  blockedStaffList,
);

// ==============================
// UPDATE STAFF FLATS (kaunse flats me kaam karta hai)
// ==============================

router.patch(
  "/:staffId/flats",
  auth,
  permit("society_admin", "guard"),
  updateStaffFlats,
);

router.get("/attendance-history/:staffId", auth, getStaffAttendanceHistory);

export default router;
