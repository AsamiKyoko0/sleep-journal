const mongoose = require("mongoose");

const entrySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", required: true,
    },
    date:    { type: String, required: true },   // "YYYY-MM-DD"
    day:     { type: String },                   // "Mon", "Tue"…
    bed:     { type: String, required: true },   // "23:00"
    wake:    { type: String, required: true },   // "07:00"
    dur:     { type: Number, required: true },   // minutes
    quality: { type: Number, min: 0, max: 5, default: 0 },
    wakes:   { type: [String], default: [] },
    good:    { type: [String], default: [] },
    bad:     { type: [String], default: [] },
    notes:   { type: String, default: "" },
  },
  { timestamps: true }
);

// One entry per user per date
entrySchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Entry", entrySchema);
