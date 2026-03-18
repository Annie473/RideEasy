const API_BASE_URL = process.env.REACT_APP_API_URL || "/api";
const LOCAL_DB_KEY = "rideeasy_local_crud";
const LOCAL_USER_KEY = "rideeasy_user";

const localSeed = {
  content: {
    home: {
      title: "RideEasy Bike Showroom and Rentals",
      subtitle:
        "Explore premium bikes for rental or complete purchase with instant booking, wishlist, and test-ride support.",
      primaryCtaLabel: "Explore Rentals",
      secondaryCtaLabel: "Shop Bikes"
    },
    about: {
      title: "About RideEasy",
      description:
        "RideEasy is a digital bike showroom platform for rental and full purchase. Compare brands, shortlist your favorites, and place bookings online.",
      mission: "To make bike rental and ownership simple, transparent, and customer-friendly.",
      vision:
        "To become the most trusted online bike showroom for both short rides and long-term ownership.",
      whyChooseUs:
        "Popular brands, real-time inventory, smooth checkout, wishlist, and test-ride booking."
    }
  },
  bikes: [
    {
      id: "rent-1",
      brand: "Yamaha",
      name: "Yamaha R15 V4",
      category: "Sport Bike",
      pricePerDay: 999,
      image:
        "https://imgd.aeplcdn.com/664x374/n/bw/models/colors/yamaha-select-model-metallic-red-1704802630538.png?q=80",
      description: "Aerodynamic styling with sharp handling for city and highway rides.",
      availabilityCount: 5
    },
    {
      id: "rent-2",
      brand: "Royal Enfield",
      name: "Royal Enfield Classic 350",
      category: "Cruiser",
      pricePerDay: 1200,
      image: "https://imgd.aeplcdn.com/1056x594/n/oxqqleb_1768251.jpg?q=80",
      description: "Iconic retro styling and comfortable long-distance riding.",
      availabilityCount: 4
    },
    {
      id: "rent-3",
      brand: "KTM",
      name: "KTM Duke 200",
      category: "Street Bike",
      pricePerDay: 1100,
      image:
        "https://imgd.aeplcdn.com/664x374/n/cw/ec/129743/duke-200-right-side-view.jpeg?isig=0&q=80",
      description: "Lightweight street machine with aggressive performance.",
      availabilityCount: 6
    }
  ],
  saleBikes: [
    {
      id: "sale-1",
      brand: "BMW",
      name: "BMW G 310 R",
      category: "Naked Roadster",
      price: 320000,
      image:
        "https://imgd.aeplcdn.com/664x374/n/cw/ec/110157/g-310-r-right-side-view-2.jpeg?isig=0&q=80",
      description: "Premium entry-level BMW with modern electronics and sporty handling.",
      stockCount: 4,
      badge: "Hot Deal"
    },
    {
      id: "sale-2",
      brand: "Royal Enfield",
      name: "Royal Enfield Interceptor 650",
      category: "Classic Twin",
      price: 365000,
      image:
        "https://imgd.aeplcdn.com/664x374/n/cw/ec/183389/interceptor-650-right-side-view-2.jpeg?isig=0&q=80",
      description: "Twin-cylinder retro machine with smooth highway performance.",
      stockCount: 3,
      badge: "Best Seller"
    },
    {
      id: "sale-3",
      brand: "Triumph",
      name: "Triumph Speed 400",
      category: "Modern Classic",
      price: 246000,
      image:
        "https://imgd.aeplcdn.com/664x374/n/cw/ec/131825/speed-400-right-side-view-2.png?isig=0&q=80",
      description: "Refined modern classic with premium road presence.",
      stockCount: 3,
      badge: "Trending"
    }
  ],
  usedListings: [
    {
      id: "used-1",
      sellerId: "system-user",
      sellerName: "RideEasy Certified Seller",
      brand: "Honda",
      model: "CB350RS",
      year: 2023,
      city: "Hyderabad",
      kmsDriven: 12800,
      owners: 1,
      price: 195000,
      image:
        "https://imgd.aeplcdn.com/664x374/n/cw/ec/115873/cb350rs-right-side-view-2.jpeg?isig=0&q=80",
      description: "Single-owner, company serviced, excellent condition with service record.",
      status: "Active",
      createdAt: "2026-03-18T06:40:00.000Z"
    },
    {
      id: "used-2",
      sellerId: "system-user",
      sellerName: "RideEasy Market Partner",
      brand: "Yamaha",
      model: "MT-15 V2",
      year: 2022,
      city: "Bengaluru",
      kmsDriven: 18200,
      owners: 1,
      price: 142000,
      image:
        "https://imgd.aeplcdn.com/664x374/n/cw/ec/103795/mt-15-v2-right-side-view-2.png?isig=0&q=80",
      description: "Well-maintained street bike, insurance valid, non-accidental.",
      status: "Active",
      createdAt: "2026-03-18T06:41:00.000Z"
    }
  ],
  usedInterests: [],
  rentals: [],
  purchases: [],
  wishlist: [],
  testRides: [],
  contacts: []
};

