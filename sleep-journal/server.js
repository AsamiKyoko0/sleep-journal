require("dotenv").config();
const express   = require("express");
const mongoose  = require("mongoose");
const cors      = require("cors");
const rateLimit = require("express-rate-limit");
const path      = require("path");

const app = express();

// ── Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Serve the frontend from /public
app.use(express.static(path.join(__dirname, "public")));

// ── Rate limiting ───────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // max requests per IP per window
  message: { error: "Too many requests. Please try again later." },
});

// Tighter limit on auth routes to prevent brute-force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many login attempts. Please try again later." },
});

app.use("/api", limiter);
app.use("/api/auth/login",    authLimiter);
app.use("/api/auth/register", authLimiter);

// ── Routes ──────────────────────────────────────────────────
app.use("/api/auth",    require("./routes/auth"));
app.use("/api/entries", require("./routes/entries"));

// Catch-all: serve frontend for any non-API route
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ── Connect to MongoDB then start server ────────────────────
const PORT = process.env.PORT || 3000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅  MongoDB connected");
    app.listen(PORT, () => console.log(`🚀  Server running at http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error("❌  MongoDB connection failed:", err.message);
    process.exit(1);
  });
