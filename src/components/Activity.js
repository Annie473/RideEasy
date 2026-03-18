import React, { useEffect, useState } from "react";
import "./Activity.css";
import {
  cancelPurchase,
  cancelRental,
  cancelTestRide,
  getActivity,
  removeWishlistItem
} from "../api/client";
import { useAuth } from "../context/AuthContext";

function formatDate(value) {
  if (!value) {
    return "N/A";
  }
  const date = new Date(value);
  return date.toLocaleString();
}

function Activity() {
  const { isAuthenticated, token, user } = useAuth();
  const [activity, setActivity] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  function removeActivityRecord(key, id) {
    setActivity(current => {
      if (!current) {
        return current;
      }
      const nextItems = (current[key] || []).filter(item => item.id !== id);
      const nextSummary = {
        ...current.summary,
        [key]: nextItems.length
      };
      return {
        ...current,
        [key]: nextItems,
        summary: nextSummary
      };
    });
  }

  useEffect(() => {
    let mounted = true;

    async function loadActivity() {
      if (!isAuthenticated || !token) {
        setActivity(null);
        return;
      }
      try {
        const data = await getActivity(token);
        if (mounted) {
          setActivity(data);
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError.message);
        }
      }
    }

    loadActivity();
    return () => {
      mounted = false;
    };
  }, [isAuthenticated, token]);

  async function handleCancelRental(rentalId) {
    try {
      setBusyId(rentalId);
      setStatusMessage("");
      const response = await cancelRental({ rentalId }, token);
      setStatusMessage(response.message);
      removeActivityRecord("rentals", rentalId);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId("");
    }
  }

  async function handleCancelPurchase(purchaseId) {
    try {
      setBusyId(purchaseId);
      setStatusMessage("");
      const response = await cancelPurchase({ purchaseId }, token);
      setStatusMessage(response.message);
      removeActivityRecord("purchases", purchaseId);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId("");
    }
  }

  async function handleCancelTestRide(testRideId) {
    try {
      setBusyId(testRideId);
      setStatusMessage("");
      const response = await cancelTestRide({ testRideId }, token);
      setStatusMessage(response.message);
      removeActivityRecord("testRides", testRideId);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId("");
    }
  }

  async function handleRemoveWishlist(itemType, itemId, id) {
    try {
      setBusyId(id);
      setStatusMessage("");
      const response = await removeWishlistItem({ itemType, itemId }, token);
      setStatusMessage(response.message);
      removeActivityRecord("wishlist", id);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId("");
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="activity-page">
        <div className="activity-empty">
          <h2>My Activity</h2>
          <p>Please login to view your complete bike showroom activity.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="activity-page">
      <section className="activity-hero">
        <h2>My Activity Dashboard</h2>
        <p>
          This page gives complete details of your account activity including rental bookings,
          purchase orders, wishlist items, test ride requests, and contact history. You can manage
          and cancel actions directly from here just like a connected CRUD web application.
        </p>
        <p className="activity-user">
          Logged in as <strong>{activity?.user?.name || user?.name}</strong> ({activity?.user?.email || user?.email})
        </p>
      </section>

      {statusMessage ? <p className="status-message success-text">{statusMessage}</p> : null}
      {error ? <p className="status-message error-text">{error}</p> : null}

      <section className="activity-summary">
        <div className="summary-card">
          <span>Rental Bookings</span>
          <strong>{activity?.summary?.rentals || 0}</strong>
        </div>
        <div className="summary-card">
          <span>Purchase Orders</span>
          <strong>{activity?.summary?.purchases || 0}</strong>
        </div>
        <div className="summary-card">
          <span>Wishlist Bikes</span>
          <strong>{activity?.summary?.wishlist || 0}</strong>
        </div>
        <div className="summary-card">
          <span>Test Ride Requests</span>
          <strong>{activity?.summary?.testRides || 0}</strong>
        </div>
        <div className="summary-card">
          <span>Contact Messages</span>
          <strong>{activity?.summary?.contacts || 0}</strong>
        </div>
        <div className="summary-card">
          <span>My Used Listings</span>
          <strong>{activity?.summary?.usedListings || 0}</strong>
        </div>
        <div className="summary-card">
          <span>Used Bike Interests</span>
          <strong>{activity?.summary?.usedInterests || 0}</strong>
        </div>
      </section>

      <section className="activity-grid">
        <article className="activity-card">
          <h3>Rental Booking Details</h3>
          {activity?.rentals?.length ? (
            activity.rentals.map(item => (
              <div className="record-row" key={item.id}>
                <div>
                  <p className="record-title">{item.bikeName}</p>
                  <p>{item.bikeBrand} | {item.bikeCategory}</p>
                  <p>Booked At: {formatDate(item.bookedAt)}</p>
                  <p>Status: {item.status}</p>
                </div>
                <button
                  className="btn-outline small-btn"
                  disabled={busyId === item.id}
                  onClick={() => handleCancelRental(item.id)}
                  type="button"
                >
                  {busyId === item.id ? "Updating..." : "Cancel"}
                </button>
              </div>
            ))
          ) : (
            <p>No rental records found.</p>
          )}
        </article>

        <article className="activity-card">
          <h3>Purchase Order Details</h3>
          {activity?.purchases?.length ? (
            activity.purchases.map(item => (
              <div className="record-row" key={item.id}>
                <div>
                  <p className="record-title">{item.bikeName}</p>
                  <p>{item.bikeBrand} | {item.bikeCategory}</p>
                  <p>Price: Rs.{item.price}</p>
                  <p>Ordered At: {formatDate(item.purchasedAt)}</p>
                  <p>Status: {item.status}</p>
                </div>
                <button
                  className="btn-outline small-btn"
                  disabled={busyId === item.id}
                  onClick={() => handleCancelPurchase(item.id)}
                  type="button"
                >
                  {busyId === item.id ? "Updating..." : "Cancel"}
                </button>
              </div>
            ))
          ) : (
            <p>No purchase records found.</p>
          )}
        </article>

        <article className="activity-card">
          <h3>Wishlist Details</h3>
          {activity?.wishlist?.length ? (
            activity.wishlist.map(item => (
              <div className="record-row" key={item.id}>
                <div>
                  <p className="record-title">{item.bikeName}</p>
                  <p>{item.bikeBrand} | {item.bikeCategory}</p>
                  <p>Type: {item.itemType === "sale" ? "Showroom Bike" : "Rental Bike"}</p>
                  <p>Price: {item.priceLabel}</p>
                </div>
                <button
                  className="btn-outline small-btn"
                  disabled={busyId === item.id}
                  onClick={() => handleRemoveWishlist(item.itemType, item.itemId, item.id)}
                  type="button"
                >
                  {busyId === item.id ? "Removing..." : "Remove"}
                </button>
              </div>
            ))
          ) : (
            <p>No wishlist records found.</p>
          )}
        </article>

        <article className="activity-card">
          <h3>Test Ride Details</h3>
          {activity?.testRides?.length ? (
            activity.testRides.map(item => (
              <div className="record-row" key={item.id}>
                <div>
                  <p className="record-title">{item.bikeName}</p>
                  <p>{item.bikeBrand} | {item.bikeCategory}</p>
                  <p>Preferred Date: {item.preferredDate}</p>
                  <p>Requested At: {formatDate(item.requestedAt)}</p>
                  <p>Status: {item.status}</p>
                </div>
                <button
                  className="btn-outline small-btn"
                  disabled={busyId === item.id}
                  onClick={() => handleCancelTestRide(item.id)}
                  type="button"
                >
                  {busyId === item.id ? "Updating..." : "Cancel"}
                </button>
              </div>
            ))
          ) : (
            <p>No test ride records found.</p>
          )}
        </article>

        <article className="activity-card">
          <h3>My Used Bike Listings</h3>
          {activity?.usedListings?.length ? (
            activity.usedListings.map(item => (
              <div className="record-row" key={item.id}>
                <div>
                  <p className="record-title">{item.brand} {item.model}</p>
                  <p>{item.year} | {item.city}</p>
                  <p>Price: Rs.{new Intl.NumberFormat("en-IN").format(item.price || 0)}</p>
                  <p>Kms: {new Intl.NumberFormat("en-IN").format(item.kmsDriven || 0)}</p>
                  <p>Status: {item.status}</p>
                </div>
              </div>
            ))
          ) : (
            <p>You have not posted any used bike listing yet.</p>
          )}
        </article>

        <article className="activity-card">
          <h3>Used Bike Seller Contacts</h3>
          {activity?.usedInterests?.length ? (
            activity.usedInterests.map(item => (
              <div className="record-row" key={item.id}>
                <div>
                  <p className="record-title">{item.listingTitle}</p>
                  <p>Seller: {item.sellerName}</p>
                  <p>Quoted Price: Rs.{new Intl.NumberFormat("en-IN").format(item.listedPrice || 0)}</p>
                  <p>Requested At: {formatDate(item.createdAt)}</p>
                </div>
              </div>
            ))
          ) : (
            <p>No used-bike seller contact requests found.</p>
          )}
        </article>

        <article className="activity-card full-width">
          <h3>Contact Messages</h3>
          {activity?.contacts?.length ? (
            activity.contacts.map(item => (
              <div className="record-row" key={item.id}>
                <div>
                  <p className="record-title">{item.name} ({item.email})</p>
                  <p>Message: {item.message}</p>
                  <p>Submitted At: {formatDate(item.createdAt)}</p>
                </div>
              </div>
            ))
          ) : (
            <p>No contact message records found.</p>
          )}
        </article>
      </section>
    </div>
  );
}

export default Activity;