function readLocalDb() {
  try {
    const raw = localStorage.getItem(LOCAL_DB_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(localSeed));
      return JSON.parse(JSON.stringify(localSeed));
    }
    return JSON.parse(raw);
  } catch (error) {
    localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(localSeed));
    return JSON.parse(JSON.stringify(localSeed));
  }
}

function writeLocalDb(db) {
  localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(db));
}

function getActiveUser() {
  try {
    const raw = localStorage.getItem(LOCAL_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      },
      ...options
    });
  } catch (error) {
    throw new Error("__NETWORK__");
  }

  let data = {};

  try {
    data = await response.json();
  } catch (error) {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong.");
  }

  return data;
}

function buildHomeStats(db) {
  const brands = new Set([...db.bikes.map(item => item.brand), ...db.saleBikes.map(item => item.brand)]);
  return {
    totalBikes: db.bikes.length,
    totalShowroomBikes: db.saleBikes.length,
    totalBrands: brands.size,
    availableBikes: db.bikes.reduce((sum, bike) => sum + bike.availabilityCount, 0),
    activeRentals: db.rentals.length,
    totalPurchases: db.purchases.length,
    totalUsedListings: (db.usedListings || []).length
  };
}

function withRentalDetails(rental, db) {
  const bike = db.bikes.find(item => item.id === rental.bikeId);
  return {
    ...rental,
    bikeName: bike?.name || "Unknown Bike",
    bikeBrand: bike?.brand || "Unknown",
    bikeCategory: bike?.category || "Unknown",
    bikeImage: bike?.image || "",
    pricePerDay: bike?.pricePerDay || 0
  };
}

function withPurchaseDetails(purchase, db) {
  const bike = db.saleBikes.find(item => item.id === purchase.saleBikeId);
  return {
    ...purchase,
    bikeName: bike?.name || "Unknown Bike",
    bikeBrand: bike?.brand || "Unknown",
    bikeCategory: bike?.category || "Unknown",
    bikeImage: bike?.image || "",
    price: bike?.price || 0
  };
}

function withWishlistDetails(item, db) {
  const source = item.itemType === "rental" ? db.bikes : db.saleBikes;
  const bike = source.find(entry => entry.id === item.itemId);
  return {
    ...item,
    bikeName: bike?.name || "Unknown Bike",
    bikeBrand: bike?.brand || "Unknown",
    bikeCategory: bike?.category || "Unknown",
    bikeImage: bike?.image || "",
    priceLabel: bike
      ? item.itemType === "rental"
        ? `Rs.${bike.pricePerDay}/day`
        : `Rs.${bike.price}`
      : "N/A"
  };
}

function withTestRideDetails(item, db) {
  const bike = db.saleBikes.find(entry => entry.id === item.saleBikeId);
  return {
    ...item,
    bikeName: bike?.name || "Unknown Bike",
    bikeBrand: bike?.brand || "Unknown",
    bikeCategory: bike?.category || "Unknown",
    bikeImage: bike?.image || ""
  };
}

function withUsedListingDetails(item, user) {
  return {
    ...item,
    isOwner: user ? item.sellerId === user.id : false
  };
}

