import Navbar from "./navbar";
import Main from "./main";
import Features from "./features";
import Footer from "./footer";
import SearchBar from "./searchbar";
import { useEffect } from "react";
import PropertyList from "./propertyList";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./home.css";
function Home() {
  const [properties, setProperties] = useState([]);
  const navigate = useNavigate();

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