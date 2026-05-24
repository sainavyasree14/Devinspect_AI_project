import jwt from "jsonwebtoken";
import User from "../models/User.js";
import mongoose from "mongoose";

export const protect = async (req, res, next) => {
  try {
    let token = null;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Not authorized - no token" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Token expired or invalid" });
    }

    // Support both decoded.id and decoded._id
    const userId = decoded.id || decoded._id;
    if (!userId) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    // Validate it's a proper ObjectId before querying
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      // Token valid but user deleted — clear hint for frontend
      return res.status(401).json({ message: "User not found", code: "USER_DELETED" });
    }

    req.user = user;
    next();

  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({ message: "Authentication failed" });
  }
};