function buildLocalActivity() {
  const db = readLocalDb();
  const user = getActiveUser();
  if (!user) {
    return {
      user: null,
      summary: {
        rentals: 0,
        purchases: 0,
        wishlist: 0,
        testRides: 0,
        contacts: 0,
        usedListings: 0,
        usedInterests: 0
      },
      rentals: [],
      purchases: [],
      wishlist: [],
      testRides: [],
      contacts: [],
      usedListings: [],
      usedInterests: []
    };
  }

  const rentals = db.rentals.filter(item => item.userId === user.id).map(item => withRentalDetails(item, db));
  const purchases = db.purchases
    .filter(item => item.userId === user.id)
    .map(item => withPurchaseDetails(item, db));
  const wishlist = db.wishlist
    .filter(item => item.userId === user.id)
    .map(item => withWishlistDetails(item, db));
  const testRides = db.testRides
    .filter(item => item.userId === user.id)
    .map(item => withTestRideDetails(item, db));
  const contacts = db.contacts.filter(item => item.email === user.email || item.userId === user.id);
  const usedListings = (db.usedListings || [])
    .filter(item => item.sellerId === user.id)
    .map(item => withUsedListingDetails(item, user));
  const usedInterests = (db.usedInterests || [])
    .filter(item => item.userId === user.id)
    .map(item => {
      const listing = (db.usedListings || []).find(entry => entry.id === item.listingId);
      return {
        ...item,
        listingTitle: listing ? `${listing.brand} ${listing.model}` : "Listing removed",
        sellerName: listing?.sellerName || "Seller",
        listedPrice: listing?.price || 0
      };
    });

  return {
    user,
    summary: {
      rentals: rentals.length,
      purchases: purchases.length,
      wishlist: wishlist.length,
      testRides: testRides.length,
      contacts: contacts.length,
      usedListings: usedListings.length,
      usedInterests: usedInterests.length
    },
    rentals,
    purchases,
    wishlist,
    testRides,
    contacts,
    usedListings,
    usedInterests
  };
}

export async function getHomeContent() {
  try {
    return await request("/content/home");
  } catch (error) {
    const db = readLocalDb();
    return {
      ...db.content.home,
      stats: buildHomeStats(db)
    };
  }
}

export async function getAboutContent() {
  try {
    return await request("/content/about");
  } catch (error) {
    return readLocalDb().content.about;
  }
}

export async function getBikes() {
  try {
    return await request("/bikes");
  } catch (error) {
    return readLocalDb().bikes;
  }
}

export async function getSaleBikes() {
  try {
    return await request("/sale-bikes");
  } catch (error) {
    return readLocalDb().saleBikes;
  }
}

