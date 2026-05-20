import api from "./axios";

export const sendAdminEmail = (emailData) => {
  return api.post("/emails/send", emailData);
};

export const sendContactEmail = (emailData) => {
  return api.post("/emails/contact", emailData);
};
