import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";


import employeeRoutes from "./routes/employee.routes.js";
import salaryRoutes from "./routes/salary.routes.js";
import salarySlipRoutes from "./routes/salarySlip.routes.js";
import salaryStructureRoutes from "./routes/salarystructure.routes.js";

// ✅ AUTH ROUTES (MYSQL BASED)
import adminRoutes from "./routes/admin.routes.js";
import employeeAuthRoutes from "./routes/employeeAuth.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

/* 🔥 TEST ROUTE */
app.get("/test", (req, res) => {
  res.send("API WORKING 🚀");
});
app.use("/payslips", express.static(path.join(process.cwd(), "payslips")));

/* 🔐 AUTH ROUTES */
app.use("/api/admin", adminRoutes);              // admin login
app.use("/api/employee-auth", employeeAuthRoutes); // employee login


/* 🔥 CORE MODULE ROUTES */
app.use("/api/employee", employeeRoutes);
app.use("/api/salary", salaryRoutes);
app.use("/api/salary-slip", salarySlipRoutes);
import passwordRoutes from "./routes/password.routes.js";

app.use("/api/password", passwordRoutes);
app.use("/api/salary-structure", salaryStructureRoutes);
/* 📄 STATIC PAYSLIPS */
app.use("/payslips", express.static("payslips"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
