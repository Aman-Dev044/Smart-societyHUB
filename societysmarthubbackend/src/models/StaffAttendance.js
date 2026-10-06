import mongoose from "mongoose";

const staffAttendanceSchema = new mongoose.Schema(
  {
    society: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Society",
      required: true,
    },

    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
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

    date: {
      type: String,
      required: true,
    },

    // Overstay alert kab bheja gaya (null = abhi tak nahi bheja).
    // Isse cron har tick par duplicate alert nahi banata.
    overstayAlertedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Overstay cron scan: open records jinka alert abhi bheja nahi gaya.
staffAttendanceSchema.index({ exitTime: 1, overstayAlertedAt: 1, entryTime: 1 });

export default mongoose.model("StaffAttendance", staffAttendanceSchema);
