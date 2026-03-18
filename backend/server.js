const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 5000;
const DB_PATH = path.join(__dirname, "db.json");

function readDb() {
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}

function writeDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  });
  res.end(JSON.stringify(payload));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", chunk => {
      body += chunk.toString();
      if (body.length > 1000000) {
        reject(new Error("Payload too large"));
      }
    });

    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error("Invalid JSON body"));
      }
    });

    req.on("error", reject);
  });
}

function createToken() {
  return crypto.randomBytes(24).toString("hex");
}

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    mobile: user.mobile,
    createdAt: user.createdAt
  };
}

function getSessionUser(req, db) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return null;
  }

  const session = db.sessions.find(item => item.token === token);
  if (!session) {
    return null;
  }

  const user = db.users.find(item => item.id === session.userId);
  if (!user) {
    return null;
  }

  return { token, user };
}

function withBikeDetails(rental, db) {
  const bike = db.bikes.find(item => item.id === rental.bikeId);
  return {
    ...rental,
    bikeName: bike ? bike.name : "Unknown Bike",
    bikeCategory: bike ? bike.category : "Unknown",
    bikeBrand: bike ? bike.brand : "Unknown",
    bikeImage: bike ? bike.image : "",
    pricePerDay: bike ? bike.pricePerDay : 0
  };
}

function withSaleBikeDetails(purchase, db) {
  const bike = db.saleBikes.find(item => item.id === purchase.saleBikeId);
  return {
    ...purchase,
    bikeName: bike ? bike.name : "Unknown Bike",
    bikeCategory: bike ? bike.category : "Unknown",
    bikeBrand: bike ? bike.brand : "Unknown",
    bikeImage: bike ? bike.image : "",
    price: bike ? bike.price : 0
  };
}

function withWishlistDetails(item, db) {
  const source = item.itemType === "rental" ? db.bikes : db.saleBikes;
  const bike = source.find(entry => entry.id === item.itemId);
  return {
    ...item,
    bikeName: bike ? bike.name : "Unknown Bike",
    bikeImage: bike ? bike.image : "",
    bikeBrand: bike ? bike.brand : "Unknown",
    bikeCategory: bike ? bike.category : "Unknown",
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
    bikeName: bike ? bike.name : "Unknown Bike",
    bikeBrand: bike ? bike.brand : "Unknown",
    bikeImage: bike ? bike.image : ""
  };
}

function withContactDetails(item) {
  return {
    id: item.id,
    name: item.name,
    email: item.email,
    message: item.message,
    createdAt: item.createdAt
  };
}

function getOrCreateDummyUser(body, db) {
  const requestedEmail = String(body.email || "").trim().toLowerCase();
  const email = requestedEmail || `guest${Date.now()}@rideeasy.demo`;
  const existing = db.users.find(user => user.email.toLowerCase() === email);

  if (existing) {
    return existing;
  }

  const fallbackName = email.split("@")[0].replace(/[._-]/g, " ");
  const user = {
    id: crypto.randomUUID(),
    name: String(body.name || fallbackName || "Demo Rider").trim(),
    email,
    mobile: String(body.mobile || "0000000000").trim(),
    passwordHash: "dummy-auth",
    createdAt: new Date().toISOString()
  };
  db.users.push(user);
  return user;
}

