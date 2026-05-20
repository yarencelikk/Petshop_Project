const Iyzipay = require("iyzipay");
const logger = require("../utils/logger");

const iyzipay = new Iyzipay({
  apiKey: process.env.IYZIPAY_API_KEY,
  secretKey: process.env.IYZIPAY_SECRET_KEY,
  uri: process.env.IYZIPAY_BASE_URL,
});
/** @param {Object} data */
const createPayment = (data) => {
  return new Promise((resolve, reject) => {
    iyzipay.payment.create(data, (err, result) => {
      if (err) {
        logger.error(`Iyzico Bağlantı Hatası: ${err}`);
        return reject(err);
      }
      resolve(result);
    });
  });
};

module.exports = {
  iyzipay,
  createPayment,
};
