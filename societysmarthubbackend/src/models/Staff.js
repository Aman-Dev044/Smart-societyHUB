import mongoose from "mongoose";

const staffSchema = new mongoose.Schema(
  {
    staffName: {
      type: String,
      required: true,
      trim: true,
    },

    mobileNumber: {
      type: String,
      required: true,
      trim: true,
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

// flatNumbers badle to display wala flatNumber bhi sync kar do.
staffSchema.pre("save", function (next) {
  if (this.isModified("flatNumbers") && this.flatNumbers?.length) {
    this.flatNumber = this.flatNumbers.join(", ");
  }
  next();
});

const Staff = mongoose.model("Staff", staffSchema);

export default Staff;
