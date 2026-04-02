import React from "react";
import { useReviews } from "./useReviews";
import ReviewCard from "./reviewCard";
import "./reviewList.css";

export default function ReviewList({ type = "property", id }) {
  const { reviews, aggregate, loading, error } = useReviews({ type, id });

  if (loading) {
    return (
      <div className="review-list">
        <div className="review-list__skeleton">
          <div className="skeleton-card"></div>
          <div className="skeleton-card"></div>
          <div className="skeleton-card"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="review-list__error">{error}</div>;
  }

  if (!reviews.length) {
    return <div className="review-list__empty">No reviews yet.</div>;
  }

  return (
    <div className="review-list">
      {type === "property" && aggregate && (
        <div className="aggregate-bar">
          <div className="aggregate-score">
            <span className="aggregate-number">
              {Number(aggregate.avg_rating || 0).toFixed(1)}
            </span>
            <div>
              <div className="aggregate-count">
                {aggregate.total_reviews} review{aggregate.total_reviews === 1 ? "" : "s"}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="review-list__grid">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  );
}