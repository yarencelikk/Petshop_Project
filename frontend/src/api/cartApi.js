import api from "./axios";
import { getImageUrl } from "./productApi";

export const CART_UPDATED_EVENT = "cart-updated";

export const notifyCartUpdated = () => {
  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
};

const formatPrice = (price) => {
  const numericPrice = Number(price || 0);
  return numericPrice.toLocaleString("tr-TR");
};

export const normalizeCartItem = (item) => {
  const variant = item.variant || {};
  const product = variant.product || {};
  const images = Array.isArray(product.images) ? product.images : [];
  const price = Number(variant.price || 0);

  return {
    id: item.id,
    variant_id: variant.id,
    title: product.name,
    specs: variant.variant_name,
    price,
    priceText: `${formatPrice(price)} TL`,
    quantity: item.quantity,
    image: getImageUrl(images[0]),
  };
};

export const getCart = () => api.get("/cart");

export const addToCart = async (variantId, quantity = 1) => {
  const response = await api.post("/cart", { variant_id: variantId, quantity });
  notifyCartUpdated();
  return response;
};

export const removeFromCart = async (variantId) => {
  const response = await api.delete(`/cart/remove/${variantId}`);
  notifyCartUpdated();
  return response;
};

export const updateCartItemQuantity = async (variantId, quantity) => {
  const response = await api.patch(`/cart/${variantId}`, { quantity });
  notifyCartUpdated();
  return response;
};

export const clearCart = async () => {
  const response = await api.delete("/cart/clear");
  notifyCartUpdated();
  return response;
};
