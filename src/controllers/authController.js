import bcrypt from "bcrypt";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import Session from "../models/Session.js";

const ACCESS_TOKEN_TTL = "30m"; // 30 minutes
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000; // 14 days

export const signUp = async (req, res) => {
  try {
    // Check if all required information is provided
    const { username, password, email, firstName, lastName } = req.body;
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
    console.error("Error occurred while calling signUp", error);
    return res.status(500).json({ message: "Server error." });
  }
};

export const signIn = async (req, res) => {
  try {
    // Check if all required information is provided
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username or password is missing." });
    }

    // Check the username
    const user = await User.findOne({ username });
    if (!user) {
      return res
        .status(401)
        .json({ message: "Invalid username or password." });
    }

    // Check the password
    const passwordCorrect = await bcrypt.compare(password, user.hashedPassword);
    if (!passwordCorrect) {
      return res
        .status(401)
        .json({ message: "Invalid username or password." });
    }

    // If matched, generate an access token with JWT
    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL }
    );

    // Generate refresh token
    const refreshToken = crypto.randomBytes(64).toString("hex");

    // Create a new session to store the refresh token
    await Session.create({
      userId: user._id,
      refreshToken,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
    });

    // Return the refresh token in a cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none", //backend, frontend deploy riêng
      maxAge: REFRESH_TOKEN_TTL,
    });

    // Return the access token in the response
    return res
      .status(200)
      .json({ message: `User ${user.displayName} logged in successfully.`, accessToken });
  } catch (error) {
    console.error("Error occurred while calling signIn", error);
    return res.status(500).json({ message: "Server error." });
  }
};

export const signOut = async (req, res) => {
  try {
    // Get the refresh token from the cookie (by cookieParser())
    const token = req.cookies?.refreshToken;
    if (token) {
      // Clear the refresh token stored in the session
      await Session.deleteOne({ refreshToken: token });

      // Clear the cookie from the client
      res.clearCookie("refreshToken");
    }

    return res.sendStatus(204);
  } catch (error) {
    console.error("Error occurred while calling signOut", error);
    return res.status(500).json({ message: "Server error." });
  }
};

export const refreshToken = async (req, res) => {
  try {
    // Get the refresh token from the cookie
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ message: "Token không tồn tại." });
    }

    // Check if the refresh token exists in the database
    const session = await Session.findOne({ refreshToken: token });
    if (!session) {
      return res.status(403).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }

    // Check if the refresh token has expired
    if (session.expiresAt < new Date()) {
      return res.status(403).json({ message: "Token đã hết hạn." });
    }

    // Generate new access token
    const accessToken = jwt.sign(
      {
        userId: session.userId,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL }
    );

    // return
    return res.status(200).json({ accessToken });
  } catch (error) {
    console.error("Error occurred while calling refreshToken", error);
    return res.status(500).json({ message: "Server error." });
  }
};