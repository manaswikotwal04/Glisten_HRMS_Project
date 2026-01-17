import db from "../config/db.js";

/* ===============================
   ADD SALARY STRUCTURE
================================ */
export const addSalaryStructure = async (req, res) => {
  try {
    const {
      employeeId,
      basic_salary,
      bonus,
      hra_pct,
      pd_pct,
      sa_pct,
      cca_pct,
      pb_pct,

      // fixed monthly amounts (NOT %)
      pt_amt,
      it_amt,
      cess_amt,

      effective_from
    } = req.body;

    if (!employeeId || !basic_salary || !effective_from) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    await db.query(
      `
      INSERT INTO salary_structure (
        employeeId,
        basic_salary,
        bonus,
        hra_pct,
        pd_pct,
        sa_pct,
        cca_pct,
        pb_pct,
        pt_pct,
        it_pct,
        cess_pct,
        effective_from
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        employeeId,
        Number(basic_salary),
        Number(bonus || 0),
        Number(hra_pct || 0),
        Number(pd_pct || 0),
        Number(sa_pct || 0),
        Number(cca_pct || 0),
        Number(pb_pct || 0),

        // 🔥 store AMOUNTS in *_pct columns
        Number(pt_amt || 0),
        Number(it_amt || 0),
        Number(cess_amt || 0),

        effective_from
      ]
    );

    res.status(200).json({
      message: "Salary structure saved successfully"
    });

  } catch (err) {
    console.error("Salary structure save error:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ===============================
   GET SALARY HISTORY
================================ */
export const getSalaryHistory = async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (!employeeId) {
      return res.status(400).json({ message: "Employee ID required" });
    }

    const [rows] = await db.query(
      `
      SELECT
        id,
        employeeId,
        basic_salary,
        bonus,
        hra_pct,
        pd_pct,
        sa_pct,
        cca_pct,
        pb_pct,
        pt_pct,
        it_pct,
        cess_pct,
        effective_from,
        created_at
      FROM salary_structure
      WHERE employeeId = ?
      ORDER BY effective_from DESC
      `,
      [employeeId]
    );

    res.status(200).json(rows);

  } catch (err) {
    console.error("Salary history fetch error:", err);
    res.status(500).json({ error: err.message });
  }
};
