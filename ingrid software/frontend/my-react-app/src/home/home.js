import Navbar from "./navbar";
import Main from "./main";
import SearchBar from "./searchBar";
import Features from "./features";
import Footer from "./footer";
import PropertyList from "./PropertyList";
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