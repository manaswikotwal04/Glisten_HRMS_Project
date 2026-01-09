import jwt from "jsonwebtoken";

export const auth = (req, res, next) => {
  console.log("AUTH MIDDLEWARE HIT:", req.method, req.originalUrl);

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "Authorization header missing" });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Invalid authorization format" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    console.log("AUTH SUCCESS:", decoded.email || decoded.id);

    return next(); // ✅ CRITICAL
  } catch (err) {
    console.error("AUTH FAILED:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
