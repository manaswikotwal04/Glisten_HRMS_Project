import PDFDocument from "pdfkit";
import db from "../config/db.js";
import fs from "fs";
import path from "path";

/* =========================================================
   GET SALARY STRUCTURE EFFECTIVE FOR A PARTICULAR MONTH
========================================================= */

const getSalaryForMonth = (structures, date) => {
  const monthEnd = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0
  );

  return structures
    .filter(
      (s) =>
        new Date(s.effective_from) <= monthEnd
    )
    .slice(-1)[0];
};


/* =========================================================
   GENERATE SALARY SLIP
========================================================= */

export const generateSalarySlip = async (req, res) => {
  try {

    /* =====================================================
       GET DATA FROM FRONTEND
    ===================================================== */

    const {
      employeeId,
      fromMonth,
      toMonth,
      variableBonuses = []
    } = req.body;


    /* =====================================================
       VALIDATION
    ===================================================== */

    if (
      !employeeId ||
      !fromMonth ||
      !toMonth
    ) {
      return res.status(400).json({
        message:
          "Missing employeeId, fromMonth or toMonth"
      });
    }


    /* =====================================================
       CONVERT MONTHS TO DATE
    ===================================================== */

    const fromDate =
      new Date(`${fromMonth}-01`);

    const toDate =
      new Date(`${toMonth}-01`);


    if (
      isNaN(fromDate.getTime()) ||
      isNaN(toDate.getTime())
    ) {
      return res.status(400).json({
        message: "Invalid month format"
      });
    }


    if (fromDate > toDate) {
      return res.status(400).json({
        message:
          "From month cannot be after To month"
      });
    }


    /* =====================================================
       GET EMPLOYEE
    ===================================================== */

    const [[employee]] = await db.query(
      `
      SELECT
        employeeId,
        name,
        department,
        role,
        bankName,
        accountNumber,
        panNumber
      FROM employee
      WHERE employeeId = ?
      `,
      [employeeId]
    );


    if (!employee) {
      return res.status(404).json({
        message: "Employee not found"
      });
    }


    /* =====================================================
       GET SALARY STRUCTURES
    ===================================================== */

    const [structures] = await db.query(
      `
      SELECT *
      FROM salary_structure
      WHERE employeeId = ?
      ORDER BY effective_from
      `,
      [employeeId]
    );


    if (!structures.length) {
      return res.status(404).json({
        message:
          "Salary structure not found"
      });
    }


    /* =====================================================
       VARIABLE BONUS MAP

       Frontend sends:

       [
         { month: 4, amount: 500 },
         { month: 5, amount: 500 },
         { month: 6, amount: 700 }
       ]

       Convert into:

       {
         4: 500,
         5: 500,
         6: 700
       }
    ===================================================== */

    const variableBonusMap = {};


    if (Array.isArray(variableBonuses)) {

      variableBonuses.forEach((item) => {

        const month =
          Number(item.month);

        const amount =
          Number(item.amount || 0);


        if (
          month >= 1 &&
          month <= 12
        ) {

          variableBonusMap[month] =
            amount;

        }

      });

    }


    console.log(
      "VARIABLE BONUS MAP:",
      variableBonusMap
    );


    /* =====================================================
       FINANCIAL YEAR START

       April = month 4

       If payslip month is:
       April-Dec  → FY starts same year
       Jan-Mar    → FY starts previous year
    ===================================================== */

    const fyStartYear =
      toDate.getMonth() + 1 < 4
        ? toDate.getFullYear() - 1
        : toDate.getFullYear();


    const financialYearStart =
      new Date(
        fyStartYear,
        3,
        1
      );


    /* =====================================================
       CREATE PAYSLIP FOLDER
    ===================================================== */

    fs.mkdirSync(
      "payslips",
      {
        recursive: true
      }
    );


    /* =====================================================
       GENERATE EACH MONTH

       Example:

       April → April
       April → May
       April → June
       ...
       April → December
    ===================================================== */

    let loopMonth =
      new Date(fromDate);


    while (loopMonth <= toDate) {


      /* ===================================================
         CURRENT MONTH VALUES
      =================================================== */

      let basicCM = 0;
      let hraCM = 0;
      let pdCM = 0;
      let saCM = 0;
      let ccaCM = 0;
      let pbCM = 0;

      let fixedBonusCM = 0;
      let variableBonusCM = 0;

      let ptCM = 0;
      let itCM = 0;
      let cessCM = 0;


      /* ===================================================
         YTD / ATD VALUES
      =================================================== */

      let basicATD = 0;
      let hraATD = 0;
      let pdATD = 0;
      let saATD = 0;
      let ccaATD = 0;
      let pbATD = 0;

      let fixedBonusATD = 0;
      let variableBonusATD = 0;

      let ptATD = 0;
      let itATD = 0;
      let cessATD = 0;


      /* ===================================================
         START YTD CALCULATION FROM APRIL
      =================================================== */

      let current =
        new Date(financialYearStart);


      while (
        current <= loopMonth
      ) {


        /* ================================================
           GET SALARY STRUCTURE FOR CURRENT MONTH
        ================================================= */

        const sal =
          getSalaryForMonth(
            structures,
            current
          );


        if (!sal) {

          current.setMonth(
            current.getMonth() + 1
          );

          continue;
        }


        /* ================================================
           BASIC SALARY
        ================================================= */

        const basic =
          Number(
            sal.basic_salary || 0
          );


        /* ================================================
           ALLOWANCES
        ================================================= */

        const hra =
          (basic *
            Number(sal.hra_pct || 0)) /
          100;


        const pd =
          (basic *
            Number(sal.pd_pct || 0)) /
          100;


        const sa =
          (basic *
            Number(sal.sa_pct || 0)) /
          100;


        const cca =
          (basic *
            Number(sal.cca_pct || 0)) /
          100;


        const pb =
          (basic *
            Number(sal.pb_pct || 0)) /
          100;


        /* ================================================
           FIXED BONUS

           Comes from salary_structure
        ================================================= */

        const fixedBonus =
          Number(
            sal.bonus || 0
          );


        

        const currentMonthNumber =
          current.getMonth() + 1;


        const variableBonus =
          Number(
            variableBonusMap[
              currentMonthNumber
            ] || 0
          );


        /* ================================================
           YTD EARNINGS
        ================================================= */

        basicATD += basic;

        hraATD += hra;

        pdATD += pd;

        saATD += sa;

        ccaATD += cca;

        pbATD += pb;


        /* Fixed bonus */
        fixedBonusATD +=
          fixedBonus;


        /* Variable bonus */
        variableBonusATD +=
          variableBonus;


        /* ================================================
           DEDUCTIONS
        ================================================= */

        const pt =
          current.getMonth() + 1 === 2
            ? 300
            : 200;


        const it =
          Number(
            sal.it_pct || 0
          );


        const cess =
          Number(
            sal.cess_pct || 0
          );


        ptATD += pt;

        itATD += it;

        cessATD += cess;


        /* ================================================
           CURRENT MONTH VALUES
        ================================================= */

        if (
          current.getMonth() ===
            loopMonth.getMonth() &&
          current.getFullYear() ===
            loopMonth.getFullYear()
        ) {

          basicCM = basic;

          hraCM = hra;

          pdCM = pd;

          saCM = sa;

          ccaCM = cca;

          pbCM = pb;


          fixedBonusCM =
            fixedBonus;


          variableBonusCM =
            variableBonus;


          ptCM = pt;

          itCM = it;

          cessCM = cess;

        }


        /* NEXT MONTH */

        current.setMonth(
          current.getMonth() + 1
        );

      }


      /* ===================================================
         GROSS SALARY
      =================================================== */

      const grossCM =
        basicCM +
        hraCM +
        pdCM +
        saCM +
        ccaCM +
        pbCM +
        fixedBonusCM +
        variableBonusCM;


      const grossATD =
        basicATD +
        hraATD +
        pdATD +
        saATD +
        ccaATD +
        pbATD +
        fixedBonusATD +
        variableBonusATD;


      /* ===================================================
         DEDUCTIONS
      =================================================== */

      const deductionCM =
        ptCM +
        itCM +
        cessCM;


      const deductionATD =
        ptATD +
        itATD +
        cessATD;


      /* ===================================================
         NET SALARY

         YTD gross - YTD deductions
      =================================================== */

      const netSalary =
        grossATD -
        deductionATD;


      /* ===================================================
         MONTH STRING
      =================================================== */

      const monthString =
        loopMonth
          .toISOString()
          .slice(0, 7);


      /* ===================================================
         PDF PATH
      =================================================== */

      const pdfPath =
        `payslips/${employeeId}-April-to-${monthString}.pdf`;


      /* ===================================================
         SAVE PAYROLL RECORD
      =================================================== */

      await db.query(
        `
        INSERT INTO payroll
        (
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

          "April",

          monthString,

          netSalary,

          pdfPath,

          ptATD,

          itATD,

          cessATD
        ]
      );


      /* ===================================================
         PDF
      =================================================== */

      const doc =
        new PDFDocument({
          margin: 40
        });


      doc.pipe(
        fs.createWriteStream(
          pdfPath
        )
      );


      /* ===================================================
         LOGO
      =================================================== */

      const logoPath =
        path.join(
          process.cwd(),
          "payslips",
          "logo.png"
        );


      if (
        fs.existsSync(
          logoPath
        )
      ) {

        doc.image(
          logoPath,
          30,
          5,
          {
            width: 150
          }
        );

      }


      /* ===================================================
         COMPANY HEADER
      =================================================== */

      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .text(
          "Glisten Software Pvt Ltd",
          {
            align: "center"
          }
        );


      doc
        .font("Helvetica")
        .fontSize(12)
        .text(
          "Flat - C3/41, Elite Empire,",
          {
            align: "center"
          }
        )
        .text(
          "Balewadi, Pune - 411045",
          {
            align: "center"
          }
        );


      doc.moveDown(1.5);


      /* ===================================================
         EMPLOYEE INFORMATION
      =================================================== */

      let y = doc.y;

      const lh = 15;


      doc
        .font("Helvetica")
        .fontSize(10);


      const info = (
        left,
        right
      ) => {

        doc.text(
          left,
          40,
          y
        );

        doc.text(
          right,
          320,
          y
        );

        y += lh;

      };


      info(
        `Employee No : ${employee.employeeId}`,
        `Department : ${employee.department}`
      );


      info(
        `Employee Name : ${employee.name}`,
        `Designation : ${employee.role}`
      );


      info(
        `Bank Name : ${employee.bankName || "-"}`,
        `Account No : ${employee.accountNumber || "-"}`
      );


      info(
        `PAN No : ${employee.panNumber || "-"}`,
        `Location : Pune`
      );


      doc.moveDown(1.5);


      /* ===================================================
         PAYSLIP TITLE
      =================================================== */

      doc
        .font("Helvetica-Bold")
        .fontSize(13)
        .text(
          `Payslip for the month of ${monthString}`,
          {
            align: "center"
          }
        );


      doc.moveDown(1.5);


      /* ===================================================
         TABLE
      =================================================== */

      const col = {
        head: 40,
        cmEarn: 260,
        cmDed: 320,
        atdEarn: 400,
        atdDed: 460
      };


      let rowY = doc.y;

      const rowH = 16;


      doc
        .font("Helvetica-Bold")
        .fontSize(10);


      doc.text(
        "Earning / Deduction",
        col.head,
        rowY
      );


      doc.text(
        "Current Month",
        col.cmEarn - 20,
        rowY,
        {
          width: 120,
          align: "center"
        }
      );


      doc.text(
        "From Selected Month To Date",
        col.atdEarn - 20,
        rowY,
        {
          width: 160,
          align: "center"
        }
      );


      rowY += rowH;


      doc.fontSize(9);


      doc.text(
        "Earnings",
        col.cmEarn,
        rowY,
        {
          width: 50,
          align: "right"
        }
      );


      doc.text(
        "Deductions",
        col.cmDed,
        rowY,
        {
          width: 50,
          align: "right"
        }
      );


      doc.text(
        "Earnings",
        col.atdEarn,
        rowY,
        {
          width: 50,
          align: "right"
        }
      );


      doc.text(
        "Deductions",
        col.atdDed,
        rowY,
        {
          width: 50,
          align: "right"
        }
      );


      rowY += rowH;


      doc.font(
        "Helvetica"
      );


      /* ===================================================
         ROW HELPER
      =================================================== */

      const row = (
        label,
        ce,
        cd,
        ae,
        ad,
        bold = false
      ) => {

        doc
          .font(
            bold
              ? "Helvetica-Bold"
              : "Helvetica"
          )
          .fontSize(9);


        doc.text(
          label,
          col.head,
          rowY
        );


        doc.text(
          ce.toFixed(0),
          col.cmEarn,
          rowY,
          {
            width: 50,
            align: "right"
          }
        );


        doc.text(
          cd.toFixed(0),
          col.cmDed,
          rowY,
          {
            width: 50,
            align: "right"
          }
        );


        doc.text(
          ae.toFixed(0),
          col.atdEarn,
          rowY,
          {
            width: 50,
            align: "right"
          }
        );


        doc.text(
          ad.toFixed(0),
          col.atdDed,
          rowY,
          {
            width: 50,
            align: "right"
          }
        );


        rowY += rowH;

      };


      /* ===================================================
         EARNINGS
      =================================================== */

      row(
        "Basic",
        basicCM,
        0,
        basicATD,
        0
      );


      row(
        "HRA",
        hraCM,
        0,
        hraATD,
        0
      );


      row(
        "Professional Development",
        pdCM,
        0,
        pdATD,
        0
      );


      row(
        "Special Allowance",
        saCM,
        0,
        saATD,
        0
      );


      row(
        "CCA",
        ccaCM,
        0,
        ccaATD,
        0
      );


      row(
        "Project Bonus",
        pbCM,
        0,
        pbATD,
        0
      );


      /* ===================================================
         FIXED BONUS
      =================================================== */

      row(
        "Fixed Bonus",
        fixedBonusCM,
        0,
        fixedBonusATD,
        0
      );


      /* ===================================================
         VARIABLE BONUS
      =================================================== */

      row(
        "Variable Bonus",
        variableBonusCM,
        0,
        variableBonusATD,
        0
      );


      /* ===================================================
         DEDUCTIONS
      =================================================== */

      row(
        "Income Tax",
        0,
        itCM,
        0,
        itATD
      );


      row(
        "Education Cess",
        0,
        cessCM,
        0,
        cessATD
      );


      row(
        "Profession Tax",
        0,
        ptCM,
        0,
        ptATD
      );


      /* ===================================================
         TOTAL
      =================================================== */

      doc.font(
        "Helvetica-Bold"
      );


      row(
        "TOTAL",
        grossCM,
        deductionCM,
        grossATD,
        deductionATD,
        true
      );


      /* ===================================================
         NET SALARY
      =================================================== */

      doc.moveDown(2);


      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .text(
          `Net Salary Payable : ₹ ${netSalary.toFixed(0)}`
        );


      doc.moveDown(3);


      doc
        .font("Helvetica")
        .fontSize(10)
        .text(
          "Arvinda Shukla\n(COO - Glisten Software Pvt Ltd)",
          40,
          doc.y
        );


      /* ===================================================
         FINISH PDF
      =================================================== */

      doc.end();


      /* ===================================================
         NEXT MONTH

         April → April
         April → May
         April → June
         ...
      =================================================== */

      loopMonth.setMonth(
        loopMonth.getMonth() + 1
      );

    }


    /* =====================================================
       RESPONSE
    ===================================================== */

    res.json({
      message:
        "Salary slips generated successfully"
    });


  } catch (err) {

    console.error(
      "PAYROLL ERROR:",
      err
    );


    res.status(500).json({
      message:
        err.message
    });

  }
};


/* =========================================================
   LIST SALARY SLIPS
========================================================= */

export const listSalarySlips = async (
  req,
  res
) => {

  try {

    const [rows] =
      await db.query(
        `
        SELECT
          p.id,
          p.employeeId,
          e.name AS employeeName,
          p.from_month,
          p.to_month,
          IFNULL(
            p.net_salary,
            0
          ) AS net_salary,
          p.pdf_path
        FROM payroll p
        JOIN employee e
          ON e.employeeId =
             p.employeeId
        ORDER BY
          p.created_at DESC
        `
      );


    res.json(rows);


  } catch (err) {

    console.error(
      "List payslip error:",
      err
    );


    res.status(500).json({
      error:
        err.message
    });

  }

};


/* =========================================================
   DELETE SALARY SLIP
========================================================= */

export const deleteSalarySlip = async (
  req,
  res
) => {

  try {

    const { id } =
      req.params;


    const [[row]] =
      await db.query(
        `
        SELECT pdf_path
        FROM payroll
        WHERE id = ?
        `,
        [id]
      );


    if (!row) {

      return res.status(404).json({
        message:
          "Payslip not found"
      });

    }


    await db.query(
      `
      DELETE FROM payroll
      WHERE id = ?
      `,
      [id]
    );


    if (row.pdf_path) {

      const filePath =
        path.join(
          process.cwd(),
          row.pdf_path
        );


      if (
        fs.existsSync(
          filePath
        )
      ) {

        fs.unlinkSync(
          filePath
        );

      }

    }


    res.json({
      message:
        "Payslip deleted successfully"
    });


  } catch (err) {

    console.error(
      "Delete payslip error:",
      err
    );


    res.status(500).json({
      error:
        err.message
    });

  }

};


/* =========================================================
   GET PAYSLIPS BY EMPLOYEE
========================================================= */

export const getPayslipsByEmployee =
  async (req, res) => {

    try {

      const { employeeId } =
        req.params;


      const [rows] =
        await db.query(
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
          ORDER BY
            created_at DESC
          `,
          [employeeId]
        );


      res.status(200).json(
        rows
      );


    } catch (err) {

      console.error(
        "Fetch payslips error:",
        err
      );


      res.status(200).json([]);

    }

  };