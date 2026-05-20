import api from "./axios";

export const getPetTypes = (params) => {
  return api.get("/pet-types", { params });
};

export const createPetType = (petTypeData) => {
  return api.post("/pet-types", petTypeData);
};

export const updatePetType = (id, petTypeData) => {
  return api.put(`/pet-types/${id}`, petTypeData);
};

export const deletePetType = (id) => {
  return api.delete(`/pet-types/${id}`);
};
