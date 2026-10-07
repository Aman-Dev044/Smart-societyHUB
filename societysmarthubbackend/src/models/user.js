import mongoose from "mongoose";

const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    // --- basic identity ---
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },

    role: {
      type: String,
      enum: ["superadmin", "society_admin", "guard", "user"],
      default: "user",
    },
    society: {
      type: Schema.Types.ObjectId,
      ref: "Society",
      default: null,
    },

    // --- KYC / fraud-prevention (required for society_admin) ---
    kyc: {
      aadhaarNumber: { type: String, trim: true }, // masked/last 4 digits only
      panNumber: { type: String, uppercase: true, trim: true },
      governmentIdUrl: { type: String, trim: true }, // uploaded ID proof
      addressProofUrl: { type: String, trim: true }, // uploaded address proof
      verified: { type: Boolean, default: false },
      verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
      verifiedAt: { type: Date },
      remarks: { type: String, trim: true },
    },

    // --- contact / address ---
    address: {
      line1: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      pincode: { type: String, trim: true },
    },

    // --- flat / unit ownership ---
    unit: {
      flatNumber: { type: String, trim: true },
      towerBlock: { type: String, trim: true },
      floor: { type: Number, min: 0 },
      type: {
        type: String,
        enum: [
          "1BHK",
          "2BHK",
          "3BHK",
          "4BHK",
          "studio",
          "penthouse",
          "shop",
          "office",
          "other",
        ],
      },
      areaSqFt: { type: Number, min: 0 },
      ownershipType: {
        type: String,
        enum: ["owner", "tenant", "family_member"],
        default: "owner",
      },
      ownerName: { type: String, trim: true }, // actual owner if user is tenant
      ownerPhone: { type: String, trim: true }, // owner contact if tenant
      parkingSlots: [{ type: String, trim: true }], // e.g. ["B1-45", "B1-46"]
      moveInDate: { type: Date },
    },

    // --- family / occupants ---
    familyMembers: { type: Number, default: 1, min: 1 },

    // --- vehicles ---
    vehicles: [
      {
        type: {
          type: String,
          enum: ["car", "bike", "scooter", "other"],
          required: true,
        },
        model: { type: String, trim: true },
        vehicleNumber: { type: String, trim: true, uppercase: true },
      },
    ],

    // --- id proof ---
    idProof: {
      type: {
        type: String,
        enum: [
          "aadhaar",
          "pan",
          "driving_license",
          "passport",
          "voter_id",
          "other",
        ],
      },
      number: { type: String, trim: true },
      documentUrl: { type: String, trim: true },
    },

    // --- profile ---
    profilePicUrl: { type: String, trim: true },
    designation: { type: String, trim: true },

    language: { type: String, default: "en", trim: true }, // e.g. "en", "hi", "mr"
    
    preferences: {
      notifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        push: { type: Boolean, default: true },
      },
      theme: { type: String, enum: ["light", "dark", "system"], default: "light" },
    },

    // FCM device tokens — ek user ke multiple device ho sakte hain (phone +
    // laptop browser), push sabhi par jata hai. Dead tokens (app uninstall,
    // browser data clear) pushService response se detect karke khud hata deta hai.
    fcmTokens: {
      type: [String],
      default: [],
    },

    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },

    guardDetails: {
      shift: {
        type: String,
        enum: ["morning", "evening", "night"],
      },

      employeeId: {
        type: String,
        trim: true,
      },

      joiningDate: {
        type: Date,
      },
    },
  },
  {
    timestamps: true,
  },
);

// --- Indexes ---
UserSchema.index({ phone: 1 });
UserSchema.index({ society: 1, role: 1 });
UserSchema.index({ society: 1, "unit.flatNumber": 1, "unit.towerBlock": 1 });
UserSchema.index({ "kyc.panNumber": 1 }, { sparse: true });

// Dead FCM token prune karte waqt token se user dhoondhna padta hai.
UserSchema.index({ fcmTokens: 1 }, { sparse: true });

UserSchema.index({ role: 1, society: 1 });

export default mongoose.model("User", UserSchema);
