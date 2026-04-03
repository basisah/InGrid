import React, { useEffect, useState } from "react";
import Navbar from "./navbar";
import Main from "./main";
import Features from "./features";
import Footer from "./footer";
import SearchBar from "./searchbar";
import PropertyList from "./propertyList";
import "./home.css";

function Home() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await fetch("/api/properties");
        const data = await response.json();
        setProperties(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch homepage properties:", error);
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  return (
    <>
      <Navbar />
      <Main />
      <SearchBar setProperties={setProperties} />
      <Features />
      {loading ? (
        <section className="property-section fade-in">
          <h2>Available Properties</h2>
          <p>Loading properties...</p>
        </section>
      ) : (
        <PropertyList properties={properties} />
      )}
      <Footer />
    </>
  );
}

export default Home;