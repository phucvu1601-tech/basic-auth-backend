import bcrypt from "bcrypt";
import User from "../models/User.js";

export const signUp = async (req, res) => {
  try {
    const { username, password, email, firstName, lastName } = req.body;

    // Check if all required information is provided
    if (!username || !password || !email || !firstName || !lastName) {
      return res.status(400).json({
        message: "Username, password, email, first name, and last name are required fields.",
      });
    }

    // Check if the username already exists
    const duplicate = await User.findOne({ username });
    if (duplicate) {
      return res.status(409).json({ message: "Username already exists." });
    }

    // Encrypt the password before storing
    const hashedPassword = await bcrypt.hash(password, 10); // salt = 10

    // Create new user
    await User.create({
      username,
      hashedPassword,
      email,
      displayName: `${firstName} ${lastName}`,
    });

    // return
    return res.sendStatus(204);
  } catch (error) {
    console.error("Lỗi khi gọi signUp", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};