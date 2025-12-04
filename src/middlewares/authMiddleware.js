import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const verifyToken = (req, res, next) => {
  try {
    // Get the token from the header
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

    // Check if a token exists
    if (!token) {
      return res.status(401).json({ message: "Access token was not found." });
    }

    // Validate the token
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decodedUser) => {
      if (err) {
        console.error(err);
        return res
          .status(403)
          .json({ message: "Access token is expired or invalid." });
      }

      // Find the user
      const user = await User.findById(decodedUser.userId).select("-hashedPassword");
      if (!user) {
        return res.status(404).json({ message: "The user does not exist." });
      }

      // return the user in the response
      req.user = user;
      next();
    });
  } catch (error) {
    console.error("Error occurred while calling verifyToken", error);
    return res.status(500).json({ message: "Server error." });
  }
};