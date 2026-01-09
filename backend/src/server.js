import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

import connectDB from "./config/db.js";

import authRoutes from "./routes/auth.routes.js";
import employeeRoutes from "./routes/employee.routes.js";
import payrollRoutes from "./routes/payroll.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// ✅ Connect DB
connectDB();

// ✅ Health Route
app.get("/", (req, res) => {
  res.send("HRMS Backend Running 🚀");
});

// ✅ API Routes
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/payroll", payrollRoutes);


// ✅ Static payslips
app.use(
  "/payslips",
  express.static(path.join(process.cwd(), "payslips"))
);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
