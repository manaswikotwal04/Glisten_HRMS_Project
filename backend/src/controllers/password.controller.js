import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import Employee from "../models/Employee.js";

export const resetFirstLoginPassword = async (req, res) => {
  try {
    const { userId, newPassword } = req.body;

    const hash = await bcrypt.hash(newPassword, 10);

    // Update User auth record
    const user = await User.findByIdAndUpdate(userId, {
      password: hash,
      tempPassword: null,
      firstLogin: false
    }, { new: true });

    // Also update Employee record with same email (if exists)
    if (user && user.email) {
      await Employee.findOneAndUpdate({ email: user.email }, { password: hash });
    }

    res.json({ message: "Password reset successfully — you can now log in" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
