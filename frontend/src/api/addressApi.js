import api from "./axios";

export const getAddresses = (params) => {
  return api.get("/addresses", { params });
};

export const createAddress = (addressData) => {
  return api.post("/addresses", addressData);
};

export const updateAddress = (id, addressData) => {
  return api.put(`/addresses/${id}`, addressData);
};

export const deleteAddress = (id) => {
  return api.delete(`/addresses/${id}`);
};
