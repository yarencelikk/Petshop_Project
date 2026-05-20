import { useEffect, useState } from "react";
import { getWishlist, normalizeWishlistItem } from "../api/wishlistApi";
import ProductCard from "../components/ProductCard";
import "../css/Favorites.css";

const Favorites = () => {
  const [favoriteProducts, setFavoriteProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  const fetchWishlist = async () => {
    const response = await getWishlist({ per_page: 50 });
    setFavoriteProducts(response.data.data.wishlist.map(normalizeWishlistItem));
  };

  useEffect(() => {
    const loadWishlist = async () => {
      try {
        await fetchWishlist();
      } catch (error) {
        setMessage(error.response?.data?.message || "Favoriler yüklenemedi.");
      } finally {
        setIsLoading(false);
      }
    };

    loadWishlist();
  }, []);

  const handleFavoriteChange = async (isFavorite) => {
    if (!isFavorite) {
      await fetchWishlist();
    }
  };

  return (
    <section className="favorites-container">
      <div className="favorites-header">
        <h1 className="favorites-title">Favorilerim</h1>
        <p className="favorites-description">
          En sevdiğiniz ürünleri yönetin ve dostlarınız için en iyi ürünlere
          hızlıca ulaşın.
        </p>
      </div>

      {isLoading && <p className="favorites-state">Favoriler yükleniyor...</p>}
      {!isLoading && message && <p className="favorites-state">{message}</p>}
      {!isLoading && favoriteProducts.length === 0 && (
        <p className="favorites-state">Favori listeniz boş.</p>
      )}

      <div className="favorites-grid">
        {favoriteProducts.map((product) => (
          <ProductCard
            key={product.wishlist_id}
            product={product}
            onFavoriteChange={handleFavoriteChange}
          />
        ))}
      </div>
    </section>
  );
};

export default Favorites;
