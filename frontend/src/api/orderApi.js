import api from "./axios";

export const getOrders = (params) => {
  return api.get("/orders", { params });
};

export const getOrderById = (id) => {
  return api.get(`/orders/${id}`);
};

export const updateOrderStatus = (id, status) => {
  return api.put(`/orders/status/${id}`, { status });
};

export const cancelOrder = (id) => {
  return api.put(`/orders/cancel/${id}`);
};
