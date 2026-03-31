// import React, { useState } from "react";

// function SearchBar({ setProperties }) {
//   const [location, setLocation] = useState("");
//   const [type, setType] = useState("");
//   const [maxPrice, setMaxPrice] = useState("");

//   const handleSearch = async () => {
//     try {
//       const response = await fetch(
//         `/api/properties?location=${location}&type=${type}&maxPrice=${maxPrice}`
//       );
//       const data = await response.json();
//       setProperties(data);
//     } catch (error) {
//       console.error("Search failed:", error);
//     }
//   };

//   return (
//     <section className="search-section fade-in">
//       <div className="search-box">
//         <input
//           type="text"
//           placeholder="Location"
//           onChange={(e) => setLocation(e.target.value)}
//         />

//         <select onChange={(e) => setType(e.target.value)}>
//          <option value="">All Types</option>
//          <option value="short-term">Short-Term</option>
//          <option value="rental">Long-Term</option>
//          <option value="buy">Buy</option>
//         </select>

//         <input
//           type="number"
//           placeholder="Max Price"
//           onChange={(e) => setMaxPrice(e.target.value)}
//         />

//         <button onClick={handleSearch}>Search</button>
//       </div>
//     </section>
//   );
// }

// export default SearchBar;