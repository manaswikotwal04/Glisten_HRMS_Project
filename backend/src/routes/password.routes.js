import express from "express";
import bcrypt from "bcrypt";
import User from "../models/user.model.js";

const router = express.Router();

router.post("/reset-first-login", async (req, res) => {
  const { userId, newPassword } = req.body;

  try {
    const hash = await bcrypt.hash(newPassword, 10);

    await User.findByIdAndUpdate(userId, {
      password: hash,
      tempPassword: null,
      firstLogin: false
    });

    res.json({ message: "Password reset successful — please login" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
