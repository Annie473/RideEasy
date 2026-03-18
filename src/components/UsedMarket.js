import React, { useEffect, useMemo, useState } from "react";
import "./UsedMarket.css";
import {
  createUsedListing,
  expressUsedBikeInterest,
  getUsedListings,
  removeUsedListing,
  updateUsedListing
} from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function formatINR(value) {
  return `Rs.${new Intl.NumberFormat("en-IN").format(value)}`;
}

const initialForm = {
  id: "",
  brand: "",
  model: "",
  year: new Date().getFullYear(),
  city: "",
  kmsDriven: "",
  owners: 1,
  price: "",
  image: "",
  description: ""
};

function UsedMarket() {
  const placeholder = "/bike-placeholder.svg";
  const navigate = useNavigate();
  const { isAuthenticated, token, user } = useAuth();
  const [listings, setListings] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState("");
  const [busyId, setBusyId] = useState("");
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("All");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await getUsedListings(token);
        if (mounted) {
          setListings(data);
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError.message);
        }
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [token]);

  const cities = useMemo(() => {
    const all = new Set(listings.map(item => item.city).filter(Boolean));
    return ["All", ...Array.from(all).sort()];
  }, [listings]);

  const visibleListings = useMemo(() => {
    return listings.filter(item => {
      const text = `${item.brand} ${item.model} ${item.city}`.toLowerCase();
      const matchSearch = text.includes(search.toLowerCase());
      const matchCity = city === "All" || item.city === city;
      return matchSearch && matchCity;
    });
  }, [listings, search, city]);

  function resetForm() {
    setForm(initialForm);
    setEditingId("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatusMessage("");
    setError("");

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    try {
      setBusyId("form");
      if (editingId) {
        const response = await updateUsedListing(form, token);
        setStatusMessage(response.message);
        setListings(current =>
          current.map(item => (item.id === response.listing.id ? response.listing : item))
        );
      } else {
        const response = await createUsedListing(form, token);
        setStatusMessage(response.message);
        setListings(current => [response.listing, ...current]);
      }
      resetForm();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId("");
    }
  }

  function handleEdit(item) {
    setStatusMessage("");
    setError("");
    setEditingId(item.id);
    setForm({
      id: item.id,
      brand: item.brand || "",
      model: item.model || "",
      year: item.year || new Date().getFullYear(),
      city: item.city || "",
      kmsDriven: item.kmsDriven || "",
      owners: item.owners || 1,
      price: item.price || "",
      image: item.image || "",
      description: item.description || ""
    });
  }

  async function handleRemove(listingId) {
    setStatusMessage("");
    setError("");
    try {
      setBusyId(listingId);
      const response = await removeUsedListing({ id: listingId }, token);
      setStatusMessage(response.message);
      setListings(current => current.filter(item => item.id !== listingId));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId("");
    }
  }

  async function handleInterest(listingId) {
    setStatusMessage("");
    setError("");

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    try {
      setBusyId(listingId);
      const response = await expressUsedBikeInterest({ listingId }, token);
      setStatusMessage(response.message);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId("");
    }
  }

  return (
    <main className="used-market-page">
      <section className="used-market-hero">
        <h2>Used Bikes Buyer and Seller Market</h2>
        <p>
          Post your bike, find verified buyers, or discover pre-owned bikes from top brands across
          cities in a Cars24-style experience.
        </p>
      </section>

      <section className="used-market-layout">
        <article className="used-form-card">
          <h3>{editingId ? "Update Your Listing" : "Sell Your Bike"}</h3>
          <form onSubmit={handleSubmit}>
            <input
              value={form.brand}
              onChange={event => setForm(current => ({ ...current, brand: event.target.value }))}
              placeholder="Brand (e.g. Yamaha)"
              required
            />
            <input
              value={form.model}
              onChange={event => setForm(current => ({ ...current, model: event.target.value }))}
              placeholder="Model (e.g. R15)"
              required
            />
            <div className="used-inline">
              <input
                type="number"
                value={form.year}
                onChange={event => setForm(current => ({ ...current, year: event.target.value }))}
                placeholder="Year"
                min="2000"
                max={new Date().getFullYear()}
                required
              />
              <input
                type="number"
                value={form.price}
                onChange={event => setForm(current => ({ ...current, price: event.target.value }))}
                placeholder="Expected Price"
                min="10000"
                required
              />
            </div>
            <div className="used-inline">
              <input
                value={form.city}
                onChange={event => setForm(current => ({ ...current, city: event.target.value }))}
                placeholder="City"
                required
              />
              <input
                type="number"
                value={form.kmsDriven}
                onChange={event =>
                  setForm(current => ({ ...current, kmsDriven: event.target.value }))
                }
                placeholder="Kms Driven"
                min="0"
                required
              />
            </div>
            <input
              type="number"
              value={form.owners}
              onChange={event => setForm(current => ({ ...current, owners: event.target.value }))}
              placeholder="No. of Owners"
              min="1"
              max="5"
              required
            />
            <input
              value={form.image}
              onChange={event => setForm(current => ({ ...current, image: event.target.value }))}
              placeholder="Image URL"
            />
            <textarea
              value={form.description}
              onChange={event =>
                setForm(current => ({ ...current, description: event.target.value }))
              }
              placeholder="Bike condition, service history, insurance, modifications..."
              rows={4}
            />
            <div className="used-form-actions">
              <button className="btn" type="submit" disabled={busyId === "form"}>
                {busyId === "form"
                  ? "Saving..."
                  : editingId
                    ? "Update Listing"
                    : "Publish Listing"}
              </button>
              {editingId ? (
                <button className="btn-outline used-clear-btn" onClick={resetForm} type="button">
                  Cancel Edit
                </button>
              ) : null}
            </div>
          </form>
          {!isAuthenticated ? (
            <p className="used-note">Login to publish or manage your own listings.</p>
          ) : (
            <p className="used-note">Seller: {user?.name} ({user?.email})</p>
          )}
        </article>

        <article className="used-list-card">
          <div className="used-list-header">
            <h3>Available Used Bikes</h3>
            <div className="used-filters">
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Search brand, model, city..."
              />
              <select value={city} onChange={event => setCity(event.target.value)}>
                {cities.map(item => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {statusMessage ? <p className="status-message success-text">{statusMessage}</p> : null}
          {error ? <p className="status-message error-text">{error}</p> : null}

          <div className="used-grid">
            {visibleListings.map(item => (
              <div className="used-item" key={item.id}>
                <img
                  src={item.image || placeholder}
                  alt={`${item.brand} ${item.model}`}
                  onError={event => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = placeholder;
                  }}
                />
                <h4>{item.brand} {item.model}</h4>
                <p>{item.year} | {item.city}</p>
                <p>{new Intl.NumberFormat("en-IN").format(item.kmsDriven || 0)} km | {item.owners} owner(s)</p>
                <p className="used-price">{formatINR(item.price || 0)}</p>
                <p className="used-desc">{item.description || "No additional description provided."}</p>
                <p className="used-seller">Seller: {item.sellerName}</p>

                {item.isOwner ? (
                  <div className="used-item-actions">
                    <button type="button" className="btn-outline used-owner-btn" onClick={() => handleEdit(item)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn-outline used-owner-btn"
                      disabled={busyId === item.id}
                      onClick={() => handleRemove(item.id)}
                    >
                      {busyId === item.id ? "Removing..." : "Remove"}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn used-interest-btn"
                    disabled={busyId === item.id}
                    onClick={() => handleInterest(item.id)}
                  >
                    {busyId === item.id ? "Sending..." : "I am Interested"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}

export default UsedMarket;
