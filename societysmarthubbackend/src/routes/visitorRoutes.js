import express from "express";

const router = express.Router();

import auth from "../middleware/auth.js";
import { permit } from "../middleware/roles.js";

import {
  createVisitor,
  approveVisitor,
  rejectVisitor,
  visitorExit,
  visitorHistory,
  gateEntry,
  respondToGateRequest,
  myPendingApprovals,
} from "../controllers/visitorController.js";

import {
  createVisitorValidation,
  validationMiddleware,
} from "../middleware/visitorValidation.js";

import { uploadVisitorPhoto } from "../middleware/upload.js";

// ==============================
// MEMBER CREATE VISITOR
// ==============================

router.post(
  "/create",
  auth,
  permit("user", "society_admin"),
  createVisitorValidation,
  validationMiddleware,
  createVisitor,
);

// ==============================
// GUARD APPROVE VISITOR
// ==============================

router.post(
  "/approve",
  auth,
  permit("guard", "society_admin"),
  approveVisitor,
);

// ==============================
// GUARD REJECT VISITOR
// ==============================

router.post(
  "/reject",
  auth,
  permit("guard", "society_admin"),
  rejectVisitor,
);

// ==============================
// GUARD MARK EXIT
// ==============================

router.post(
  "/exit",
  auth,
  permit("guard", "society_admin"),
  visitorExit,
);

// ==============================
// MEMBER HISTORY
// ==============================

router.get(
  "/history/:flatNumber",
  auth,
  permit("user", "society_admin", "guard"),
  visitorHistory,
);

// ==============================
// [POINT 3] GUARD GATE ENTRY (surprise visitor / technician)
// ==============================

router.post(
  "/gate-entry",
  auth,
  permit("guard", "society_admin"),
  uploadVisitorPhoto,
  gateEntry,
);

// ==============================
// [POINT 3] RESIDENT APPROVE / REJECT GATE REQUEST
// ==============================

router.post(
  "/respond",
  auth,
  permit("user", "society_admin"),
  respondToGateRequest,
);

// ==============================
// [POINT 3] RESIDENT PENDING APPROVAL CARDS
// ==============================

router.get(
  "/pending-approvals",
  auth,
  permit("user", "society_admin"),
  myPendingApprovals,
);

export default router;
