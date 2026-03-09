import Navbar from "./navbar";
import Main from "./main";
import SearchBar from "./searchbar";
import Features from "./features";
import Footer from "./footer";
import PropertyList from "./propertyList";
import React, { useState } from "react";
import "./home.css";
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