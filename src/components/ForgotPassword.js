import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(
        "/api/password/request-reset",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        }
      );

      const data = await res.json();

      if (!res.ok) {
        console.warn(data.message || "Failed to send reset email");
        return;
      }

      console.warn("Password reset link sent to your email 📧");
      navigate("/login");

    } catch (err) {
      console.warn("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.card}>
        <h2 style={styles.title}>Forgot Password</h2>

        <input
          type="email"
          placeholder="Enter your registered email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={styles.input}
        />

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? "Sending..." : "Send Reset Link"}
        </button>

        <p style={styles.link} onClick={() => navigate("/login")}>
          Back to Login
        </p>
      </form>
    </div>
  );
};

export default ForgotPassword;

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f4f6f8"
  },
  card: {
    width: 360,
    padding: 24,
    background: "#fff",
    borderRadius: 8,
    boxShadow: "0 10px 20px rgba(0,0,0,0.08)"
  },
  title: {
    textAlign: "center",
    marginBottom: 20
  },
  input: {
    width: "100%",
    padding: 10,
    marginBottom: 14,
    borderRadius: 6,
    border: "1px solid #ccc",
    fontSize: 14
  },
  button: {
    width: "100%",
    padding: 10,
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 15
  },
  link: {
    marginTop: 14,
    textAlign: "center",
    color: "#2563eb",
    cursor: "pointer",
    fontSize: 14
  }
};



