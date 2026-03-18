import React, { useState } from "react";
import "./Contact.css";
import { sendContactMessage } from "../api/client";

function Contact() {
  const [contact, setContact] = useState({
    name: "",
    email: "",
    message: ""
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  function validate() {
    const newErrors = {};

    if (!/^[A-Za-z\s]{3,}$/.test(contact.name)) {
      newErrors.name = "Name must contain at least 3 letters";
    }

    if (!/\S+@\S+\.\S+/.test(contact.email)) {
      newErrors.email = "Enter valid email";
    }

    if (contact.message.length < 10) {
      newErrors.message = "Message must be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function submitContact() {
    try {
      setIsSubmitting(true);
      const response = await sendContactMessage(contact);
      setStatusMessage(response.message);
      setContact({
        name: "",
        email: "",
        message: ""
      });
      setErrors({});
    } catch (error) {
      setStatusMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    setStatusMessage("");

    if (validate()) {
      submitContact();
    }
  }

  const statusClass = statusMessage.toLowerCase().includes("successfully")
    ? "success-text"
    : "error-text";

  return (
    <div className="register-page">
      <div className="form-container">
        <h2>Contact Us</h2>
        {statusMessage ? <p className={`status-message ${statusClass}`}>{statusMessage}</p> : null}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Your Name"
            value={contact.name}
            onChange={e => setContact({ ...contact, name: e.target.value })}
          />
          <p className="error">{errors.name}</p>

          <input
            type="email"
            placeholder="Your Email"
            value={contact.email}
            onChange={e => setContact({ ...contact, email: e.target.value })}
          />
          <p className="error">{errors.email}</p>

          <textarea
            placeholder="Your Message"
            rows="4"
            value={contact.message}
            onChange={e => setContact({ ...contact, message: e.target.value })}
          />
          <p className="error">{errors.message}</p>

          <button className="btn" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send Message"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Contact;
