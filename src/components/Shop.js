import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Shop.css";
import {
  addWishlistItem,
  createPurchase,
  createTestRide,
  getPurchases,
  getSaleBikes,
  getTestRides,
  getWishlist,
  removeWishlistItem
} from "../api/client";
import { useAuth } from "../context/AuthContext";

function formatINR(value) {
  return `Rs.${new Intl.NumberFormat("en-IN").format(value)}`;
}

function getTomorrowDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

function Shop() {
  const placeholder = "/bike-placeholder.svg";
  const navigate = useNavigate();
  const { isAuthenticated, token, user } = useAuth();
  const [saleBikes, setSaleBikes] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [testRides, setTestRides] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [buyingBikeId, setBuyingBikeId] = useState("");
  const [wishlistBikeId, setWishlistBikeId] = useState("");
  const [testRideBikeId, setTestRideBikeId] = useState("");
  const [preferredDate, setPreferredDate] = useState(getTomorrowDate());
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("All");
  const [sortBy, setSortBy] = useState("default");

  useEffect(() => {
    let isMounted = true;

    async function loadSaleBikes() {
      try {
        const response = await getSaleBikes();
        if (isMounted) {
          setSaleBikes(response);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message);
        }
      }
    }

    loadSaleBikes();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadUserData() {
      if (!isAuthenticated || !token) {
        setPurchases([]);
        setWishlist([]);
        setTestRides([]);
        return;
      }

      try {
        const [purchaseData, wishlistData, testRideData] = await Promise.all([
          getPurchases(token),
          getWishlist(token),
          getTestRides(token)
        ]);

        if (isMounted) {
          setPurchases(purchaseData);
          setWishlist(wishlistData.filter(item => item.itemType === "sale"));
          setTestRides(testRideData);
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
    const set = new Set(saleBikes.map(bike => bike.brand));
    return ["All", ...Array.from(set).sort()];
  }, [saleBikes]);

  const visibleSaleBikes = useMemo(() => {
    let filtered = saleBikes.filter(bike => {
      const text = `${bike.brand} ${bike.name} ${bike.category}`.toLowerCase();
      const matchSearch = text.includes(search.toLowerCase());
      const matchBrand = brand === "All" || bike.brand === brand;
      return matchSearch && matchBrand;
    });

    if (sortBy === "price-asc") {
      filtered = [...filtered].sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      filtered = [...filtered].sort((a, b) => b.price - a.price);
    } else if (sortBy === "brand") {
      filtered = [...filtered].sort((a, b) => a.brand.localeCompare(b.brand));
    }

    return filtered;
  }, [saleBikes, search, brand, sortBy]);

  function isWishlisted(saleBikeId) {
    return wishlist.some(item => item.itemId === saleBikeId);
  }

  async function handleBuyNow(saleBikeId) {
    setStatusMessage("");
    setError("");

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    try {
      setBuyingBikeId(saleBikeId);
      const response = await createPurchase({ saleBikeId }, token);
      setStatusMessage(response.message);
      setSaleBikes(current =>
        current.map(bike => (bike.id === response.updatedBike.id ? response.updatedBike : bike))
      );
      setPurchases(current => [response.purchase, ...current]);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBuyingBikeId("");
    }
  }

  async function handleWishlistToggle(saleBikeId) {
    setStatusMessage("");
    setError("");

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    try {
      setWishlistBikeId(saleBikeId);
      if (isWishlisted(saleBikeId)) {
        const response = await removeWishlistItem({ itemType: "sale", itemId: saleBikeId }, token);
        setWishlist(response.wishlist.filter(item => item.itemType === "sale"));
        setStatusMessage("Removed from wishlist.");
      } else {
        const response = await addWishlistItem({ itemType: "sale", itemId: saleBikeId }, token);
        setWishlist(response.wishlist.filter(item => item.itemType === "sale"));
        setStatusMessage("Added to wishlist.");
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setWishlistBikeId("");
    }
  }

  async function handleTestRide(saleBikeId) {
    setStatusMessage("");
    setError("");

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    try {
      setTestRideBikeId(saleBikeId);
      const response = await createTestRide({ saleBikeId, preferredDate }, token);
      setStatusMessage(response.message);
      setTestRides(current => [response.testRide, ...current]);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setTestRideBikeId("");
    }
  }

  return (
    <div className="shop-page">
      <section className="shop-hero">
        <h2>Showroom Purchase Bikes</h2>
        <p>
          {isAuthenticated
            ? `Hi ${user?.name}, compare brands, save wishlist, request test rides, and place your order.`
            : "Explore all major brands, then log in to buy bikes and request test rides."}
        </p>
      </section>

      <section className="shop-controls">
        <input
          type="text"
          placeholder="Search showroom bikes..."
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

        <input
          type="date"
          value={preferredDate}
          min={new Date().toISOString().slice(0, 10)}
          onChange={e => setPreferredDate(e.target.value)}
        />
      </section>

      {statusMessage ? <p className="status-message success-text">{statusMessage}</p> : null}
      {error ? <p className="status-message error-text">{error}</p> : null}

      {isAuthenticated ? (
        <section className="purchase-summary">
          <h3>My Showroom Activity</h3>
          <div className="purchase-list">
            <div className="purchase-item">
              <span>Purchase Orders</span>
              <strong>{purchases.length}</strong>
            </div>
            <div className="purchase-item">
              <span>Wishlist Bikes</span>
              <strong>{wishlist.length}</strong>
            </div>
            <div className="purchase-item">
              <span>Test Ride Requests</span>
              <strong>{testRides.length}</strong>
            </div>
          </div>
        </section>
      ) : null}

      <section className="shop-grid">
        {visibleSaleBikes.map(bike => (
          <article className="shop-card" key={bike.id}>
            <span className="shop-badge">{bike.badge}</span>
            <img
              src={bike.image || placeholder}
              alt={bike.name}
              className="shop-image"
              onError={e => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = placeholder;
              }}
            />
            <h3>{bike.name}</h3>
            <p className="shop-category">
              {bike.brand} | {bike.category}
            </p>
            <p className="shop-description">{bike.description}</p>
            <p className="shop-price">{formatINR(bike.price)}</p>
            <p className="shop-stock">
              {bike.stockCount > 0 ? `${bike.stockCount} in stock` : "Out of stock"}
            </p>

            <div className="shop-actions">
              <button
                type="button"
                className="btn buy-btn"
                disabled={bike.stockCount <= 0 || buyingBikeId === bike.id}
                onClick={() => handleBuyNow(bike.id)}
              >
                {buyingBikeId === bike.id ? "Placing Order..." : "Buy Now"}
              </button>
              <button
                type="button"
                className="btn-outline small-btn"
                disabled={wishlistBikeId === bike.id}
                onClick={() => handleWishlistToggle(bike.id)}
              >
                {wishlistBikeId === bike.id
                  ? "Updating..."
                  : isWishlisted(bike.id)
                    ? "Wishlisted"
                    : "Wishlist"}
              </button>
              <button
                type="button"
                className="btn-outline small-btn"
                disabled={testRideBikeId === bike.id}
                onClick={() => handleTestRide(bike.id)}
              >
                {testRideBikeId === bike.id ? "Requesting..." : "Book Test Ride"}
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

export default Shop;
