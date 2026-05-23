const jwt  = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async function protect(req, res, next) {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Not authorised — no token." });
  }

  try {
    const decoded = jwt.verify(auth.split(" ")[1], process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) return res.status(401).json({ error: "User not found." });
    next();
  } catch {
    res.status(401).json({ error: "Token invalid or expired." });
  }
};
