import React, { useEffect, useState } from "react";
import "./AboutUs.css";
import { getAboutContent } from "../api/client";

function AboutUs() {
  const [content, setContent] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadContent() {
      try {
        const data = await getAboutContent();
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
    <div className="about-page">
      <h1>{content?.title || "About RideEasy"}</h1>
      <p>
        {content?.description ||
          "RideEasy is a smart bike rental platform that allows people to rent bikes easily and travel freely."}
      </p>
      {error ? <p className="status-message error-text">{error}</p> : null}

      <div className="about-cards">
        <div className="about-card">
          <h3>Our Mission</h3>
          <p>
            {content?.mission ||
              "To make transportation simple and affordable through easy bike rentals available anytime."}
          </p>
        </div>

        <div className="about-card">
          <h3>Our Vision</h3>
          <p>
            {content?.vision ||
              "To become the most trusted bike rental platform helping people travel conveniently."}
          </p>
        </div>

        <div className="about-card">
          <h3>Why Choose Us</h3>
          <p>
            {content?.whyChooseUs ||
              "Affordable pricing, quality bikes, easy booking process, and excellent customer support."}
          </p>
        </div>
      </div>
    </div>
  );
}

export default AboutUs;
