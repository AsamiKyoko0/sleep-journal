const router = require("express").Router();
const jwt    = require("jsonwebtoken");
const User   = require("../models/User");

function makeToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ error: "All fields are required." });

    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists)
      return res.status(409).json({ error: "Username or email already taken." });

    const user = await User.create({ username, email, password });
    res.status(201).json({
      token: makeToken(user._id),
      user:  { id: user._id, username: user.username, email: user.email, sleepGoalMins: user.sleepGoalMins },
    });
  } catch (err) {
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required." });

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ error: "Invalid email or password." });

    res.json({
      token: makeToken(user._id),
      user:  { id: user._id, username: user.username, email: user.email, sleepGoalMins: user.sleepGoalMins, displayName: user.displayName, },
    });
  } catch (err) {
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

// GET /api/auth/me  — return current user profile
router.get("/me", require("../middleware/auth"), async (req, res) => {
  res.json({
    id: req.user._id, 
    username: req.user.username,
    displayName: req.user.displayName,
    email: req.user.email, 
    sleepGoalMins: req.user.sleepGoalMins,
  });
});

// PATCH /api/auth/goal — update sleep goal
router.patch("/goal", require("../middleware/auth"), async (req, res) => {
  try {
    const { sleepGoalMins } = req.body;
    if (!sleepGoalMins || sleepGoalMins < 60 || sleepGoalMins > 720)
      return res.status(400).json({ error: "Goal must be between 60 and 720 minutes." });

    req.user.sleepGoalMins = sleepGoalMins;
    await req.user.save();
    res.json({ sleepGoalMins: req.user.sleepGoalMins });
  } catch (err) {
    res.status(500).json({ error: "Server error: " + err.message });
  }
});


router.patch('/profile', require('../middleware/auth'), async (req, res) => {
  try {
    const { displayName, age, gender, sleepChallenge, typicalBedtime } = req.body;
    if (displayName !== undefined) req.user.displayName    = displayName;
    if (age !== undefined)         req.user.age            = age;
    if (gender !== undefined)      req.user.gender         = gender;
    if (sleepChallenge !== undefined) req.user.sleepChallenge = sleepChallenge;
    if (typicalBedtime !== undefined) req.user.typicalBedtime = typicalBedtime;
    await req.user.save();
    res.json({
      id: req.user._id, username: req.user.username,
      displayName: req.user.displayName, email: req.user.email,
      sleepGoalMins: req.user.sleepGoalMins, age: req.user.age,
      gender: req.user.gender,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;
