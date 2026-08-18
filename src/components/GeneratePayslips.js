import React, { useEffect, useState } from "react";

/* ================= MONTH LIST ================= */

const MONTHS = [
  { name: "Jan", value: 1 },
  { name: "Feb", value: 2 },
  { name: "Mar", value: 3 },
  { name: "Apr", value: 4 },
  { name: "May", value: 5 },
  { name: "Jun", value: 6 },
  { name: "Jul", value: 7 },
  { name: "Aug", value: 8 },
  { name: "Sep", value: 9 },
  { name: "Oct", value: 10 },
  { name: "Nov", value: 11 },
  { name: "Dec", value: 12 }
];

/* ================= EMPTY BONUS OBJECT ================= */

const getEmptyBonuses = () => ({
  1: "",
  2: "",
  3: "",
  4: "",
  5: "",
  6: "",
  7: "",
  8: "",
  9: "",
  10: "",
  11: "",
  12: ""
});

/* ================= COMPONENT ================= */

const GeneratePayslip = () => {

  const [employees, setEmployees] = useState([]);

  const [employeeId, setEmployeeId] = useState("");

  const [fromMonth, setFromMonth] = useState("");

  const [toMonth, setToMonth] = useState("");

  const [loading, setLoading] = useState(false);

  /* ================= DEFAULT BONUS ================= */

  const [defaultBonus, setDefaultBonus] = useState("");

  /* ================= MONTHLY BONUSES ================= */

  const [monthlyBonuses, setMonthlyBonuses] =
    useState(getEmptyBonuses());


  /* ================= LOAD EMPLOYEES ================= */

  useEffect(() => {

    const token =
      localStorage.getItem("token");

    fetch(
      "http://localhost:5000/api/employee",
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )
      .then((res) => {

        if (!res.ok) {
          throw new Error(
            "Failed to fetch employees"
          );
        }

        return res.json();
      })
      .then((data) => {

        setEmployees(
          Array.isArray(data)
            ? data
            : []
        );

      })
      .catch((error) => {

        console.error(
          "Employee fetch error:",
          error
        );

      });

  }, []);


  /* ================= RESET BONUS ================= */

  const resetBonuses = () => {

    setDefaultBonus("");

    setMonthlyBonuses(
      getEmptyBonuses()
    );
  };


  /* ================= UPDATE MONTH ================= */

  const updateMonthlyBonus = (
    month,
    value
  ) => {

    /*
     * Only update the selected month.
     *
     * This means:
     *
     * Jan = 500
     * Feb = 500
     * Mar = 700
     *
     * Changing Mar will NOT change
     * Jan or Feb.
     */

    setMonthlyBonuses((prev) => ({
      ...prev,
      [month]: value
    }));

  };


  /* ================= APPLY DEFAULT BONUS ================= */

  const applyDefaultBonus = () => {

    if (
      defaultBonus === "" ||
      Number(defaultBonus) < 0
    ) {

      alert(
        "Please enter a valid bonus amount"
      );

      return;
    }


    const updated = {};

    MONTHS.forEach((month) => {

      updated[month.value] =
        defaultBonus;

    });


    setMonthlyBonuses(
      updated
    );

  };


  /* ================= TOTAL BONUS ================= */

  const calculateVariableBonus = () => {

    return Object.values(
      monthlyBonuses
    ).reduce(
      (total, amount) => {

        return (
          total +
          Number(amount || 0)
        );

      },
      0
    );

  };


  /* ================= GENERATE PAYSLIP ================= */

  const generatePayslip = async () => {

    if (
      !employeeId ||
      !fromMonth ||
      !toMonth
    ) {

      alert(
        "Please select employee and month range"
      );

      return;
    }


    if (
      fromMonth > toMonth
    ) {

      alert(
        "From Month cannot be after To Month"
      );

      return;
    }


    setLoading(true);


    try {

      const token =
        localStorage.getItem("token");


      /* ================= BONUS DATA ================= */

      const variableBonuses =
        MONTHS
          .map((month) => ({
            month: month.value,

            amount: Number(
              monthlyBonuses[
                month.value
              ] || 0
            )
          }))
          .filter(
            (bonus) =>
              bonus.amount > 0
          );


      /* ================= PAYLOAD ================= */

      const payload = {

        employeeId,

        fromMonth,

        toMonth,

        variableBonuses

      };


      console.log(
        "PAYSLIP PAYLOAD:",
        payload
      );


      /* ================= API ================= */

      const res = await fetch(
        "http://localhost:5000/api/salary-slip/generate",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`
          },

          body:
            JSON.stringify(payload)
        }
      );


      /* ================= ERROR ================= */

      if (!res.ok) {

        let errorData = {};

        try {

          errorData =
            await res.json();

        } catch {

          errorData = {};

        }


        throw new Error(
          errorData.message ||
          "Payslip generation failed"
        );

      }


      /* ================= PDF ================= */

      const blob =
        await res.blob();


      const url =
        window.URL.createObjectURL(
          blob
        );


      const a =
        document.createElement("a");


      a.href = url;


      a.download =
        `${employeeId}-${fromMonth}-to-${toMonth}.pdf`;


      document.body.appendChild(a);


      a.click();


      a.remove();


      window.URL.revokeObjectURL(
        url
      );


    } catch (error) {

      console.error(
        "Payslip generation failed:",
        error
      );


      alert(
        error.message ||
        "Failed to generate payslip"
      );


    } finally {

      setLoading(false);

    }

  };


  /* ================= UI ================= */

  return (

    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        padding: "30px",
        boxSizing: "border-box",
        background: "#f8fafc"
      }}
    >

      <div
        className="add-employee-card"
        style={{
          width: "100%",
          maxWidth: "none",
          margin: 0,
          boxSizing: "border-box"
        }}
      >

        {/* ================= HEADER ================= */}

        <h2>
          Generate Payslip
        </h2>

        <p className="subtitle">
          Select an employee and salary
          period to generate the payslip.
        </p>


        {/* ================= EMPLOYEE + MONTH ================= */}

        <div
          className="form-grid"
          style={{
            marginBottom: "25px"
          }}
        >

          {/* EMPLOYEE */}

          <div className="form-field">

            <label>
              Employee
            </label>

            <select
              value={employeeId}
              onChange={(e) => {

                setEmployeeId(
                  e.target.value
                );

                resetBonuses();

              }}
            >

              <option value="">
                Select Employee
              </option>

              {employees.map((emp) => (

                <option
                  key={emp.employeeId}
                  value={emp.employeeId}
                >
                  {emp.employeeId} -{" "}
                  {emp.name}
                </option>

              ))}

            </select>

          </div>


          {/* FROM MONTH */}

          <div className="form-field">

            <label>
              From Month
            </label>

            <input
              type="month"
              value={fromMonth}
              onChange={(e) =>
                setFromMonth(
                  e.target.value
                )
              }
            />

          </div>


          {/* TO MONTH */}

          <div className="form-field">

            <label>
              To Month
            </label>

            <input
              type="month"
              value={toMonth}
              onChange={(e) =>
                setToMonth(
                  e.target.value
                )
              }
            />

          </div>

        </div>


        {/* ================= VARIABLE BONUS CARD ================= */}

        <div
          style={{
            marginTop: "25px",
            padding: "25px",
            border:
              "1px solid #e5e7eb",
            borderRadius: "12px",
            background: "#ffffff"
          }}
        >

          <h3
            style={{
              marginTop: 0,
              marginBottom: "6px"
            }}
          >
            Variable Bonus
          </h3>

          <p
            style={{
              color: "#6b7280",
              fontSize: "14px",
              marginTop: 0,
              marginBottom: "25px"
            }}
          >
            Set a default monthly bonus and
            then edit individual months if
            required.
          </p>


          {/* ================= DEFAULT BONUS ================= */}

          <div
            style={{
              padding: "18px",
              marginBottom: "28px",
              background: "#f8fafc",
              border:
                "1px solid #e5e7eb",
              borderRadius: "10px"
            }}
          >

            <label
              style={{
                display: "block",
                fontWeight: "600",
                marginBottom: "10px"
              }}
            >
              Default Monthly Bonus
            </label>


            <div
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "center",
                flexWrap: "wrap"
              }}
            >

              {/* DEFAULT AMOUNT */}

              <div
                style={{
                  position: "relative",
                  width: "280px"
                }}
              >

                <span
                  style={{
                    position:
                      "absolute",
                    left: "12px",
                    top: "50%",
                    transform:
                      "translateY(-50%)",
                    color: "#6b7280",
                    pointerEvents:
                      "none"
                  }}
                >
                  ₹
                </span>


                <input
                  type="number"
                  min="0"
                  placeholder="Enter amount"
                  value={defaultBonus}
                  onChange={(e) =>
                    setDefaultBonus(
                      e.target.value
                    )
                  }
                  style={{
                    width: "100%",
                    paddingLeft:
                      "30px",
                    boxSizing:
                      "border-box"
                  }}
                />

              </div>


              {/* APPLY BUTTON */}

              <button
                type="button"
                className="add-btn"
                onClick={
                  applyDefaultBonus
                }
              >
                Apply to All Months
              </button>

            </div>

          </div>


          {/* ================= MONTHLY BONUS ================= */}

          <h4
            style={{
              marginBottom: "18px"
            }}
          >
            Monthly Bonus
          </h4>


          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(4, 1fr)",
              gap: "20px"
            }}
          >

            {MONTHS.map((month) => (

              <div
                key={month.value}
                className="form-field"
              >

                <label>
                  {month.name}
                </label>


                <div
                  style={{
                    position:
                      "relative"
                  }}
                >

                  <span
                    style={{
                      position:
                        "absolute",
                      left: "12px",
                      top: "50%",
                      transform:
                        "translateY(-50%)",
                      color: "#6b7280",
                      pointerEvents:
                        "none"
                    }}
                  >
                    ₹
                  </span>


                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={
                      monthlyBonuses[
                        month.value
                      ]
                    }
                    onChange={(e) =>
                      updateMonthlyBonus(
                        month.value,
                        e.target.value
                      )
                    }
                    style={{
                      paddingLeft:
                        "30px"
                    }}
                  />

                </div>

              </div>

            ))}

          </div>


          {/* ================= TOTAL ================= */}

          <div
            style={{
              marginTop: "30px",
              padding:
                "16px 20px",
              background:
                "#f8fafc",
              border:
                "1px solid #e5e7eb",
              borderRadius: "9px",
              display: "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center"
            }}
          >

            <strong>
              Total Variable Bonus
            </strong>


            <strong
              style={{
                fontSize: "20px",
                color: "#2563eb"
              }}
            >
              ₹
              {calculateVariableBonus()
                .toLocaleString(
                  "en-IN"
                )}
            </strong>

          </div>

        </div>


        {/* ================= GENERATE BUTTON ================= */}

        <div
          style={{
            marginTop: "28px",
            display: "flex",
            justifyContent:
              "flex-end"
          }}
        >

          <button
            type="button"
            className="add-btn"
            onClick={
              generatePayslip
            }
            disabled={loading}
          >

            {loading
              ? "Generating..."
              : "Generate Payslip"}

          </button>

        </div>

      </div>

    </div>

  );
};

export default GeneratePayslip;

