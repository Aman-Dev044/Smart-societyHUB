import mongoose from "mongoose";

const staffSchema = new mongoose.Schema(
  {
    // Daily staff ke liye zaroori hai (createStaffValidation enforce karta hai).
    // One-time gate entry me naam nahi liya jata — wahan sirf photo, flat aur
    // purpose hota hai, isliye schema level par required nahi rakh sakte.
    staffName: {
      type: String,
      trim: true,
      default: "",
    },

    // Daily staff ke liye zaroori (validator me). One-time gate entry se mobile
    // number bilkul hata diya gaya hai — guard ko technician se number poochhne
    // ki zaroorat nahi padti.
    mobileNumber: {
      type: String,
      trim: true,
      default: "",
    },

    role: {
      type: String,
      trim: true,
      default: "Other",
    },

    // Staff kitne flats me kaam karta hai - yahi asli list hai.
    flatNumbers: {
      type: [String],
      default: [],
    },

    // Legacy display field. Ab ye flatNumbers se apne aap ban jata hai
    // ("A-101, B-202"), taaki purana data aur purani screens chalti rahein.
    flatNumber: {
      type: String,
      trim: true,
      default: "N/A",
    },

    staffType: {
      type: String,
      enum: ["Daily", "One-time"],
      default: "Daily",
    },

    vehicleNumber: {
      type: String,
      trim: true,
      default: "",
    },

    photo: {
      type: String,
      default: "",
    },

    // ===== [ONE-TIME GATE ENTRY] =====
    // Ye fields sirf staffType "One-time" par bharti hain. Guard gate par
    // technician/delivery ko capture karta hai, resident approve karta hai,
    // tab hi entry lagti hai.

    // Kis kaam se aaya hai — "AC repair", "Furniture delivery" etc. Zaroori hai.
    purpose: {
      type: String,
      trim: true,
      default: "",
    },

    // Optional extra detail — jaise bada saaman aaya ho to uski description.
    description: {
      type: String,
      trim: true,
      default: "",
    },

    // Resident ke approval ka status.
    // null  = Daily staff (inko approval nahi chahiye)
    // Pending/Approved/Rejected = One-time gate request
    //
    // NOTE: ye `status` (Active/Blocked) se alag cheez hai. `status` batata hai
    // ki staff society me allowed hai ya nahi; `approvalStatus` is ek visit ka
    // resident ka jawab hai.
    approvalStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: null,
    },

    // Kis guard ne gate par ye request banayi.
    requestedByGuard: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Kis resident ne approve/reject kiya aur kab.
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    respondedAt: {
      type: Date,
      default: null,
    },

    rejectionReason: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: ["Active", "Blocked"],
      default: "Active",
    },

    blockedReason: {
      type: String,
      default: "",
    },

    blockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    blockedAt: {
      type: Date,
      default: null,
    },

    guardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    society: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Society",
      required: true,
    },

    entryTime: {
      type: Date,
      default: Date.now,
    },

    exitTime: {
      type: Date,
      default: null,
    },

    // [MODULE-C]: Background Verification (BGV) & Document Vault
    isVerified: {
      type: Boolean,
      default: false,
    },

    documents: [
      {
        docType: { type: String }, // e.g., "Aadhar Card", "Police Clearance"
        docUrl: { type: String },
      },
    ],

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },
    // [MODULE-D]: Performance Metrics
    averageRating: {
      type: Number,
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

// Resident apne flat ka staff dhoondh sake.
staffSchema.index({ society: 1, flatNumbers: 1 });
staffSchema.index({ society: 1, mobileNumber: 1 });

// [ONE-TIME] Guard ka alag tab: us society ki One-time entries, newest pehle.
staffSchema.index({ society: 1, staffType: 1, createdAt: -1 });

// [ONE-TIME] Resident ke pending approval cards.
staffSchema.index({ society: 1, staffType: 1, approvalStatus: 1 });

// flatNumbers badle to display wala flatNumber bhi sync kar do.
staffSchema.pre("save", function (next) {
  if (this.isModified("flatNumbers") && this.flatNumbers?.length) {
    this.flatNumber = this.flatNumbers.join(", ");
  }
  next();
});

const Staff = mongoose.model("Staff", staffSchema);

export default Staff;