function withUsedListingDetails(listing, db, viewerId) {
  const seller = db.users.find(item => item.id === listing.sellerId);
  return {
    ...listing,
    sellerName: listing.sellerName || seller?.name || "RideEasy Seller",
    sellerEmail: seller?.email || "",
    isOwner: viewerId ? listing.sellerId === viewerId : false
  };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  try {
    const db = readDb();

    if (req.method === "GET" && url.pathname === "/api/health") {
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/content/home") {
      const brands = new Set([
        ...db.bikes.map(item => item.brand),
        ...db.saleBikes.map(item => item.brand)
      ]);

      sendJson(res, 200, {
        ...db.content.home,
        stats: {
          totalBikes: db.bikes.length,
          totalShowroomBikes: db.saleBikes.length,
          totalBrands: brands.size,
          availableBikes: db.bikes.reduce((count, bike) => count + bike.availabilityCount, 0),
          activeRentals: db.rentals.length,
          totalPurchases: db.purchases.length,
          totalWishlist: db.wishlist.length,
          totalTestRides: db.testRides.length,
          totalUsedListings: (db.usedListings || []).length
        }
      });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/content/about") {
      sendJson(res, 200, db.content.about);
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/bikes") {
      sendJson(res, 200, db.bikes);
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/sale-bikes") {
      sendJson(res, 200, db.saleBikes);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/auth/register") {
      const body = await parseBody(req);
      const user = getOrCreateDummyUser(body, db);
      const token = createToken();
      db.sessions.push({
        token,
        userId: user.id,
        createdAt: new Date().toISOString()
      });
      writeDb(db);
      sendJson(res, 201, { token, user: sanitizeUser(user), mode: "dummy-auth" });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/auth/login") {
      const body = await parseBody(req);
      const user = getOrCreateDummyUser(body, db);
      const token = createToken();
      db.sessions.push({
        token,
        userId: user.id,
        createdAt: new Date().toISOString()
      });
      writeDb(db);
      sendJson(res, 200, { token, user: sanitizeUser(user), mode: "dummy-auth" });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/auth/me") {
      const auth = getSessionUser(req, db);
      if (!auth) {
        sendJson(res, 401, { message: "Unauthorized" });
        return;
      }
      sendJson(res, 200, { user: sanitizeUser(auth.user) });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/auth/logout") {
      const auth = getSessionUser(req, db);
      if (!auth) {
        sendJson(res, 200, { ok: true });
        return;
      }

      db.sessions = db.sessions.filter(session => session.token !== auth.token);
      writeDb(db);
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/contact") {
      const body = await parseBody(req);
      const auth = getSessionUser(req, db);
      const contactMessage = {
        id: crypto.randomUUID(),
        name: String(body.name || "").trim(),
        email: String(body.email || "").trim(),
        message: String(body.message || "").trim(),
        createdAt: new Date().toISOString(),
        userId: auth ? auth.user.id : null
      };
      db.contacts.push(contactMessage);
      writeDb(db);
      sendJson(res, 201, {
        message: "Message sent successfully. Our team will contact you soon."
      });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/activity") {
      const auth = getSessionUser(req, db);
      if (!auth) {
        sendJson(res, 401, { message: "Please log in to view activity." });
        return;
      }

      const rentals = db.rentals
        .filter(item => item.userId === auth.user.id)
        .map(item => withBikeDetails(item, db));
      const purchases = db.purchases
        .filter(item => item.userId === auth.user.id)
        .map(item => withSaleBikeDetails(item, db));
      const wishlist = db.wishlist
        .filter(item => item.userId === auth.user.id)
        .map(item => withWishlistDetails(item, db));
      const testRides = db.testRides
        .filter(item => item.userId === auth.user.id)
        .map(item => withTestRideDetails(item, db));
      const contacts = db.contacts
        .filter(item => item.userId === auth.user.id || item.email === auth.user.email)
        .map(item => withContactDetails(item));
      const usedListings = (db.usedListings || [])
        .filter(item => item.sellerId === auth.user.id)
        .map(item => withUsedListingDetails(item, db, auth.user.id));
      const usedInterests = (db.usedInterests || [])
        .filter(item => item.userId === auth.user.id)
        .map(item => {
          const listing = (db.usedListings || []).find(entry => entry.id === item.listingId);
          return {
            ...item,
            listingTitle: listing ? `${listing.brand} ${listing.model}` : "Listing removed",
            sellerName: listing?.sellerName || "Seller",
            listedPrice: listing?.price || 0
          };
        });

      sendJson(res, 200, {
        user: sanitizeUser(auth.user),
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
      });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/rentals") {
      const auth = getSessionUser(req, db);
      if (!auth) {
        sendJson(res, 401, { message: "Please log in to view rentals." });
        return;
      }

      const rentals = db.rentals
        .filter(rental => rental.userId === auth.user.id)
        .map(rental => withBikeDetails(rental, db));
      sendJson(res, 200, rentals);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/rentals") {
      const auth = getSessionUser(req, db);
      if (!auth) {
        sendJson(res, 401, { message: "Please log in to book a bike." });
        return;
      }

      const body = await parseBody(req);
      const bike = db.bikes.find(item => item.id === body.bikeId);
      if (!bike) {
        sendJson(res, 404, { message: "Bike not found." });
        return;
      }
      if (bike.availabilityCount <= 0) {
        sendJson(res, 409, { message: "This bike is currently unavailable." });
        return;
      }

      bike.availabilityCount -= 1;
      const rental = {
        id: crypto.randomUUID(),
        bikeId: bike.id,
        userId: auth.user.id,
        bookedAt: new Date().toISOString(),
        status: "Booked"
      };
      db.rentals.push(rental);
      writeDb(db);
      sendJson(res, 201, {
        message: `${bike.name} booked successfully.`,
        rental: withBikeDetails(rental, db),
        updatedBike: bike
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/rentals/cancel") {
      const auth = getSessionUser(req, db);
      if (!auth) {
        sendJson(res, 401, { message: "Please log in to update rentals." });
        return;
      }

      const body = await parseBody(req);
      const rentalIndex = db.rentals.findIndex(
        item => item.id === body.rentalId && item.userId === auth.user.id
      );
      const rental = rentalIndex >= 0 ? db.rentals[rentalIndex] : null;
      if (!rental) {
        sendJson(res, 404, { message: "Rental not found." });
        return;
      }

      const bike = db.bikes.find(item => item.id === rental.bikeId);
      if (bike) {
        bike.availabilityCount += 1;
      }
      db.rentals.splice(rentalIndex, 1);
      writeDb(db);
      sendJson(res, 200, {
        message: "Rental cancelled and removed from activity.",
        removedId: body.rentalId
      });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/purchases") {
      const auth = getSessionUser(req, db);
      if (!auth) {
        sendJson(res, 401, { message: "Please log in to view purchases." });
        return;
      }

      const purchases = db.purchases
        .filter(purchase => purchase.userId === auth.user.id)
        .map(purchase => withSaleBikeDetails(purchase, db));
      sendJson(res, 200, purchases);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/purchases") {
      const auth = getSessionUser(req, db);
      if (!auth) {
        sendJson(res, 401, { message: "Please log in to purchase a bike." });
        return;
      }

      const body = await parseBody(req);
      const bike = db.saleBikes.find(item => item.id === body.saleBikeId);
      if (!bike) {
        sendJson(res, 404, { message: "Showroom bike not found." });
        return;
      }
      if (bike.stockCount <= 0) {
        sendJson(res, 409, { message: "This bike is currently out of stock." });
        return;
      }

      bike.stockCount -= 1;
      const purchase = {
        id: crypto.randomUUID(),
        saleBikeId: bike.id,
        userId: auth.user.id,
        purchasedAt: new Date().toISOString(),
        status: "Order Placed"
      };
      db.purchases.push(purchase);
      writeDb(db);
      sendJson(res, 201, {
        message: `${bike.name} purchase order has been placed.`,
        purchase: withSaleBikeDetails(purchase, db),
        updatedBike: bike
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/purchases/cancel") {
      const auth = getSessionUser(req, db);
      if (!auth) {
        sendJson(res, 401, { message: "Please log in to update purchases." });
        return;
      }

      const body = await parseBody(req);
      const purchaseIndex = db.purchases.findIndex(
        item => item.id === body.purchaseId && item.userId === auth.user.id
      );
      const purchase = purchaseIndex >= 0 ? db.purchases[purchaseIndex] : null;
      if (!purchase) {
        sendJson(res, 404, { message: "Purchase not found." });
        return;
      }

      const bike = db.saleBikes.find(item => item.id === purchase.saleBikeId);
      if (bike) {
        bike.stockCount += 1;
      }
      db.purchases.splice(purchaseIndex, 1);
      writeDb(db);
      sendJson(res, 200, {
        message: "Purchase cancelled and removed from activity.",
        removedId: body.purchaseId
      });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/wishlist") {
      const auth = getSessionUser(req, db);
      if (!auth) {
        sendJson(res, 401, { message: "Please log in to view wishlist." });
        return;
      }

      const wishlist = db.wishlist
        .filter(item => item.userId === auth.user.id)
        .map(item => withWishlistDetails(item, db));
      sendJson(res, 200, wishlist);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/wishlist") {
      const auth = getSessionUser(req, db);
      if (!auth) {
        sendJson(res, 401, { message: "Please log in to manage wishlist." });
        return;
      }

      const body = await parseBody(req);
      const itemType = body.itemType === "sale" ? "sale" : "rental";
      const itemId = String(body.itemId || "");
      const source = itemType === "rental" ? db.bikes : db.saleBikes;
      const bike = source.find(entry => entry.id === itemId);
      if (!bike) {
        sendJson(res, 404, { message: "Bike not found for wishlist." });
        return;
      }

      const existing = db.wishlist.find(
        item => item.userId === auth.user.id && item.itemType === itemType && item.itemId === itemId
      );
      if (existing) {
        sendJson(res, 200, {
          message: "Bike already in wishlist.",
          wishlist: db.wishlist
            .filter(item => item.userId === auth.user.id)
            .map(item => withWishlistDetails(item, db))
        });
        return;
      }

      db.wishlist.push({
        id: crypto.randomUUID(),
        userId: auth.user.id,
        itemType,
        itemId,
        createdAt: new Date().toISOString()
      });
      writeDb(db);
      sendJson(res, 201, {
        message: `${bike.name} added to wishlist.`,
        wishlist: db.wishlist
          .filter(item => item.userId === auth.user.id)
          .map(item => withWishlistDetails(item, db))
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/wishlist/remove") {
      const auth = getSessionUser(req, db);
      if (!auth) {
        sendJson(res, 401, { message: "Please log in to manage wishlist." });
        return;
      }

      const body = await parseBody(req);
      const itemType = body.itemType === "sale" ? "sale" : "rental";
      const itemId = String(body.itemId || "");
      db.wishlist = db.wishlist.filter(
        item => !(item.userId === auth.user.id && item.itemType === itemType && item.itemId === itemId)
      );
      writeDb(db);
      sendJson(res, 200, {
        message: "Removed from wishlist.",
        wishlist: db.wishlist
          .filter(item => item.userId === auth.user.id)
          .map(item => withWishlistDetails(item, db))
      });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/test-rides") {
      const auth = getSessionUser(req, db);
      if (!auth) {
        sendJson(res, 401, { message: "Please log in to view test rides." });
        return;
      }

      const rides = db.testRides
        .filter(item => item.userId === auth.user.id)
        .map(item => withTestRideDetails(item, db));
      sendJson(res, 200, rides);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/test-rides") {
      const auth = getSessionUser(req, db);
      if (!auth) {
        sendJson(res, 401, { message: "Please log in to request a test ride." });
        return;
      }

      const body = await parseBody(req);
      const bike = db.saleBikes.find(item => item.id === body.saleBikeId);
      if (!bike) {
        sendJson(res, 404, { message: "Showroom bike not found." });
        return;
      }

      const preferredDate = String(body.preferredDate || "").trim() || new Date().toISOString().slice(0, 10);
      const testRide = {
        id: crypto.randomUUID(),
        userId: auth.user.id,
        saleBikeId: bike.id,
        preferredDate,
        status: "Requested",
        requestedAt: new Date().toISOString()
      };
      db.testRides.push(testRide);
      writeDb(db);
      sendJson(res, 201, {
        message: `Test ride requested for ${bike.name} on ${preferredDate}.`,
        testRide: withTestRideDetails(testRide, db)
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/test-rides/cancel") {
      const auth = getSessionUser(req, db);
      if (!auth) {
        sendJson(res, 401, { message: "Please log in to update test rides." });
        return;
      }

      const body = await parseBody(req);
      const testRideIndex = db.testRides.findIndex(
        item => item.id === body.testRideId && item.userId === auth.user.id
      );
      const testRide = testRideIndex >= 0 ? db.testRides[testRideIndex] : null;
      if (!testRide) {
        sendJson(res, 404, { message: "Test ride not found." });
        return;
      }

      db.testRides.splice(testRideIndex, 1);
      writeDb(db);
      sendJson(res, 200, {
        message: "Test ride cancelled and removed from activity.",
        removedId: body.testRideId
      });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/used-bikes") {
      const auth = getSessionUser(req, db);
      const listings = (db.usedListings || [])
        .slice()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map(item => withUsedListingDetails(item, db, auth?.user?.id));
      sendJson(res, 200, listings);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/used-bikes") {
      const auth = getSessionUser(req, db);
      if (!auth) {
        sendJson(res, 401, { message: "Please log in to post a used bike listing." });
        return;
      }

      const body = await parseBody(req);
      const listing = {
        id: crypto.randomUUID(),
        sellerId: auth.user.id,
        sellerName: String(body.sellerName || auth.user.name || "RideEasy Seller").trim(),
        brand: String(body.brand || "").trim() || "Unknown",
        model: String(body.model || "").trim() || "Bike",
        year: Number(body.year) || new Date().getFullYear(),
        city: String(body.city || "").trim() || "India",
        kmsDriven: Number(body.kmsDriven) || 0,
        owners: Number(body.owners) || 1,
        price: Number(body.price) || 0,
        image: String(body.image || "").trim(),
        description: String(body.description || "").trim(),
        status: "Active",
        createdAt: new Date().toISOString()
      };

      db.usedListings = db.usedListings || [];
      db.usedListings.push(listing);
      writeDb(db);
      sendJson(res, 201, {
        message: "Used bike listing published successfully.",
        listing: withUsedListingDetails(listing, db, auth.user.id)
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/used-bikes/update") {
      const auth = getSessionUser(req, db);
      if (!auth) {
        sendJson(res, 401, { message: "Please log in to update your listing." });
        return;
      }

      const body = await parseBody(req);
      db.usedListings = db.usedListings || [];
      const listing = db.usedListings.find(item => item.id === body.id && item.sellerId === auth.user.id);
      if (!listing) {
        sendJson(res, 404, { message: "Listing not found." });
        return;
      }

      listing.brand = String(body.brand || listing.brand).trim();
      listing.model = String(body.model || listing.model).trim();
      listing.year = Number(body.year) || listing.year;
      listing.city = String(body.city || listing.city).trim();
      listing.kmsDriven = Number(body.kmsDriven) || listing.kmsDriven;
      listing.owners = Number(body.owners) || listing.owners;
      listing.price = Number(body.price) || listing.price;
      listing.image = String(body.image || listing.image).trim();
      listing.description = String(body.description || listing.description).trim();
      listing.status = String(body.status || listing.status);
      listing.updatedAt = new Date().toISOString();

      writeDb(db);
      sendJson(res, 200, {
        message: "Listing updated successfully.",
        listing: withUsedListingDetails(listing, db, auth.user.id)
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/used-bikes/remove") {
      const auth = getSessionUser(req, db);
      if (!auth) {
        sendJson(res, 401, { message: "Please log in to remove your listing." });
        return;
      }

      const body = await parseBody(req);
      db.usedListings = db.usedListings || [];
      const listingIndex = db.usedListings.findIndex(
        item => item.id === body.id && item.sellerId === auth.user.id
      );
      if (listingIndex < 0) {
        sendJson(res, 404, { message: "Listing not found." });
        return;
      }

      const listingId = db.usedListings[listingIndex].id;
      db.usedListings.splice(listingIndex, 1);
      db.usedInterests = (db.usedInterests || []).filter(item => item.listingId !== listingId);
      writeDb(db);
      sendJson(res, 200, { message: "Listing removed.", removedId: listingId });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/used-bikes/interest") {
      const auth = getSessionUser(req, db);
      if (!auth) {
        sendJson(res, 401, { message: "Please log in to connect with sellers." });
        return;
      }

      const body = await parseBody(req);
      db.usedListings = db.usedListings || [];
      db.usedInterests = db.usedInterests || [];

      const listing = db.usedListings.find(item => item.id === body.listingId);
      if (!listing) {
        sendJson(res, 404, { message: "Used bike listing not found." });
        return;
      }
      if (listing.sellerId === auth.user.id) {
        sendJson(res, 400, { message: "You cannot send interest to your own listing." });
        return;
      }

      const existing = db.usedInterests.find(
        item => item.listingId === listing.id && item.userId === auth.user.id
      );
      if (existing) {
        sendJson(res, 200, { message: "Interest already sent for this listing." });
        return;
      }

      const interest = {
        id: crypto.randomUUID(),
        listingId: listing.id,
        userId: auth.user.id,
        note: String(body.note || "").trim(),
        createdAt: new Date().toISOString()
      };
      db.usedInterests.push(interest);
      writeDb(db);
      sendJson(res, 201, { message: "Seller contact request sent successfully.", interest });
      return;
    }

    sendJson(res, 404, { message: "Route not found." });
  } catch (error) {
    sendJson(res, 500, { message: error.message || "Internal server error." });
  }
});

server.listen(PORT, () => {
  console.log(`RideEasy backend listening on port ${PORT}`);
});
