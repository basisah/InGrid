import { useState, useEffect, useCallback } from "react";

export function useReviews({ type, id }) {
  const [reviews, setReviews] = useState([]);
  const [aggregate, setAggregate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReviews = useCallback(async () => {
    if (!id || !type) return;

    setLoading(true);
    setError("");

    try {
      const validTypes = ["property", "landlord", "area"];
      if (!validTypes.includes(type)) {
        throw new Error("Invalid review type.");
      }

      const url = `/api/reviews/${type}/${encodeURIComponent(id)}`;
      const res = await fetch(url);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || data.message || "Failed to load reviews.");
      }

      const data = await res.json();

      if (type === "property" && data.reviews) {
        setReviews(data.reviews);
        setAggregate(data.aggregate || null);
      } else {
        setReviews(Array.isArray(data) ? data : []);
        setAggregate(null);
      }
    } catch (err) {
      setError(err.message || "Failed to load reviews.");
      setReviews([]);
      setAggregate(null);
    } finally {
      setLoading(false);
    }
  }, [type, id]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return {
    reviews,
    aggregate,
    loading,
    error,
    refetch: fetchReviews
  };
}