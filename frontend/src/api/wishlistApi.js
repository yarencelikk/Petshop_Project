import api from "./axios";
import { getImageUrl } from "./productApi";

export const getWishlist = (params) => {
  return api.get("/wishlist", { params });
};

export const addToWishlist = (variantId) => {
  return api.post("/wishlist", { variant_id: variantId });
};

export const removeFromWishlist = (variantId) => {
  return api.delete(`/wishlist/${variantId}`);
};

export const normalizeWishlistItem = (item) => {
  const variant = item.variants || {};
  const product = variant.product || {};
  const images = Array.isArray(product.images) ? product.images : [];
  const price = Number(variant.price || 0);

  return {
    id: product.id,
    wishlist_id: item.id,
    variant_id: variant.id,
    selectedVariantId: variant.id,
    product_id: product.id,
    title: product.name,
    name: product.name,
    brand: variant.variant_name || "Pati Market",
    variantName: variant.variant_name,
    price: `${price.toLocaleString("tr-TR")} TL`,
    image: getImageUrl(images[0]),
    images: images.map(getImageUrl).filter(Boolean),
    isFavorite: true,
  };
};
