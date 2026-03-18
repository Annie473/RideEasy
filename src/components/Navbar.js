import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <nav className="navbar">
      <div className="logo-section">
        <img
          src="https://img.freepik.com/free-vector/hand-drawn-car-biker-logo-design_23-2149936367.jpg?semt=ais_rp_50_assets&w=740&q=80"
          alt="RideEasy"
          className="logo-img"
        />
        <h2>RideEasy</h2>
      </div>

      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/about">About Us</Link>
        <Link to="/bikes">Rentals</Link>
        <Link to="/shop">Buy Bikes</Link>
        <Link to="/used-market">Used Bikes</Link>
        <Link to="/activity">My Activity</Link>
        <Link to="/contact">Contact</Link>
        {isAuthenticated ? (
          <>
            <span className="nav-user">Hi, {user?.name?.split(" ")[0]}</span>
            <button type="button" className="nav-button" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/register">Register</Link>
            <Link to="/login">Login</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
