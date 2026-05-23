const router  = require("express").Router();
const protect = require("../middleware/auth");
const Entry   = require("../models/Entry");

// All entry routes require a valid JWT
router.use(protect);

// ── GET /api/entries  — get all entries for current user (newest first) ──
router.get("/", async (req, res) => {
  try {
    const entries = await Entry.find({ user: req.user._id }).sort({ date: -1 });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/entries/week  — last 7 entries ──
router.get("/week", async (req, res) => {
  try {
    const entries = await Entry.find({ user: req.user._id })
      .sort({ date: -1 })
      .limit(7);
    res.json(entries.reverse()); // oldest → newest for charting
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/entries  — create a new entry ──
router.post("/", async (req, res) => {
  try {
    const { date, day, bed, wake, dur, quality, wakes, good, bad, notes } = req.body;
    if (!date || !bed || !wake || !dur)
      return res.status(400).json({ error: "date, bed, wake and dur are required." });

    // Prevent duplicate for same date
    const existing = await Entry.findOne({ user: req.user._id, date });
    if (existing)
      return res.status(409).json({ error: "You already have an entry for this date. Edit it instead." });

    const entry = await Entry.create({
      user: req.user._id,
      date, day, bed, wake, dur, quality, wakes, good, bad, notes,
    });
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/entries/:id  — edit an existing entry ──
router.patch("/:id", async (req, res) => {
  try {
    const entry = await Entry.findOne({ _id: req.params.id, user: req.user._id });
    if (!entry) return res.status(404).json({ error: "Entry not found." });

    const allowed = ["bed", "wake", "dur", "quality", "wakes", "good", "bad", "notes"];
    allowed.forEach(k => { if (req.body[k] !== undefined) entry[k] = req.body[k]; });
    await entry.save();
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/entries/:id  — delete an entry ──
router.delete("/:id", async (req, res) => {
  try {
    const entry = await Entry.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!entry) return res.status(404).json({ error: "Entry not found." });
    res.json({ message: "Entry deleted." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/entries/export  — download all entries as CSV ──
router.get("/export", async (req, res) => {
  try {
    const entries = await Entry.find({ user: req.user._id }).sort({ date: 1 });
    const headers = ["Date","Day","Bed","Wake","Duration (mins)","Quality","Woke up","Good habits","Bad habits","Notes"];
    const rows = entries.map(e => [
      e.date, e.day, e.bed, e.wake, e.dur, e.quality,
      `"${(e.wakes||[]).join("; ").replace(/"/g,'""')}"`,
      `"${(e.good||[]).join("; ").replace(/"/g,'""')}"`,
      `"${(e.bad||[]).join("; ").replace(/"/g,'""')}"`,
      `"${(e.notes||"").replace(/"/g,'""')}"`,
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="sleep-journal-${new Date().toISOString().slice(0,10)}.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
