import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Home.css";
import { getHomeContent } from "../api/client";
import { useAuth } from "../context/AuthContext";

function Home() {
  const { isAuthenticated } = useAuth();
  const [content, setContent] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadContent() {
      try {
        const data = await getHomeContent();
        if (isMounted) {
          setContent(data);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message);
        }
      }
    }

    loadContent();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="home-decorative">
      <section className="hero-shell cinematic-hero">
        <div className="hero-overlay" />
        <div className="hero-main glass-card">
          <h1>{content?.title || "RideEasy Bike Showroom and Rentals"}</h1>
          <p>
            {content?.subtitle ||
              "Explore premium bikes for rental and complete purchase with full activity tracking."}
          </p>

          <div className="home-buttons">
            <Link to={isAuthenticated ? "/bikes" : "/register"}>
              <button className="btn" type="button">
                {content?.primaryCtaLabel || (isAuthenticated ? "Explore Rentals" : "Get Started")}
              </button>
            </Link>
            <Link to={isAuthenticated ? "/shop" : "/login"}>
              <button className="btn-outline dark-outline" type="button">
                {content?.secondaryCtaLabel || (isAuthenticated ? "Shop Bikes" : "Login")}
              </button>
            </Link>
            <Link to="/used-market">
              <button className="btn-outline dark-outline" type="button">
                Used Bikes Market
              </button>
            </Link>
            <Link to={isAuthenticated ? "/activity" : "/login"}>
              <button className="btn-outline dark-outline" type="button">
                My Activity
              </button>
            </Link>
          </div>
          {error ? <p className="status-message error-text">{error}</p> : null}
        </div>

        <div className="hero-panel glass-card">
          <h3>Platform Highlights</h3>
          <ul>
            <li>Rental and purchase workflows in one application</li>
            <li>Used bike buyer/seller market like a mini Cars24 flow</li>
            <li>Wishlist and test ride request management</li>
            <li>Detailed activity dashboard with CRUD-style actions</li>
            <li>Live inventory behavior with order and booking updates</li>
          </ul>
          <Link className="hero-panel-link" to="/used-market">
            Post Used Bike Listing
          </Link>
        </div>
      </section>

      {content?.stats ? (
        <section className="stats-ribbon">
          <div className="hero-stat">
            <strong>{content.stats.totalBikes}</strong>
            <span>Rental Models</span>
          </div>
          <div className="hero-stat">
            <strong>{content.stats.totalShowroomBikes || 0}</strong>
            <span>Showroom Models</span>
          </div>
          <div className="hero-stat">
            <strong>{content.stats.totalBrands || 0}</strong>
            <span>Top Brands</span>
          </div>
          <div className="hero-stat">
            <strong>{content.stats.activeRentals || 0}</strong>
            <span>Rental Bookings</span>
          </div>
          <div className="hero-stat">
            <strong>{content.stats.totalPurchases || 0}</strong>
            <span>Purchase Orders</span>
          </div>
          <div className="hero-stat">
            <strong>{content.stats.totalUsedListings || 0}</strong>
            <span>Used Listings</span>
          </div>
        </section>
      ) : null}

      <section className="feature-grid">
        <article className="feature-card">
          <h4>Rent and Ride</h4>
          <p>Choose a bike, check availability, and book instantly from the rental section.</p>
          <Link to="/bikes">View Rentals</Link>
        </article>
        <article className="feature-card">
          <h4>Buy with Confidence</h4>
          <p>Compare brands, see stock, request test rides, and place purchase orders.</p>
          <Link to="/shop">Open Showroom</Link>
        </article>
        <article className="feature-card">
          <h4>Track Everything</h4>
          <p>View all wishlist items, orders, rentals, test rides, and contact history in one place.</p>
          <Link to="/activity">My Activity</Link>
        </article>
        <article className="feature-card">
          <h4>Used Bike Marketplace</h4>
          <p>Buy, sell, edit, and manage pre-owned bike listings with seller contact requests.</p>
          <Link to="/used-market">Open Used Market</Link>
        </article>
      </section>
    </main>
  );
}

export default Home;
