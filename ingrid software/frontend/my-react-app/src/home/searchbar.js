import React, { useState } from "react";

function SearchBar({ setProperties }) {
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams();

      if (keyword.trim()) params.append("keyword", keyword.trim());
      if (location.trim()) params.append("location", location.trim());
      if (type) params.append("type", type);
      if (maxPrice) params.append("maxPrice", maxPrice);

      const response = await fetch(`/api/properties?${params.toString()}`);
      const data = await response.json();
      setProperties(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Search failed:", error);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <section className="search-section fade-in">
      <div className="search-box">
        <input
          type="text"
          placeholder="Keyword (e.g. condo, modern, downtown)"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <input
          type="text"
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All Types</option>
          <option value="short-term">Short-Term</option>
          <option value="rental">Long-Term</option>
          <option value="buy">Buy</option>
        </select>

        <input
          type="number"
          placeholder="Max Price"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <button onClick={handleSearch} disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </div>
    </section>
  );
}

export default SearchBar;