import api from "./axios";

export const getAvailableCoupons = (params) => {
  return api.get("/coupons/available", { params });
};

export const validateCoupon = (code, cartTotal) => {
  return api.post("/coupons/validate", { code, cartTotal });
};
