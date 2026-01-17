import PDFDocument from "pdfkit";
import db from "../config/db.js";
import fs from "fs";
import path from "path";

/* ================= HELPERS ================= */
const getSalaryForMonth = (structures, date) => {
  const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return structures
    .filter(s => new Date(s.effective_from) <= monthEnd)
    .slice(-1)[0];
};

/* ================= GENERATE PAYSLIP ================= */
export const generateSalarySlip = async (req, res) => {
  let doc;

  try {
    const { employeeId, fromMonth, toMonth, variableBonuses = [] } = req.body;


    if (!employeeId || !fromMonth || !toMonth) {
      return res.status(400).json({ message: "Missing parameters" });
    }

    const fromDate = new Date(`${fromMonth}-01`);
    const toDate = new Date(`${toMonth}-01`);
    const fromMonthName = fromDate.toLocaleString("default", { month: "long" });

    /* ================= EMPLOYEE ================= */
    const [[employee]] = await db.query(
      `SELECT employeeId, name, department, role, bankName, accountNumber, panNumber
       FROM employee WHERE employeeId = ?`,
      [employeeId]
    );
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    /* ================= SALARY STRUCTURE ================= */
    const [structures] = await db.query(
      `SELECT * FROM salary_structure
       WHERE employeeId = ?
       ORDER BY effective_from`,
      [employeeId]
    );
    if (!structures.length)
      return res.status(404).json({ message: "Salary structure not found" });

    /* ================= COMPONENT TOTALS ================= */
    let basicCM=0,hraCM=0,pdCM=0,saCM=0,ccaCM=0,pbCM=0,bonusCM=0;
    let basicATD=0,hraATD=0,pdATD=0,saATD=0,ccaATD=0,pbATD=0,bonusATD=0;

    let ptCM=0,itCM=0,cessCM=0;
    let ptATD=0,itATD=0,cessATD=0;
    let variableBonusATD=0;

    let current = new Date(fromDate);

    while (current <= toDate) {
      const sal = getSalaryForMonth(structures, current);
      if (!sal) {
        current.setMonth(current.getMonth() + 1);
        continue;
      }

      const basic = Number(sal.basic_salary);
      const hra = (basic * sal.hra_pct) / 100;
      const pd = (basic * sal.pd_pct) / 100;
      const sa = (basic * sal.sa_pct) / 100;
      const cca = (basic * sal.cca_pct) / 100;
      const pb = (basic * sal.pb_pct) / 100;
      const bonus = Number(sal.bonus || 0);

      basicATD += basic;
      hraATD += hra;
      pdATD += pd;
      saATD += sa;
      ccaATD += cca;
      pbATD += pb;
      bonusATD += bonus;

      const gross = basic + hra + pd + sa + cca + pb + bonus;
      const pt = current.getMonth() + 1 === 2 ? 300 : 200;
      const it = (gross * Number(sal.it_pct || 0)) / 100;
      const cess = (it * Number(sal.cess_pct || 0)) / 100;

      ptATD += pt;
      itATD += it;
      cessATD += cess;

      const isCM =
        current.getMonth() === toDate.getMonth() &&
        current.getFullYear() === toDate.getFullYear();

      if (isCM) {
        basicCM = basic;
        hraCM = hra;
        pdCM = pd;
        saCM = sa;
        ccaCM = cca;
        pbCM = pb;
        bonusCM = bonus;

        ptCM = pt;
        itCM = it;
        cessCM = cess;
      }

      variableBonuses.forEach(v => {
        if (Array.isArray(v.months) && v.months.includes(current.getMonth() + 1)) {
          variableBonusATD += Number(v.amount || 0);
        }
      });

      current.setMonth(current.getMonth() + 1);
    }

    const grossCM = basicCM+hraCM+pdCM+saCM+ccaCM+pbCM+bonusCM;
    const grossATD = basicATD+hraATD+pdATD+saATD+ccaATD+pbATD+bonusATD;
    const deductionCM = ptCM+itCM+cessCM;
    const deductionATD = ptATD+itATD+cessATD;
    const netSalary = grossATD - deductionATD + variableBonusATD;
    /* ================= PAYROLL INSERT (MANDATORY) ================= */
const pdfPath = `payslips/${employeeId}-${fromMonth}-to-${toMonth}.pdf`;

const [payrollResult] = await db.query(
  `
  INSERT INTO payroll (
    employeeId,
    from_month,
    to_month,
    net_salary,
    pdf_path,
    pt_amt,
    it_amt,
    cess_amt
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `,
  [
    employeeId,
    fromMonth,
    toMonth,
    netSalary,
    pdfPath,
    ptATD,
    itATD,
    cessATD
  ]
);

const payrollId = payrollResult.insertId; // ✅ THIS IS THE ID


/* ================= PDF ================= */

fs.mkdirSync("payslips", { recursive: true });

res.setHeader("Content-Type", "application/pdf");
res.setHeader(
  "Content-Disposition",
  `attachment; filename=${path.basename(pdfPath)}`
);

doc = new PDFDocument({ margin: 40 });
doc.pipe(fs.createWriteStream(pdfPath));
doc.pipe(res);


/* ================= HEADER ================= */
const logoPath = path.join(process.cwd(), "payslips", "logo.png");
if (fs.existsSync(logoPath)) {
  doc.image(logoPath, 40, 35, { width: 60 });
}

doc
  .font("Helvetica-Bold")
  .fontSize(12)
  .text("Glisten Software Pvt Ltd", { align: "center" });

doc
  .font("Helvetica")
  .fontSize(12)
  .text("Flat - C3/41, Elite Empire,", { align: "center" })
  .text("Balewadi, Pune - 411045", { align: "center" });

doc.moveDown(1.5);

/* ================= EMPLOYEE INFO ================= */
let y = doc.y;
const lh = 15;

doc.font("Helvetica").fontSize(10);

const info = (l, r) => {
  doc.text(l, 40, y);
  doc.text(r, 320, y);
  y += lh;
};

info(`Employee No : ${employee.employeeId}`, `Department : ${employee.department}`);
info(`Employee Name : ${employee.name}`, `Designation : ${employee.role}`);
info(`Bank Name : ${employee.bankName || "-"}`, `Account No : ${employee.accountNumber || "-"}`);
info(`PAN No : ${employee.panNumber || "-"}`, `Location : Pune`);

doc.moveDown(1.5);

/* ================= TITLE ================= */
doc
  .font("Helvetica-Bold")
  .fontSize(13)
  .text(`Payslip for the month of ${toMonth}`, { align: "center" });

doc.moveDown(1.5);

/* ================= TABLE HEADINGS ================= */
const col = {
  head: 40,
  cmEarn: 260,
  cmDed: 320,
  atdEarn: 400,
  atdDed: 460
};

let rowY = doc.y;
const rowH = 16;

doc.font("Helvetica-Bold").fontSize(10);
doc.text("Earning / Deduction", col.head, rowY);
doc.text("Current Month", col.cmEarn - 20, rowY, { width: 120, align: "center" });
doc.text("From Selected Month To Date", col.atdEarn - 20, rowY, { width: 160, align: "center" });

rowY += rowH;

doc.fontSize(9);
doc.text("Earnings", col.cmEarn, rowY, { width: 50, align: "right" });
doc.text("Deductions", col.cmDed, rowY, { width: 50, align: "right" });
doc.text("Earnings", col.atdEarn, rowY, { width: 50, align: "right" });
doc.text("Deductions", col.atdDed, rowY, { width: 50, align: "right" });

rowY += rowH;
doc.font("Helvetica");

/* ================= ROW FUNCTION ================= */
const row = (label, ce, cd, ae, ad, bold = false) => {
  doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(9);

  doc.text(label, col.head, rowY);
  doc.text(ce.toFixed(0), col.cmEarn, rowY, { width: 50, align: "right" });
  doc.text(cd.toFixed(0), col.cmDed, rowY, { width: 50, align: "right" });
  doc.text(ae.toFixed(0), col.atdEarn, rowY, { width: 50, align: "right" });
  doc.text(ad.toFixed(0), col.atdDed, rowY, { width: 50, align: "right" });

  rowY += rowH;
};

/* ================= TABLE DATA ================= */
row("Basic", basicCM, 0, basicATD, 0);
row("HRA", hraCM, 0, hraATD, 0);
row("Professional Development", pdCM, 0, pdATD, 0);
row("Special Allowance", saCM, 0, saATD, 0);
row("CCA", ccaCM, 0, ccaATD, 0);
row("Project Bonus", pbCM, 0, pbATD, 0);
row("Fixed Bonus", bonusCM, 0, bonusATD, 0);
row("Income Tax", 0, itCM, 0, itATD);
row("Education Cess", 0, cessCM, 0, cessATD);
row("Profession Tax", 0, ptCM, 0, ptATD);

doc.font("Helvetica-Bold");
row("TOTAL", grossCM, deductionCM, grossATD, deductionATD, true);

/* ================= NET SALARY ================= */
doc.moveDown(2);
doc
  .font("Helvetica-Bold")
  .fontSize(12)
  .text(`Net Salary Payable : ₹ ${netSalary.toFixed(0)}`, 40, doc.y);

doc.moveDown(0.4);
doc
  .font("Helvetica")
  .fontSize(11)
  .text(`Rupees ${numberToWords(Math.round(netSalary))}`,40, doc.y);

/* ================= FOOTER ================= */
doc.moveDown(3);
doc.fontSize(10).text("Arvinda Shukla \n (COO - Glisten Software Pvt Ltd)", 40, doc.y);


doc.end();

  } catch (err) {
    console.error("PAYROLL ERROR:", err);
    if (!res.headersSent) {
      res.status(500).json({ message: err.message });
    }
  }
};

