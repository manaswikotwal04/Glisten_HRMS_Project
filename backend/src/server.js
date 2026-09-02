import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

import { fileURLToPath } from "url";

import attendanceRoutes from "./routes/attendance.routes.js";
import employeeRoutes from "./routes/employee.routes.js";
import salaryRoutes from "./routes/salary.routes.js";
import salarySlipRoutes from "./routes/salarySlip.routes.js";
import salaryStructureRoutes from "./routes/salarystructure.routes.js";
import leaveRoutes from "./routes/leave.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import employeeAuthRoutes from "./routes/employeeAuth.routes.js";
import passwordRoutes from "./routes/password.routes.js";
import documentRoutes from "./routes/document.routes.js";

dotenv.config();

const app = express();

/* =========================
   BASIC MIDDLEWARE
========================= */

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));


/* =========================
   TEST ROUTE
========================= */

app.get("/test", (req, res) => {
  res.send("API WORKING 🚀");
});


/* =========================
   STATIC FILES
========================= */

/*
  Payslips
  Example:
  http://SERVER_IP:5000/payslips/file.pdf
*/
app.use(
  "/payslips",
  express.static(path.join(process.cwd(), "payslips"))
);


/*
  Common company documents
  Example:
  http://SERVER_IP:5000/uploads/documents/file.pdf
*/
app.use(
  "/uploads",
  express.static(
    path.join(process.cwd(), "uploads")
  )
);

/* =========================
   API ROUTES
========================= */

app.use("/api/admin", adminRoutes);

app.use("/api/employee-auth", employeeAuthRoutes);

app.use("/api/attendance", attendanceRoutes);

app.use("/api/employee", employeeRoutes);

app.use("/api/salary", salaryRoutes);

app.use("/api/salary-slip", salarySlipRoutes);

app.use("/api/salary-structure", salaryStructureRoutes);

app.use("/api/leave", leaveRoutes);

app.use("/api/password", passwordRoutes);


/*
  Common company documents
*/
app.use("/api/documents", documentRoutes);


/* =========================
   SERVER
========================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});