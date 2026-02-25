import Navbar from "..home/navbar";
import React, { useState } from "react";
import Main from "..home/main";
import SearchBar from "..home/searchBar";
import Features from "..home/features";
import Footer from "..home/footer";
import "./home.css";
import PropertyList from "..home/PropertyList";
function Home() {
  const [properties, setProperties] = useState([]);

  return (
    <>
      <Navbar />
      <Main />
      <SearchBar setProperties={setProperties} />
      <Features />
      <PropertyList properties={properties} />
      <Footer />
    </>
  );
}

export default Home;