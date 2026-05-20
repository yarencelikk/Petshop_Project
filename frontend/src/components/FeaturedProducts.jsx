import { useEffect, useRef, useState } from "react";
import ProductCard from "./ProductCard";
import { getProducts, normalizeProduct } from "../api/productApi";
import "../css/FeaturedProducts.css";

const FeaturedProducts = () => {
  const scrollRef = useRef(null);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await getProducts({ per_page: 6, sort: "newest" });
        setProducts(response.data.data.products.map(normalizeProduct));
      } catch (error) {
        setErrorMessage(
          error.response?.data?.message || "Ürünler yüklenemedi.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const scrollProducts = (direction) => {
    const { current } = scrollRef;
    if (!current) return;

    const scrollAmount = current.clientWidth * 0.8;
    current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <section className="featured-section">
      <div className="featured-section-header">
        <h2 className="featured-section-title">Öne Çıkan Ürünler</h2>
        <div className="featured-slider-controls">
          <button
            className="featured-control-btn"
            type="button"
            onClick={() => scrollProducts("left")}
            aria-label="Onceki urunler"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button
            className="featured-control-btn"
            type="button"
            onClick={() => scrollProducts("right")}
            aria-label="Sonraki urunler"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>

      {isLoading && <p className="featured-state">Ürünler yükleniyor...</p>}

      {!isLoading && errorMessage && (
        <p className="featured-state error">{errorMessage}</p>
      )}

      {!isLoading && !errorMessage && (
        <div className="featured-product-grid" ref={scrollRef}>
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={{
                ...product,
                badge: index === 0 ? "ÖNE ÇIKAN" : product.badge,
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default FeaturedProducts;
