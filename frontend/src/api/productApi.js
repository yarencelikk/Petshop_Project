import api from "./axios";

const getUploadsBaseUrl = () => {
  return (api.defaults.baseURL || "").replace(/\/api\/?$/, "");
};

export const getImageUrl = (imagePath) => {
  if (!imagePath) return "";
  if (/^https?:\/\//i.test(imagePath)) return imagePath;

  const normalizedPath = imagePath.startsWith("/")
    ? imagePath
    : `/${imagePath}`;

  return `${getUploadsBaseUrl()}${normalizedPath}`;
};

const formatPrice = (price) => {
  if (price === undefined || price === null || price === "") {
    return "Fiyat bilgisi yok";
  }

  const numericPrice = Number(price);

  if (Number.isNaN(numericPrice)) {
    return `${price} TL`;
  }

  return `${numericPrice.toLocaleString("tr-TR")} TL`;
};

export const normalizeProduct = (product) => {
  const variants = product.variants || [];
  const firstVariant = variants[0] || {};
  const images = Array.isArray(product.images)
    ? product.images.map(getImageUrl).filter(Boolean)
    : [];

  return {
    ...product,
    title: product.name,
    brand: product.brand?.name || "Pati Market",
    image: images[0] || "",
    images,
    price: formatPrice(firstVariant.price),
    stock: variants.reduce((total, variant) => {
      return total + Number(variant.stock || 0);
    }, 0),
    selectedVariantId: firstVariant.id,
  };
};

export const getProducts = (params) => api.get("/products", { params });

export const getProductById = (id) => api.get(`/products/${id}`);

export const createProduct = (productData) => {
  return api.post("/products", productData);
};

export const updateProduct = (id, productData) => {
  return api.put(`/products/${id}`, productData);
};

export const updateProductVariant = (id, variantData) => {
  return api.put(`/products/variant/${id}`, variantData);
};

export const deleteProduct = (id) => {
  return api.delete(`/products/${id}`);
};
