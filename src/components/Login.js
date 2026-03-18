import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitLogin(payload) {
    try {
      setIsSubmitting(true);
      setError("");
      await login(payload);
      navigate("/bikes");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!loginForm.email.trim()) {
      setError("Please enter your email.");
      return;
    }

    submitLogin({
      email: loginForm.email.trim(),
      password: loginForm.password
    });
  }

  return (
    <div className="login-page">
      <div className="form-container">
        <h2>Login</h2>
        {error ? <p className="status-message error-text">{error}</p> : null}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Email"
            value={loginForm.email}
            onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
          />

          <input
            type="password"
            placeholder="Password"
            value={loginForm.password}
            onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
          />

          <button className="btn" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing In..." : "Login"}
          </button>
        </form>

        <p>
          Don't have account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
