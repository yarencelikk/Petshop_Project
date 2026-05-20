import api from "./axios";

export const getPaymentMethods = () => {
  return api.get("/payments/methods");
};

export const processPayment = (paymentData) => {
  return api.post("/payments/payment", paymentData);
};
