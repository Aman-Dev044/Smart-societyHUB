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
  blockStaff,
  unblockStaff,
  blockedStaffList,
  getStaffAttendanceHistory,
  verifyStaff, // [MODULE-C]: Added verification controller
  updateStaffFlats,
  // [ONE-TIME] Approval-based technician / delivery gate flow
  oneTimeEntryRequest,
  respondToOneTimeRequest,
  oneTimeStaffList,
  myPendingOneTimeApprovals,
  } from "../controllers/staffController.js";

  import {
  createStaffValidation,
  validationMiddleware,
  } from "../middleware/staffValidation.js";

  import {
  uploadStaffDocuments, // [MODULE-C]: Handle document uploads
  uploadOneTimeStaffPhoto, // [ONE-TIME] Gate par liya gaya photo
  } from "../middleware/upload.js";

  // Test route to verify router is working
  router.get("/test", (req, res) => res.json({ message: "Staff routes are accessible" }));

  // ==============================
  // COMMUNITY STAFF DIRECTORY (Residents can view)
  // ==============================
  // Moving this to the top to ensure priority
  router.get("/directory", auth, permit("user", "society_admin", "guard"), staffLogs);

  // ==============================
  // [ONE-TIME] TECHNICIAN / DELIVERY GATE FLOW
  // ==============================
  //
  // Flow: guard entry request banata hai -> resident ko push jata hai ->
  // resident approve kare to attendance lagti hai -> guard exit mark karta hai
  // (POST /api/staff/exit).
  //
  // Ye routes `/:staffId` wale param routes se PEHLE hain, taaki "one-time"
  // kabhi staffId ki tarah match na ho.

  // GUARD: gate par entry request banao (flatNumber + purpose + photo zaroori)
  router.post(
  "/one-time/entry",
  auth,
  permit("guard", "society_admin"),
  uploadOneTimeStaffPhoto,
  oneTimeEntryRequest,
  );

  // Purana path — mobile/web dono ek hi behaviour par rahein isliye wahi
  // naya handler. (Pehle ye seedha attendance laga deta tha.)
  router.post(
  "/one-time-entry",
  auth,
  permit("guard", "society_admin"),
  uploadOneTimeStaffPhoto,
  oneTimeEntryRequest,
  );

  // RESIDENT: approve / reject
  router.post(
  "/one-time/respond",
  auth,
  permit("user", "society_admin"),
  respondToOneTimeRequest,
  );

  // RESIDENT: pending approval cards
  router.get(
  "/one-time/pending-approvals",
  auth,
  permit("user", "society_admin"),
  myPendingOneTimeApprovals,
  );

  // GUARD: alag tab — sirf One-time wale, normal visitors se mix nahi
  router.get(
  "/one-time/list",
  auth,
  permit("guard", "society_admin"),
  oneTimeStaffList,
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
