import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import Payroll from "../models/Payroll.js";
import Employee from "../models/Employee.js";

/* ================= HELPERS ================= */
const round = (n) => Math.round(Number(n) * 100) / 100;

const getSalaryForMonth = (employee) => {
  return Number(employee.salary || 0);
};

/* ================= GET ALL PAYSLIPS ================= */
export const getPayslips = async (req, res) => {
  try {
    const slips = await Payroll.find(); // ✅ custom method
    return res.json(slips);
  } catch (err) {
    console.error("Get payslips error:", err);
    return res.status(500).json([]);
  }
};

/* ================= GENERATE PAYSLIP ================= */
export const generatePayslip = async (req, res) => {
  try {
    const { employeeUuid, month, employee, salary } = req.body;

    if (!employeeUuid || !month || !employee || !salary) {
      return res.status(400).json({ message: "Invalid payslip data" });
    }

    const existing = await Payroll.find({
      employeeId: employee.employeeId,
      month
    });

    if (existing.length > 0) {
      return res.status(400).json({ message: "Payslip already generated" });
    }

    /* ================= PDF ================= */
    const dir = path.join(process.cwd(), "payslips");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);

    const fileName = `${employee.employeeId}-${month}.pdf`;
    const filePath = path.join(dir, fileName);

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(fs.createWriteStream(filePath));

    /* ===== HEADER ===== */
    const logoPath = path.join(dir, "logo.png");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 40, 30, { width: 90 });
    }

    doc
      .fontSize(10)
      .text(
        "Glisten Software Pvt Ltd\nFlat - C3/41, Elite Empire\nBalewadi, Pune - 411045",
        200,
        35,
        { align: "center" }
      );

    doc.moveDown(3);
    doc.fontSize(11).text(`Payslip for the month of ${month}`, { align: "center" });
    doc.moveDown(2);

    /* ===== EMPLOYEE + BANK DETAILS ===== */
    const leftX = 40;
    const rightX = 330;

    doc.fontSize(9);
    doc.text(`Employee Number: ${employee.employeeId}`, leftX);
    doc.text(`Name: ${employee.name}`, leftX);
    doc.text(`Join Date: ${new Date(employee.joinDate).toLocaleDateString()}`, leftX);
    doc.text(`Designation: ${employee.role}`, leftX);
    doc.text(`Department: ${employee.department}`, leftX);
    doc.text(`Location: Pune`, leftX);

    doc.text(`Bank Name: ${employee.bankName}`, rightX, 130);
    doc.text(`Account Number: ${employee.accountNo}`, rightX);
    doc.text(`PF No: ${employee.pfNo}`, rightX);
    doc.text(`PAN No: ${employee.pan}`, rightX);
    doc.text(`Work Days: 31`, rightX);

    doc.moveDown(2);
    doc.moveTo(40, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1);

    /* ===== TABLE HEADER ===== */
    const col1 = 40, col2 = 260, col3 = 380, col4 = 500;

    doc.fontSize(9).text("Earning / Deduction Head", col1);
    doc.text("Current Month", col2, undefined, { align: "right" });
    doc.text("April To Date", col3, undefined, { align: "right" });
    doc.text("Deductions", col4, undefined, { align: "right" });
    doc.moveDown(0.8);

    const row = (label, cur = "", ytd = "", ded = "") => {
      doc.text(label, col1);
      doc.text(cur, col2, undefined, { align: "right" });
      doc.text(ytd, col3, undefined, { align: "right" });
      doc.text(ded, col4, undefined, { align: "right" });
      doc.moveDown(0.5);
    };

    const ytd = (v) => (v * 12).toFixed(2);

    row("Basic", salary.basic, ytd(salary.basic));
    row("HRA", salary.hra, ytd(salary.hra));
    row("Professional Development", salary.professionalDevelopment, ytd(salary.professionalDevelopment));
    row("Special Allowance", salary.specialAllowance, ytd(salary.specialAllowance));
    row("City Compensatory Allowance", salary.cca, ytd(salary.cca));
    row("Project Bonus", salary.projectBonus, ytd(salary.projectBonus));
    row("Additional Bonus", salary.additionalBonus, ytd(salary.additionalBonus));
    row("Profession Tax", "", "", salary.professionTax);

    doc.moveDown(0.5);
    row(
      "Total",
      salary.totalEarnings.toFixed(2),
      ytd(salary.totalEarnings),
      salary.professionTax.toFixed(2)
    );

    /* ===== SALARY PAYABLE ===== */
    doc.moveDown(2);
    doc.fontSize(10).text(
      `Salary payable (Rs) ${salary.netPay.toFixed(2)}`,
      { align: "right" }
    );
    doc.text(`(Rupees ${salary.netPay} Only)`, { align: "right" });

    /* ===== SIGNATURE ===== */
    doc.moveDown(3);
    doc.fontSize(9).text(
      "Authorized Signatory\nGlisten Software Pvt Ltd",
      { align: "right" }
    );

    doc.end();

    /* ===== SAVE ===== */
    const slip = await Payroll.create({
      employeeId: employee.employeeId,
      name: employee.name,
      department: employee.department,
      designation: employee.role,
      month,
      ...salary,
      status: "Generated",
      fileUrl: `/payslips/${fileName}`
    });

    return res.status(201).json({
      message: "Payslip generated successfully",
      slip
    });

  } catch (err) {
    console.error("Generate payslip error:", err);
    return res.status(500).json({ message: err.message });
  }
};

/* ================= DELETE PAYSLIP ================= */
export const deletePayslip = async (req, res) => {
  try {
    const deleted = await Payroll.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Slip not found" });
    }
    return res.json({ message: "Payslip deleted successfully" });
  } catch (err) {
    console.error("Delete payslip error:", err);
    return res.status(500).json({ message: "Failed to delete payslip" });
  }
};

/* ================= DOWNLOAD PAYSLIP ================= */
export const downloadPayslip = async (req, res) => {
  try {
    const slip = await Payroll.findById(req.params.id);
    if (!slip) {
      return res.status(404).json({ message: "Slip not found" });
    }

    const filePath = path.join(process.cwd(), slip.fileUrl);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }

    return res.download(filePath);
  } catch (err) {
    console.error("Download payslip error:", err);
    return res.status(500).json({ message: "Failed to download payslip" });
  }
};
