import api from "./axios";

export const getCategories = (params) => {
  return api.get("/categories", { params });
};

export const createCategory = (categoryData) => {
  return api.post("/categories", categoryData);
};

export const updateCategory = (id, categoryData) => {
  return api.put(`/categories/${id}`, categoryData);
};

export const deleteCategory = (id) => {
  return api.delete(`/categories/${id}`);
};
