// models/Visitor.js

import mongoose from "mongoose";

const visitorSchema = new mongoose.Schema(
  {
    visitorName: {
      type: String,
      required: true,
      trim: true,
    },

    visitorPhone: {
      type: String,
      required: true,
      trim: true,
    },

    vehicleNumber: {
      type: String,
      trim: true,
      default: "",
    },

    purpose: {
      type: String,
      required: true,
      trim: true,
    },

    visitDate: {
      type: String,
      required: true,
    },

    visitTime: {
      type: String,
      required: true,
    },

    flatNumber: {
      type: String,
      required: true,
      trim: true,
    },

    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    // Kaun sa flow hai:
    //  pre_approved  = resident ne pehle se visitor add kiya (Point 1)
    //  gate_request  = guard ne gate par surprise visitor/technician capture kiya (Point 3)
    requestType: {
      type: String,
      enum: ["pre_approved", "gate_request"],
      default: "pre_approved",
      index: true,
    },

    // Gate par guard ka liya hua photo (sirf gate_request me)
    photo: {
      type: String,
      default: "",
    },

    // Kis guard ne gate entry banayi
    createdByGuard: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Kis resident ne approve/reject kiya aur kab
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

    // Resident ne kitni der ke liye access diya (minutes).
    // Isi se overstay calculate hota hai.
    allowedDurationMins: {
      type: Number,
      default: null,
      min: 1,
    },

    // Overstay alert kab bheja gaya (null = abhi tak nahi).
    // Isse cron har tick par duplicate alert nahi banata.
    overstayAlertedAt: {
      type: Date,
      default: null,
    },

    society: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Society",
      required: true,
    },

    entryTime: {
      type: Date,
      default: null,
    },

    exitTime: {
      type: Date,
      default: null,
    },

    approvedByGuard: {
      type: Boolean,
      default: false,
    },

    // CHANGED: System-generated verification code (Required)
    verificationCode: {
      type: String,
      required: function () {
        return this.requestType !== "gate_request";
      },
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

visitorSchema.index({ society: 1, flatNumber: 1 });
// Overstay cron scan: approved visitors jo abhi andar hain.
visitorSchema.index({ status: 1, exitTime: 1, overstayAlertedAt: 1, entryTime: 1 });

const Visitor = mongoose.model("Visitor", visitorSchema);

export default Visitor;
