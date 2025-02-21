import jwt from "jsonwebtoken"; // ✅ Import JWT library

export const verifyToken = (req, res, next) => {
  const token = req.cookies.token; // Read from cookie

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user ID
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid token" });
  }
};