/* ===============================
   LIST SALARY SLIPS
================================ */
export const listSalarySlips = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        p.id,
        p.employeeId,
        e.name AS employeeName,
        p.from_month,
        p.to_month,
        IFNULL(p.net_salary, 0) AS net_salary,
        p.pdf_path
      FROM payroll p
      JOIN employee e ON e.employeeId = p.employeeId
      ORDER BY p.created_at DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error("List payslip error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const deleteSalarySlip = async (req, res) => {
  try {
    const { id } = req.params;

    const [[row]] = await db.query(
      `SELECT pdf_path FROM payroll WHERE id = ?`,
      [id]
    );

    if (!row) {
      return res.status(404).json({ message: "Payslip not found" });
    }

    await db.query(`DELETE FROM payroll WHERE id = ?`, [id]);

    if (row.pdf_path) {
      const filePath = path.join(process.cwd(), row.pdf_path);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    res.json({ message: "Payslip deleted successfully" });
  } catch (err) {
    console.error("Delete payslip error:", err);
    res.status(500).json({ error: err.message });
  }
};
export const getPayslipsByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const [rows] = await db.query(
      `
      SELECT
        id,
        employeeId,
        from_month,
        to_month,
        net_salary,
        pdf_path,
        created_at,
        pt_amt,
        it_amt,
        cess_amt
      FROM payroll
      WHERE employeeId = ?
      ORDER BY created_at DESC
      `,
      [employeeId]
    );

    // ✅ Always return array
    res.status(200).json(rows);

  } catch (err) {
    console.error("Fetch payslips error:", err);

    // 🔥 Prevent frontend crash
    res.status(200).json([]);
  }
};
const numberToWords = (num) => {
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven",
    "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen",
    "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const inWords = (n) => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
    if (n < 1000)
      return a[Math.floor(n / 100)] + " Hundred " + (n % 100 ? inWords(n % 100) : "");
    if (n < 100000)
      return inWords(Math.floor(n / 1000)) + " Thousand " + (n % 1000 ? inWords(n % 1000) : "");
    if (n < 10000000)
      return inWords(Math.floor(n / 100000)) + " Lakh " + (n % 100000 ? inWords(n % 100000) : "");
    return inWords(Math.floor(n / 10000000)) + " Crore " + (n % 10000000 ? inWords(n % 10000000) : "");
  };

  return inWords(num).trim() + " Only";
};
