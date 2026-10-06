import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure uploads directory exists
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Storage config — saves files in organized subfolders
function createStorage(subfolder) {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join("uploads", subfolder);
      ensureDir(dir);
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e6)}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  });
}

// File filter — only images
function imageFilter(req, file, cb) {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (jpg, png, gif, webp) are allowed"), false);
  }
}

// File filter — images + PDFs (for attachments)
function fileFilter(req, file, cb) {
  const allowed = /jpeg|jpg|png|gif|webp|pdf/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype) || file.mimetype === "application/pdf";
  if (ext && mime) {
    cb(null, true);
  } else {
    cb(new Error("Only image files and PDFs are allowed"), false);
  }
}

const MB = 1024 * 1024;

// ─── Pre-configured upload middlewares ──────────────────────────────

// Platform logo (system settings) — single image
export const uploadPlatformLogo = multer({
  storage: createStorage("platform"),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * MB },
}).single("logo");

// Society logo — single image
export const uploadSocietyLogo = multer({
  storage: createStorage("societies"),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * MB },
}).single("logo");

// KYC documents — governmentId + addressProof
export const uploadKycDocs = multer({
  storage: createStorage("kyc"),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * MB },
}).fields([
  { name: "governmentIdDoc", maxCount: 1 },
  { name: "addressProofDoc", maxCount: 1 },
]);

// Profile picture — single image
export const uploadProfilePic = multer({
  storage: createStorage("profiles"),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * MB },
}).single("profilePic");

// Notice images + attachments
export const uploadNoticeFiles = multer({
  storage: createStorage("notices"),
  fileFilter: fileFilter,
  limits: { fileSize: 10 * MB },
}).fields([
  { name: "images", maxCount: 5 },
  { name: "attachments", maxCount: 5 },
]);

// Complaint images
export const uploadComplaintImages = multer({
  storage: createStorage("complaints"),
  fileFilter: imageFilter,
  limits: { fileSize: 10 * MB },
}).array("images", 5);

// Charge proof image — single
export const uploadChargeProof = multer({
  storage: createStorage("charges"),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * MB },
}).single("proofImage");

// Payment screenshot — single
export const uploadPaymentScreenshot = multer({
  storage: createStorage("payments"),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * MB },
}).single("paymentScreenshot");

// User ID proof document — single image
export const uploadUserIdProof = multer({
  storage: createStorage("idproofs"),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * MB },
}).single("idProofDoc");

// [MODULE-C]: Staff Verification Documents (Aadhar + Police Clearance)
export const uploadStaffDocuments = multer({
  storage: createStorage("staff/documents"),
  fileFilter: fileFilter, // Images + PDFs allowed
  limits: { fileSize: 10 * MB },
}).fields([
  { name: "photo", maxCount: 1 },
  { name: "aadharCard", maxCount: 1 },
  { name: "policeVerification", maxCount: 1 },
]);

// Gate-captured visitor photo (surprise visitor / technician) — single image
export const uploadVisitorPhoto = multer({
  storage: createStorage("visitors"),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * MB },
}).single("photo");

// Society Documents (Bylaws, Forms, Reports)
export const uploadSocietyDocument = multer({
  storage: createStorage("documents"),
  fileFilter: fileFilter, // Images + PDFs allowed
  limits: { fileSize: 20 * MB }, // Larger limit for documents
}).single("documentFile");

