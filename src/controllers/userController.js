export const getMe = async (req, res) => {
  try {
    const user = req.user; // get from authMiddleware

    return res.status(200).json({
      user,
    });
  } catch (error) {
    console.error("Error occurred while calling getMe", error);
    return res.status(500).json({ message: "Server error." });
  }
};