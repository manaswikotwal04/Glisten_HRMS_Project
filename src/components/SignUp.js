const SignupForm = ({ role }) => {
  return (
    <form className="auth-form fade-in">
      <h3>{role === "admin" ? "Admin Signup" : "Employee Signup"}</h3>

      <label>Full Name</label>
      <input type="text" placeholder="John Doe" />

      <label>Email</label>
      <input type="email" placeholder="john@example.com" />

      <label>Password</label>
      <input type="password" placeholder="Create password" />

      <label>Confirm Password</label>
      <input type="password" placeholder="Confirm password" />

      {role === "employee" && (
        <>
          <label>Employee ID</label>
          <input type="text" placeholder="EMP001" />
        </>
      )}

      <div className="auth-row">
        <label>
          <input type="checkbox" /> I agree to Terms & Conditions
        </label>
      </div>

      <button className="auth-btn success">Create Account</button>
    </form>
  );
};

