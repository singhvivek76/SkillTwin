const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No authentication token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "skilltwin_super_secret_jwt_key_2026"
    );
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Session expired or invalid token" });
  }
};
