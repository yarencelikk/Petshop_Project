import TrustBar from "../components/TrustBar";
import CategoryGrid from "../components/CategoryGrid";
import Hero from "../components/Hero";
import FeaturedProducts from "../components/FeaturedProducts";

function HomePage() {
  return (
    <div className="homepage-container">
      <Hero />
      <CategoryGrid />
      <FeaturedProducts />
      <TrustBar />
    </div>
  );
}

export default HomePage;
