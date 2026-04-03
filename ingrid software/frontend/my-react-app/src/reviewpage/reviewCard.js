import React from "react";
import "./reviewCard.css";

const StarRating = ({ rating, size = 16 }) => (
  <span className="star-rating" aria-label={`${rating} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((star) => (
      <svg
        key={star}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={star <= rating ? "#F5A623" : "none"}
        stroke={star <= rating ? "#F5A623" : "#CBD5E0"}
        strokeWidth="1.5"
        style={{ display: "inline-block" }}
      >
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
      </svg>
    ))}
  </span>
);

const VerifiedBadge = () => (
  <span className="verified-badge" title="Verified stay">
    Verified Stay
  </span>
);

export default function ReviewCard({ review }) {
  const reviewerName = review.reviewer_name || "Anonymous";
  const rating = Number(review.rating || 0);
  const description = review.description || "";
  const isVerified = !!review.is_verified;
  const createdAt = review.created_at;
  const reviewType = review.review_type;
  const areaName = review.area_name;

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString("en-CA", {
        year: "numeric",
        month: "short",
        day: "numeric"
      })
    : "";

  const roleLabel =
    reviewType === "LANDLORD"
      ? "Landlord"
      : reviewType === "AREA"
      ? "Area"
      : "Property";

  return (
    <div className="review-card">
      <div className="review-card__header">
        <span className="role-badge">{roleLabel}</span>
        {isVerified && <VerifiedBadge />}
      </div>

      <div className="review-card__meta">
        <div className="reviewer-avatar" aria-hidden="true">
          {reviewerName?.[0]?.toUpperCase() ?? "?"}
        </div>

        <div className="reviewer-info">
          <span className="reviewer-name">{reviewerName}</span>
          {areaName && <span className="review-location">{areaName}</span>}
        </div>

        <span className="review-date">{formattedDate}</span>
      </div>

      <div className="review-card__rating">
        <StarRating rating={rating} size={18} />
        <span className="rating-number">{rating.toFixed(1)}</span>
      </div>

      {description && <p className="review-card__description">{description}</p>}
    </div>
  );
}