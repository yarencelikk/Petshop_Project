import api from "./axios";

export const getBrands = (params) => {
  return api.get("/brands", { params });
};

export const createBrand = (brandData) => {
  return api.post("/brands", brandData);
};

export const updateBrand = (id, brandData) => {
  return api.put(`/brands/${id}`, brandData);
};

export const deleteBrand = (id) => {
  return api.delete(`/brands/${id}`);
};
