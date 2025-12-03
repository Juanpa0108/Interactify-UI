/**
 * Recovery.tsx
 * -----------------------
 * Password recovery page component.
 * Allows the user to input their email address
 * and sends a password recovery request to the backend.
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiMail } from "react-icons/fi";
import "./recovery.css";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';


const Recovery: React.FC = () => {
  // State variables
  const [email, setEmail] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  
  const navigate = useNavigate();

  /**
   * Handles email input changes.
   */
  const handleEmailChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const newEmail = e.target.value;
    setEmail(newEmail);

    if (error && newEmail.includes("@") && newEmail.includes(".")) {
      setError("");
    }

    if (message) setMessage("");
  };

  /**
   * Handles form submission.
   * Sends request to backend and redirects on success.
   */
  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    // Basic email validation
    if (!email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid email address.");
      setMessage("");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
         `${API_URL}/api/auth/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Redirect to reset password page with user ID
        if (data.id || data.userId) {
          navigate(`/resetPassword?id=${data.id || data.userId}`);
        } else {
          setMessage("Recovery link sent successfully!");
        }
      } else {
        setError(data.message || "Failed to send recovery link.");
      }
    } catch (err) {
      setError("An error occurred. Please try again later.");
      console.error("Recovery error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="recovery-container">
      <h2>🔒 Password Recovery</h2>
      <p>Enter your email to receive a recovery link.</p>

      <form onSubmit={handleSubmit}>
        <div className="input-container">
          <FiMail className="icon" />
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={handleEmailChange}
            required
            disabled={loading}
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send Link"}
        </button>
      </form>

      {error && <p className="error">{error}</p>}
      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default Recovery;