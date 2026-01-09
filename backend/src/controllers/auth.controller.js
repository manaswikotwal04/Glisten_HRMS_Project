import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import Employee from "../models/Employee.js";

export const login = async (req, res) => {

  const { email, password, role } = req.body;   // declare first

  console.log("LOGIN REQUEST BODY ==> ", req.body);

  try {
    let account;

    // Pick collection based on role
    if (role === "admin") {
      account = await Admin.findOne({ email });
    } else {
      account = await Employee.findOne({ email });
    }

    // Account not found
    if (!account)
      return res.status(404).json({ message: "Account not found" });

    // Debug print passwords
    console.log("ENTERED PASSWORD =", password);
    console.log("DB PASSWORD      =", account.password);

    // Plain-text password match (no hashing)
    if (password !== account.password)
      return res.status(400).json({ message: "Invalid password" });

    // Generate token
    const token = jwt.sign(
      { id: account._id, role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      message: "Login success",
      token,
      role,
      user: account
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};
