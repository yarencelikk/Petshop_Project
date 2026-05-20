import api from "./axios";

export const registerUser = (userData) => {
  return api.post("/users/register", userData);
};

export const loginUser = (credentials) => {
  return api.post("/users/login", credentials);
};

export const getMyProfile = () => {
  return api.get("/users/profile");
};

export const createAdmin = (adminData) => {
  return api.post("/users/admins", adminData);
};

export const updateProfile = (profileData) => {
  return api.post("/users/update_profile", profileData);
};

export const changePassword = (passwordData) => {
  return api.patch("/users/change-password", passwordData);
};

export const getAllUsers = (params) => {
  return api.get("/users/all", { params });
};

export const getUserById = (id) => {
  return api.get(`/users/detail/${id}`);
};

export const deleteUser = (id) => {
  return api.delete(`/users/${id}`);
};
