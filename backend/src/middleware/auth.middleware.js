import jwt from "jsonwebtoken";

/* =====================================================
   ADMIN AUTHENTICATION
   ===================================================== */

export const adminAuth = (req, res, next) => {
  const header = req.headers.authorization;

  // Check Authorization header
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "No token provided",
    });
  }

  try {
    // Extract token
    const token = header.split(" ")[1];

    // Verify JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // Only Admin is allowed
    if (decoded.type !== "admin") {
      return res.status(403).json({
        message: "Admin access only",
      });
    }

    // Store decoded user information
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid token",
    });
  }
};


/* =====================================================
   GENERAL AUTHENTICATION
   Allows:
   - Admin
   - Employee

   Used for common authenticated routes such as:
   - Get documents
   - View documents
   - Download documents
   ===================================================== */

export const auth = (req, res, next) => {
  const header = req.headers.authorization;

  // Check Authorization header
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "No token provided",
    });
  }

  try {
    // Extract token
    const token = header.split(" ")[1];

    // Verify JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    /* -------------------------------------------------
       ADMIN
       ------------------------------------------------- */

    if (decoded.type === "admin") {
      req.user = decoded;
      return next();
    }

    /* -------------------------------------------------
       EMPLOYEE
       ------------------------------------------------- */

    if (decoded.employeeId) {
      req.user = decoded;
      return next();
    }

    /* -------------------------------------------------
       INVALID USER
       ------------------------------------------------- */

    return res.status(403).json({
      message: "Unauthorized",
    });

  } catch (error) {
    return res.status(401).json({
      message: "Invalid token",
    });
  }
};