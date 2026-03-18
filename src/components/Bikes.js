import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Bikes.css";
import {
  addWishlistItem,
  createRental,
  getBikes,
  getRentals,
  getWishlist,
  removeWishlistItem
} from "../api/client";
import { useAuth } from "../context/AuthContext";

function Bikes() {
  const placeholder = "/bike-placeholder.svg";
  const navigate = useNavigate();
  const { isAuthenticated, token, user } = useAuth();
  const [bikes, setBikes] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [bookingBikeId, setBookingBikeId] = useState("");
  const [wishlistBikeId, setWishlistBikeId] = useState("");
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("All");
  const [sortBy, setSortBy] = useState("default");

  useEffect(() => {
    let isMounted = true;

    async function loadBikes() {
      try {
        const bikesData = await getBikes();
        if (isMounted) {
          setBikes(bikesData);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message);
        }
      }
    }

    loadBikes();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadUserData() {
      if (!isAuthenticated || !token) {
        setRentals([]);
        setWishlist([]);
        return;
      }

      try {
        const [rentalData, wishlistData] = await Promise.all([
          getRentals(token),
          getWishlist(token)
        ]);

        if (isMounted) {
          setRentals(rentalData);
          setWishlist(wishlistData.filter(item => item.itemType === "rental"));
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message);
        }
      }
    }

    loadUserData();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, token]);

  const brands = useMemo(() => {
    const set = new Set(bikes.map(bike => bike.brand));
    return ["All", ...Array.from(set).sort()];
  }, [bikes]);

  const visibleBikes = useMemo(() => {
    let filtered = bikes.filter(bike => {
      const text = `${bike.brand} ${bike.name} ${bike.category}`.toLowerCase();
      const matchSearch = text.includes(search.toLowerCase());
      const matchBrand = brand === "All" || bike.brand === brand;
      return matchSearch && matchBrand;
    });

    if (sortBy === "price-asc") {
      filtered = [...filtered].sort((a, b) => a.pricePerDay - b.pricePerDay);
    } else if (sortBy === "price-desc") {
      filtered = [...filtered].sort((a, b) => b.pricePerDay - a.pricePerDay);
    } else if (sortBy === "brand") {
      filtered = [...filtered].sort((a, b) => a.brand.localeCompare(b.brand));
    }

    return filtered;
  }, [bikes, search, brand, sortBy]);

  function isWishlisted(bikeId) {
    return wishlist.some(item => item.itemId === bikeId);
  }

  async function handleRent(bikeId) {
    setStatusMessage("");
    setError("");

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    try {
      setBookingBikeId(bikeId);
      const response = await createRental({ bikeId }, token);
      setStatusMessage(response.message);
      setBikes(current =>
        current.map(bike => (bike.id === response.updatedBike.id ? response.updatedBike : bike))
      );
      setRentals(current => [response.rental, ...current]);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBookingBikeId("");
    }
  }

  async function handleWishlistToggle(bikeId) {
    setStatusMessage("");
    setError("");

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    try {
      setWishlistBikeId(bikeId);
      if (isWishlisted(bikeId)) {
        const response = await removeWishlistItem({ itemType: "rental", itemId: bikeId }, token);
        setWishlist(response.wishlist.filter(item => item.itemType === "rental"));
        setStatusMessage("Removed from wishlist.");
      } else {
        const response = await addWishlistItem({ itemType: "rental", itemId: bikeId }, token);
        setWishlist(response.wishlist.filter(item => item.itemType === "rental"));
        setStatusMessage("Added to wishlist.");
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setWishlistBikeId("");
    }
  }

  return (
    <div className="bike-section">
      <div className="bike-section">
        <h2>Rental Bikes</h2>
        <p className="bike-subtitle">
          {isAuthenticated
            ? `Welcome back, ${user?.name}. Compare brands, save wishlist, and rent from live inventory.`
            : "Browse rental bikes by brand, search by model, and log in for booking and wishlist."}
        </p>

        <div className="bike-controls">
          <input
            type="text"
            placeholder="Search rental bikes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          <select value={brand} onChange={e => setBrand(e.target.value)}>
            {brands.map(item => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="default">Sort</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="brand">Brand A-Z</option>
          </select>
        </div>

        {statusMessage ? <p className="status-message success-text">{statusMessage}</p> : null}
        {error ? <p className="status-message error-text">{error}</p> : null}

        {isAuthenticated && (rentals.length > 0 || wishlist.length > 0) ? (
          <div className="rental-summary">
            <h3>My Activity</h3>
            <div className="rental-list">
              <div className="rental-item">
                <span>Recent Rental Bookings</span>
                <strong>{rentals.length}</strong>
              </div>
              <div className="rental-item">
                <span>Rental Wishlist</span>
                <strong>{wishlist.length}</strong>
              </div>
            </div>
          </div>
        ) : null}

        <div className="bike-container">
          {visibleBikes.map(bike => (
            <div className="bike-card" key={bike.id}>
              <img
                src={bike.image || placeholder}
                alt={bike.name}
                onError={e => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = placeholder;
                }}
              />
              <h3>{bike.name}</h3>
              <p>
                {bike.brand} | {bike.category}
              </p>
              <p className="bike-description">{bike.description}</p>
              <p className="availability-text">
                {bike.availabilityCount > 0
                  ? `${bike.availabilityCount} available | Rs.${bike.pricePerDay}/day`
                  : "Currently unavailable"}
              </p>

              <div className="bike-actions">
                <button
                  className="btn"
                  type="button"
                  disabled={bike.availabilityCount <= 0 || bookingBikeId === bike.id}
                  onClick={() => handleRent(bike.id)}
                >
                  {bookingBikeId === bike.id ? "Booking..." : "Rent Now"}
                </button>
                <button
                  className="btn-outline small-btn"
                  type="button"
                  disabled={wishlistBikeId === bike.id}
                  onClick={() => handleWishlistToggle(bike.id)}
                >
                  {wishlistBikeId === bike.id
                    ? "Updating..."
                    : isWishlisted(bike.id)
                      ? "Wishlisted"
                      : "Wishlist"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Bikes;
