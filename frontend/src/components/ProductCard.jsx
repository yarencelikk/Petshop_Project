import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdAddShoppingCart, MdFavorite, MdFavoriteBorder } from "react-icons/md";
import { addToCart } from "../api/cartApi";
import { addToWishlist, removeFromWishlist } from "../api/wishlistApi";
import "../css/ProductCard.css";

const ProductCard = ({ product, onFavoriteChange }) => {
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(Boolean(product.isFavorite));
  const productTitle = product.title || product.name;
  const productImage = product.image || product.images?.[0];

  const handleCardClick = () => {
    navigate(`/urun/${product.id}`);
  };

  const handleFavoriteClick = async (e) => {
    e.stopPropagation();

    if (!product.selectedVariantId) return;

    try {
      if (isFavorite) {
        await removeFromWishlist(product.selectedVariantId);
        setIsFavorite(false);
        onFavoriteChange?.(false, product);
        return;
      }

      await addToWishlist(product.selectedVariantId);
      setIsFavorite(true);
      onFavoriteChange?.(true, product);
    } catch (error) {
      const message = error.response?.data?.message || "";
      if (message.includes("zaten")) {
        setIsFavorite(true);
      } else {
        console.error(message || "Ürün favorilere eklenemedi.");
      }
    }
  };

  const handleAddToCart = async (e) => {
    e.stopPropagation();

    if (!product.selectedVariantId) return;

    try {
      await addToCart(product.selectedVariantId, 1);
    } catch (error) {
      console.error(error.response?.data?.message || "Ürün sepete eklenemedi.");
    }
  };

  return (
    <div
      className="product-list-card"
      onClick={handleCardClick}
      style={{ cursor: "pointer" }}
    >
      <div className="product-list-image-container">
        {product.badge && (
          <span className={`product-list-badge ${product.badgeColor}`}>
            {product.badge}
          </span>
        )}
        <button
          className={`product-list-fav-button ${isFavorite ? "active" : ""}`}
          onClick={handleFavoriteClick}
        >
          {isFavorite ? <MdFavorite /> : <MdFavoriteBorder />}
        </button>
        {productImage ? (
          <img
            src={productImage}
            alt={productTitle}
            className="product-list-image"
          />
        ) : (
          <div className="product-list-image-placeholder">Görsel yok</div>
        )}
      </div>
      <span className="product-list-brand-name">{product.brand}</span>
      <h3 className="product-list-title">{productTitle}</h3>
      <div className="product-list-price-section">
        <div>
          {product.oldPrice && (
            <span className="product-list-old-price">{product.oldPrice}</span>
          )}
          <span className="product-list-current-price">{product.price}</span>
        </div>
        <button className="product-list-add-cart-btn" onClick={handleAddToCart}>
          <MdAddShoppingCart size={20} />
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
