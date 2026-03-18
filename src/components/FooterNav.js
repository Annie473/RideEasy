import React from "react";
import { Link } from "react-router-dom";
import "./FooterNav.css";

function FooterNav() {
  return (
    <footer className="footer-nav">
      <div className="footer-inner">
        <h3>RideEasy</h3>
        <p>Full-stack bike rental and showroom platform with connected user activity tracking.</p>
        <div className="footer-links">
          <Link to="/">Home</Link>
          <Link to="/bikes">Rentals</Link>
          <Link to="/shop">Buy Bikes</Link>
          <Link to="/used-market">Used Bikes</Link>
          <Link to="/activity">My Activity</Link>
          <Link to="/contact">Contact</Link>
        </div>
      </div>
    </footer>
  );
}

export default FooterNav;
