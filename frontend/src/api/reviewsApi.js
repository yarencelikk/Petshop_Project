import api from "./axios";

export const getAllReviews = () => {
  return api.get("/reviews");
};

export const getReviewsByProduct = (productId) => {
  return api.get(`/reviews/product/${productId}`);
};

export const createReview = (reviewsData) => {
  return api.post("/reviews/", reviewsData);
};

export const updateReview = (id, reviewsData) => {
  return api.put(`/reviews/update/${id}`, reviewsData);
};

export const deleteReview = (id) => {
  return api.delete(`/reviews/delete/${id}`);
};
