import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getProductById, normalizeProduct } from "../api/productApi";
import { addToCart } from "../api/cartApi";
import { addToWishlist, getWishlist, removeFromWishlist } from "../api/wishlistApi";
import { createReview, getReviewsByProduct } from "../api/reviewsApi";
import "../css/ProductDetail.css";
import {
  MdStar,
  MdStarBorder,
  MdCheckCircle,
  MdRemove,
  MdAdd,
  MdShoppingCart,
  MdLocalShipping,
  MdVerifiedUser,
  MdFavorite,
  MdFavoriteBorder,
  MdChevronRight,
} from "react-icons/md";

const emptyReviewSummary = {
  average_rating: 0,
  review_count: 0,
};

const renderStars = (rating, className = "stars") => {
  const roundedRating = Math.round(Number(rating) || 0);

  return (
    <div className={className}>
      {[1, 2, 3, 4, 5].map((star) =>
        star <= roundedRating ? <MdStar key={star} /> : <MdStarBorder key={star} />,
      )}
    </div>
  );
};

const formatReviewDate = (value) => {
  if (!value) return "";

  return new Date(value).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [mainImage, setMainImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [cartMessage, setCartMessage] = useState("");
  const [wishlistMessage, setWishlistMessage] = useState("");
  const [favoriteVariantIds, setFavoriteVariantIds] = useState(new Set());
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewSummary, setReviewSummary] = useState(emptyReviewSummary);
  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [reviewMessage, setReviewMessage] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      const response = await getReviewsByProduct(id);
      setReviews(response.data.data.reviews || []);
      setReviewSummary(response.data.data.summary || emptyReviewSummary);
    } catch {
      setReviews([]);
      setReviewSummary(emptyReviewSummary);
    }
  }, [id]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await getProductById(id);
        const normalizedProduct = normalizeProduct(response.data.data);
        setProduct(normalizedProduct);
        setMainImage(normalizedProduct.images[0] || "");
        setSelectedVariantId(normalizedProduct.selectedVariantId);
      } catch (error) {
        setErrorMessage(
          error.response?.data?.message || "Ürün detayı yüklenemedi.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  useEffect(() => {
    queueMicrotask(fetchReviews);
  }, [fetchReviews]);

  useEffect(() => {
    const fetchWishlist = async () => {
      if (!localStorage.getItem("token")) {
        setFavoriteVariantIds(new Set());
        return;
      }

      try {
        const response = await getWishlist({ per_page: 1000 });
        const variantIds = new Set(
          response.data.data.wishlist
            .map((item) => item.variants?.id)
            .filter(Boolean)
            .map(String),
        );
        setFavoriteVariantIds(variantIds);
      } catch {
        setFavoriteVariantIds(new Set());
      }
    };

    queueMicrotask(fetchWishlist);
  }, []);

  if (isLoading) {
    return <div className="product-page-wrapper">Ürün yükleniyor...</div>;
  }

  if (errorMessage || !product) {
    return (
      <div className="product-page-wrapper">
        {errorMessage || "Ürün bulunamadı!"}
      </div>
    );
  }

  const variants = product.variants || [];
  const selectedVariant =
    variants.find((variant) => variant.id === selectedVariantId) || variants[0];
  const isInStock = Number(selectedVariant?.stock || product.stock || 0) > 0;
  const selectedPrice = selectedVariant?.price
    ? `${Number(selectedVariant.price).toLocaleString("tr-TR")} TL`
    : product.price;
  const isFavorite = selectedVariant?.id
    ? favoriteVariantIds.has(String(selectedVariant.id))
    : false;

  const handleAddToCart = async () => {
    setCartMessage("");

    if (!selectedVariant?.id) {
      setCartMessage("Sepete eklemek için bir varyant seçmelisiniz.");
      return;
    }

    setIsAddingToCart(true);

    try {
      await addToCart(selectedVariant.id, quantity);
      setCartMessage("Ürün sepete eklendi.");
    } catch (error) {
      setCartMessage(
        error.response?.data?.message || "Ürün sepete eklenemedi.",
      );
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleAddToWishlist = async () => {
    setWishlistMessage("");

    if (!selectedVariant?.id) {
      setWishlistMessage("Favorilere eklemek icin bir varyant secmelisiniz.");
      return;
    }

    try {
      if (isFavorite) {
        await removeFromWishlist(selectedVariant.id);
        setFavoriteVariantIds((current) => {
          const next = new Set(current);
          next.delete(String(selectedVariant.id));
          return next;
        });
        setWishlistMessage("Urun favorilerden cikarildi.");
        return;
      }

      await addToWishlist(selectedVariant.id);
      setFavoriteVariantIds((current) => {
        const next = new Set(current);
        next.add(String(selectedVariant.id));
        return next;
      });
      setWishlistMessage("Urun favorilere eklendi.");
    } catch (error) {
      const message = error.response?.data?.message || "";
      if (message.includes("zaten")) {
        setFavoriteVariantIds((current) => {
          const next = new Set(current);
          next.add(String(selectedVariant.id));
          return next;
        });
        setWishlistMessage("Urun zaten favorilerinizde.");
        return;
      }

      setWishlistMessage(message || "Urun favorilere eklenemedi.");
    }
  };

  const handleSubmitReview = async (event) => {
    event.preventDefault();
    setReviewMessage("");

    if (!selectedVariant?.id) {
      setReviewMessage("Yorum yapmak için bir varyant seçmelisiniz.");
      return;
    }

    setIsSubmittingReview(true);

    try {
      await createReview({
        variant_id: selectedVariant.id,
        rating: newRating,
        comment: newComment.trim(),
      });

      await fetchReviews();
      setNewComment("");
      setNewRating(5);
      setReviewMessage("Değerlendirmeniz kaydedildi.");
    } catch (error) {
      setReviewMessage(
        error.response?.data?.message || "Değerlendirme kaydedilemedi.",
      );
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="product-page-wrapper">
      <main className="product-container">
        <nav className="product-detail-breadcrumbs">
          <a href="/">Ana Sayfa</a>
          <MdChevronRight />
          <a href="/kopek">Ürünler</a>
          <MdChevronRight />
          <span className="product-detail-current">{product.name}</span>
        </nav>

        <div className="product-layout">
          <div className="image-section">
            <div className="main-card sticky-card">
              <div className="hero-image-container">
                {mainImage && <img src={mainImage} alt={product.name} />}
                <div className="product-detail-promo-badge">FIRSAT</div>
                <button
                  className={`product-detail-wishlist-btn ${
                    isFavorite ? "active" : ""
                  }`}
                  type="button"
                  onClick={handleAddToWishlist}
                  aria-pressed={isFavorite}
                  aria-label={
                    isFavorite ? "Favorilerden cikar" : "Favorilere ekle"
                  }
                >
                  {isFavorite ? <MdFavorite /> : <MdFavoriteBorder />}
                </button>
              </div>
              {wishlistMessage && (
                <p className="cart-action-message">{wishlistMessage}</p>
              )}

              <div className="thumbnail-grid">
                {product.images.map((imgUrl, index) => (
                  <button
                    key={imgUrl}
                    className={`thumb-item ${mainImage === imgUrl ? "active-thumb" : ""}`}
                    type="button"
                    onClick={() => setMainImage(imgUrl)}
                  >
                    <img src={imgUrl} alt={`${product.name} ${index + 1}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="content-section">
            <div className="main-card purchase-card">
              <span className="category-tag">{product.brand}</span>
              <h1 className="product-detail-title">{product.name}</h1>
              <div className="rating-stock-row">
                {renderStars(reviewSummary.average_rating)}
                <span className="review-count">
                  ({reviewSummary.review_count} Değerlendirme)
                </span>
                <div className="product-detail-divider"></div>
                <span className="stock-status">
                  <MdCheckCircle /> {isInStock ? "Stokta Var" : "Stokta Yok"}
                </span>
              </div>
              <div className="price-row">
                <span className="product-detail-current-price">
                  {selectedPrice}
                </span>
              </div>
              {variants.length > 0 && (
                <div className="selection-group">
                  <span className="group-label">PAKET SEÇENEĞİ</span>
                  <div className="weight-options">
                    {variants.map((variant) => (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => setSelectedVariantId(variant.id)}
                        className={`option-btn ${
                          selectedVariantId === variant.id ? "active" : ""
                        }`}
                      >
                        {variant.variant_name}
                        <span className="variant-option-meta">
                          {Number(variant.price).toLocaleString("tr-TR")} TL
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {selectedVariant && (
                <p className="variant-stock-text">
                  Stok: {selectedVariant.stock} adet
                </p>
              )}
              <div className="action-row">
                <div className="quantity-picker">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <MdRemove />
                  </button>
                  <span className="qty-value">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <MdAdd />
                  </button>
                </div>
                <button
                  className="add-to-cart-btn"
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!isInStock || isAddingToCart}
                >
                  <MdShoppingCart />
                  {isAddingToCart ? "Ekleniyor..." : "Sepete Ekle"}
                </button>
              </div>
              {cartMessage && (
                <p className="cart-action-message">{cartMessage}</p>
              )}
              <div className="features-grid">
                <div className="product-detail-feature-item">
                  <div className="icon-box">
                    <MdLocalShipping />
                  </div>
                  <span>Ücretsiz Kargo</span>
                </div>
                <div className="product-detail-feature-item">
                  <div className="icon-box">
                    <MdVerifiedUser />
                  </div>
                  <span>Güvenli Ödeme</span>
                </div>
              </div>
            </div>

            <div className="main-card description-card">
              <h3>Ürün Açıklaması</h3>
              <p>{product.description || "Bu ürün için açıklama eklenmemiş."}</p>
            </div>

            <div className="main-card reviews-card">
              <div className="reviews-header">
                <div>
                  <h3>Yorumlar ve Puanlar</h3>
                  <p>
                    Ortalama {reviewSummary.average_rating || 0}/5 ·{" "}
                    {reviewSummary.review_count} değerlendirme
                  </p>
                </div>
                {renderStars(reviewSummary.average_rating, "stars review-stars")}
              </div>

              <form className="review-form" onSubmit={handleSubmitReview}>
                <div className="review-rating-picker" aria-label="Puan seçimi">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      className="review-star-button"
                      onClick={() => setNewRating(rating)}
                      aria-label={`${rating} puan ver`}
                    >
                      {rating <= newRating ? <MdStar /> : <MdStarBorder />}
                    </button>
                  ))}
                </div>
                <textarea
                  value={newComment}
                  onChange={(event) => setNewComment(event.target.value)}
                  placeholder="Ürünle ilgili deneyiminizi yazın"
                  rows="4"
                />
                <button
                  className="submit-review-btn"
                  type="submit"
                  disabled={isSubmittingReview}
                >
                  {isSubmittingReview ? "Gönderiliyor..." : "Puanı Gönder"}
                </button>
                {reviewMessage && (
                  <p className="review-action-message">{reviewMessage}</p>
                )}
              </form>

              <div className="reviews-list">
                {reviews.length === 0 ? (
                  <p className="empty-reviews-text">
                    Bu ürün için henüz değerlendirme yapılmamış.
                  </p>
                ) : (
                  reviews.map((review) => (
                    <article className="review-item" key={review.id}>
                      <div className="review-item-header">
                        <div>
                          <strong>
                            {`${review.user?.name || ""} ${
                              review.user?.surname || ""
                            }`.trim() || "Pati Üyesi"}
                          </strong>
                          <span>{formatReviewDate(review.created_at)}</span>
                        </div>
                        {renderStars(review.rating, "stars review-stars")}
                      </div>
                      {review.variant?.variant_name && (
                        <p className="review-variant">
                          {review.variant.variant_name}
                        </p>
                      )}
                      {review.comment && <p>{review.comment}</p>}
                    </article>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductDetail;

