import React, { useState } from "react";
import "./reviewForm.css";

export default function ReviewForm({
  bookingId,
  propertyId,
  reviewType = "PROPERTY",
  revieweeUserId = null,
  areaName = "",
  onSuccess
}) {
  const [rating, setRating] = useState(5);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please log in first.");
      return;
    }

    if (!bookingId || !propertyId) {
      setError("Missing booking or property information.");
      return;
    }

    if (reviewType === "LANDLORD" && !revieweeUserId) {
      setError("Missing landlord information.");
      return;
    }

    if (reviewType === "AREA" && !areaName.trim()) {
      setError("Missing area name.");
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          booking_id: bookingId,
          property_id: propertyId,
          review_type: reviewType,
          reviewee_user_id: revieweeUserId || null,
          area_name: areaName || null,
          rating: Number(rating),
          description: description.trim() || null
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to submit review.");
      }

      setDescription("");
      setRating(5);

      if (onSuccess) onSuccess(data);
      alert("Review submitted!");
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="review-form" onSubmit={submit}>
      <div className="review-form__header">
        <h3>Leave a Review</h3>
        <div className="review-form__badges">
          <span className="form-role-badge">{reviewType}</span>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="form-group">
        <label htmlFor="rating">Rating</label>
        <div className="interactive-stars">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={`star-btn ${star <= rating ? "star-btn--active" : ""}`}
              onClick={() => setRating(star)}
              aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
            >
              ★
            </button>
          ))}
          <span className="star-label">{rating}/5</span>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="description">
          Review <span className="optional">(optional)</span>
        </label>
        <textarea
          id="description"
          className="review-textarea"
          rows="5"
          maxLength="500"
          placeholder="Share your experience..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="char-count">{description.length}/500</div>
      </div>

      <button className="submit-btn" type="submit" disabled={submitting}>
        {submitting ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}