export function registerUser(payload) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function loginUser(payload) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getCurrentUser(token) {
  return request("/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export function logoutUser(token) {
  return request("/auth/logout", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export async function sendContactMessage(payload) {
  try {
    return await request("/contact", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  } catch (error) {
    const db = readLocalDb();
    db.contacts.push({
      id: `contact-${Date.now()}`,
      ...payload,
      createdAt: new Date().toISOString()
    });
    writeLocalDb(db);
    return { message: "Message saved successfully." };
  }
}

export async function getRentals(token) {
  try {
    return await request("/rentals", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  } catch (error) {
    const db = readLocalDb();
    const user = getActiveUser();
    if (!user) {
      return [];
    }
    return db.rentals.filter(item => item.userId === user.id).map(item => withRentalDetails(item, db));
  }
}

export async function createRental(payload, token) {
  try {
    return await request("/rentals", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    const db = readLocalDb();
    const user = getActiveUser();
    const bike = db.bikes.find(item => item.id === payload.bikeId);

    if (!user || !bike) {
      throw new Error("Unable to create rental.");
    }
    if (bike.availabilityCount <= 0) {
      throw new Error("This bike is currently unavailable.");
    }

    bike.availabilityCount -= 1;
    const rental = {
      id: `rental-${Date.now()}`,
      bikeId: bike.id,
      userId: user.id,
      bookedAt: new Date().toISOString(),
      status: "Booked"
    };
    db.rentals.push(rental);
    writeLocalDb(db);

    return {
      message: `${bike.name} booked successfully.`,
      rental: withRentalDetails(rental, db),
      updatedBike: bike
    };
  }
}

export async function getPurchases(token) {
  try {
    return await request("/purchases", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  } catch (error) {
    const db = readLocalDb();
    const user = getActiveUser();
    if (!user) {
      return [];
    }
    return db.purchases
      .filter(item => item.userId === user.id)
      .map(item => withPurchaseDetails(item, db));
  }
}

export async function createPurchase(payload, token) {
  try {
    return await request("/purchases", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    const db = readLocalDb();
    const user = getActiveUser();
    const bike = db.saleBikes.find(item => item.id === payload.saleBikeId);

    if (!user || !bike) {
      throw new Error("Unable to place purchase order.");
    }
    if (bike.stockCount <= 0) {
      throw new Error("This bike is currently out of stock.");
    }

    bike.stockCount -= 1;
    const purchase = {
      id: `purchase-${Date.now()}`,
      saleBikeId: bike.id,
      userId: user.id,
      purchasedAt: new Date().toISOString(),
      status: "Order Placed"
    };
    db.purchases.push(purchase);
    writeLocalDb(db);

    return {
      message: `${bike.name} purchase order has been placed.`,
      purchase: withPurchaseDetails(purchase, db),
      updatedBike: bike
    };
  }
}

export async function getWishlist(token) {
  try {
    return await request("/wishlist", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  } catch (error) {
    const db = readLocalDb();
    const user = getActiveUser();
    if (!user) {
      return [];
    }
    return db.wishlist.filter(item => item.userId === user.id);
  }
}

export async function addWishlistItem(payload, token) {
  try {
    return await request("/wishlist", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    const db = readLocalDb();
    const user = getActiveUser();
    if (!user) {
      throw new Error("Please login to manage wishlist.");
    }

    const existing = db.wishlist.find(
      item =>
        item.userId === user.id &&
        item.itemType === payload.itemType &&
        item.itemId === payload.itemId
    );
    if (!existing) {
      db.wishlist.push({
        id: `wish-${Date.now()}`,
        userId: user.id,
        itemType: payload.itemType,
        itemId: payload.itemId,
        createdAt: new Date().toISOString()
      });
      writeLocalDb(db);
    }

    return {
      message: "Added to wishlist.",
      wishlist: db.wishlist.filter(item => item.userId === user.id)
    };
  }
}

export async function removeWishlistItem(payload, token) {
  try {
    return await request("/wishlist/remove", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    const db = readLocalDb();
    const user = getActiveUser();
    if (!user) {
      throw new Error("Please login to manage wishlist.");
    }

    db.wishlist = db.wishlist.filter(
      item =>
        !(
          item.userId === user.id &&
          item.itemType === payload.itemType &&
          item.itemId === payload.itemId
        )
    );
    writeLocalDb(db);

    return {
      message: "Removed from wishlist.",
      wishlist: db.wishlist.filter(item => item.userId === user.id)
    };
  }
}

export async function getTestRides(token) {
  try {
    return await request("/test-rides", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  } catch (error) {
    const db = readLocalDb();
    const user = getActiveUser();
    if (!user) {
      return [];
    }
    return db.testRides.filter(item => item.userId === user.id);
  }
}

export async function createTestRide(payload, token) {
  try {
    return await request("/test-rides", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    const db = readLocalDb();
    const user = getActiveUser();
    if (!user) {
      throw new Error("Please login to request a test ride.");
    }

    const testRide = {
      id: `testride-${Date.now()}`,
      userId: user.id,
      saleBikeId: payload.saleBikeId,
      preferredDate: payload.preferredDate,
      status: "Requested",
      requestedAt: new Date().toISOString()
    };
    db.testRides.push(testRide);
    writeLocalDb(db);

    return {
      message: "Test ride requested successfully.",
      testRide: withTestRideDetails(testRide, db)
    };
  }
}

export async function getActivity(token) {
  try {
    return await request("/activity", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  } catch (error) {
    return buildLocalActivity();
  }
}

export async function cancelRental(payload, token) {
  try {
    return await request("/rentals/cancel", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    const db = readLocalDb();
    const user = getActiveUser();
    const rental = db.rentals.find(item => item.id === payload.rentalId && item.userId === user?.id);
    if (!rental) {
      throw new Error("Rental not found.");
    }
    const bike = db.bikes.find(item => item.id === rental.bikeId);
    if (bike) {
      bike.availabilityCount += 1;
    }
    db.rentals = db.rentals.filter(item => item.id !== payload.rentalId);
    writeLocalDb(db);
    return { message: "Rental cancelled and removed from activity.", removedId: payload.rentalId };
  }
}

export async function cancelPurchase(payload, token) {
  try {
    return await request("/purchases/cancel", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    const db = readLocalDb();
    const user = getActiveUser();
    const purchase = db.purchases.find(
      item => item.id === payload.purchaseId && item.userId === user?.id
    );
    if (!purchase) {
      throw new Error("Purchase not found.");
    }
    const bike = db.saleBikes.find(item => item.id === purchase.saleBikeId);
    if (bike) {
      bike.stockCount += 1;
    }
    db.purchases = db.purchases.filter(item => item.id !== payload.purchaseId);
    writeLocalDb(db);
    return { message: "Purchase cancelled and removed from activity.", removedId: payload.purchaseId };
  }
}

export async function cancelTestRide(payload, token) {
  try {
    return await request("/test-rides/cancel", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    const db = readLocalDb();
    const user = getActiveUser();
    const testRide = db.testRides.find(
      item => item.id === payload.testRideId && item.userId === user?.id
    );
    if (!testRide) {
      throw new Error("Test ride not found.");
    }
    db.testRides = db.testRides.filter(item => item.id !== payload.testRideId);
    writeLocalDb(db);
    return { message: "Test ride cancelled and removed from activity.", removedId: payload.testRideId };
  }
}

export async function getUsedListings(token) {
  try {
    return await request("/used-bikes", {
      headers: token
        ? {
            Authorization: `Bearer ${token}`
          }
        : {}
    });
  } catch (error) {
    const db = readLocalDb();
    const user = getActiveUser();
    return (db.usedListings || [])
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(item => withUsedListingDetails(item, user));
  }
}

export async function createUsedListing(payload, token) {
  try {
    return await request("/used-bikes", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    const db = readLocalDb();
    const user = getActiveUser();
    if (!user) {
      throw new Error("Please login to post a used bike listing.");
    }

    db.usedListings = db.usedListings || [];
    const listing = {
      id: `used-${Date.now()}`,
      sellerId: user.id,
      sellerName: String(payload.sellerName || user.name || "RideEasy Seller"),
      brand: String(payload.brand || "Unknown"),
      model: String(payload.model || "Bike"),
      year: Number(payload.year) || new Date().getFullYear(),
      city: String(payload.city || "India"),
      kmsDriven: Number(payload.kmsDriven) || 0,
      owners: Number(payload.owners) || 1,
      price: Number(payload.price) || 0,
      image: String(payload.image || ""),
      description: String(payload.description || ""),
      status: "Active",
      createdAt: new Date().toISOString()
    };
    db.usedListings.push(listing);
    writeLocalDb(db);
    return {
      message: "Used bike listing published successfully.",
      listing: withUsedListingDetails(listing, user)
    };
  }
}

export async function updateUsedListing(payload, token) {
  try {
    return await request("/used-bikes/update", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    const db = readLocalDb();
    const user = getActiveUser();
    if (!user) {
      throw new Error("Please login to update listing.");
    }

    db.usedListings = db.usedListings || [];
    const listing = db.usedListings.find(item => item.id === payload.id && item.sellerId === user.id);
    if (!listing) {
      throw new Error("Listing not found.");
    }

    listing.brand = payload.brand || listing.brand;
    listing.model = payload.model || listing.model;
    listing.year = Number(payload.year) || listing.year;
    listing.city = payload.city || listing.city;
    listing.kmsDriven = Number(payload.kmsDriven) || listing.kmsDriven;
    listing.owners = Number(payload.owners) || listing.owners;
    listing.price = Number(payload.price) || listing.price;
    listing.image = payload.image || listing.image;
    listing.description = payload.description || listing.description;
    listing.status = payload.status || listing.status;
    listing.updatedAt = new Date().toISOString();
    writeLocalDb(db);
    return {
      message: "Listing updated successfully.",
      listing: withUsedListingDetails(listing, user)
    };
  }
}

export async function removeUsedListing(payload, token) {
  try {
    return await request("/used-bikes/remove", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    const db = readLocalDb();
    const user = getActiveUser();
    if (!user) {
      throw new Error("Please login to remove listing.");
    }

    db.usedListings = (db.usedListings || []).filter(
      item => !(item.id === payload.id && item.sellerId === user.id)
    );
    db.usedInterests = (db.usedInterests || []).filter(item => item.listingId !== payload.id);
    writeLocalDb(db);
    return { message: "Listing removed.", removedId: payload.id };
  }
}

export async function expressUsedBikeInterest(payload, token) {
  try {
    return await request("/used-bikes/interest", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    const db = readLocalDb();
    const user = getActiveUser();
    if (!user) {
      throw new Error("Please login to connect with sellers.");
    }

    db.usedListings = db.usedListings || [];
    db.usedInterests = db.usedInterests || [];
    const listing = db.usedListings.find(item => item.id === payload.listingId);
    if (!listing) {
      throw new Error("Used bike listing not found.");
    }
    if (listing.sellerId === user.id) {
      throw new Error("You cannot send interest to your own listing.");
    }

    const existing = db.usedInterests.find(
      item => item.listingId === payload.listingId && item.userId === user.id
    );
    if (existing) {
      return { message: "Interest already sent for this listing." };
    }

    db.usedInterests.push({
      id: `interest-${Date.now()}`,
      listingId: payload.listingId,
      userId: user.id,
      note: String(payload.note || ""),
      createdAt: new Date().toISOString()
    });
    writeLocalDb(db);
    return { message: "Seller contact request sent successfully." };
  }
}
