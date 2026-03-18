/* Register Page */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import "./Register.css";

function Register() {

  const navigate = useNavigate(); 

  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    confirm: "",
  });

  const [errors, setErrors] = useState({});

  const validate = () => {

    let newErrors = {};

    // Full Name Validation
    if (!/^[A-Za-z\s]{3,}$/.test(form.name)) {
      newErrors.name = "Full Name must contain at least 3 letters and should not with numbers";
    }

    // Email Validation
    if (!/^[A-Za-z][A-Za-z0-9._%+-]*@[A-Za-z.-]+\.[A-Za-z]{2,}$/.test(form.email)) {
  newErrors.email = "Email must start with a letter and be valid";
}

    // Phone Number Validation
    if (!/^\d{10}$/.test(form.mobile)) {
      newErrors.mobile = "Mobile number must be exactly 10 digits";
    }

    // Password Validation
    if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    // Confirm Password Validation
    if (form.password !== form.confirm) {
      newErrors.confirm = "Passwords do not match";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {

    e.preventDefault();

    if (validate()) {
      alert("Registration Successful!");

      navigate("/");
    }

  };

return (
  <div className="register-page">

    <div className="form-container">

      <h2>Register</h2>

      <form onSubmit={handleSubmit}>

        <input
          type="text"
          placeholder="Full Name"
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <p className="error">{errors.name}</p>

        <input
          type="email"
          placeholder="Email"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <p className="error">{errors.email}</p>

        <input
          type="text"
          placeholder="Mobile Number"
          onChange={(e) => setForm({ ...form, mobile: e.target.value })}
        />
        <p className="error">{errors.mobile}</p>

        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <p className="error">{errors.password}</p>

        <input
          type="password"
          placeholder="Confirm Password"
          onChange={(e) => setForm({ ...form, confirm: e.target.value })}
        />
        <p className="error">{errors.confirm}</p>

        <button className="btn">Register</button>

        <p>
          Already have account? <Link to="/login">Login</Link>
        </p>

      </form>
    </div>
    </div>
  );
}

export default Register;