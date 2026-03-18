import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import "./App.css";

import Navbar from "./components/Navbar";
import Home from "./components/Home";
import AboutUs from "./components/AboutUs";
import Bikes from "./components/Bikes";
import Contact from "./components/Contact";
import Register from "./components/Register";
import Login from "./components/Login";
import Shop from "./components/Shop";
import Activity from "./components/Activity";
import FooterNav from "./components/FooterNav";
import UsedMarket from "./components/UsedMarket";

function App() {
  return (
    <Router>
      <div className="app-shell">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/bikes" element={<Bikes />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/used-market" element={<UsedMarket />} />
          <Route path="/activity" element={<Activity />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
        </Routes>
        <FooterNav />
      </div>
    </Router>
  );
}

export default App;
