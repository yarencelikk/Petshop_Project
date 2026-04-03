require("dotenv").config();
const logger = require("./utils/logger");
const express = require("express");
const { sequelize } = require("./models");
const cors = require("cors");
const routes = require("./routes/index");
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 5000;
const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));
app.use(cors());
app.use("/api", routes);

app.use((err, req, res, next) => {
  logger.error(`HATA: ${req.method} ${req.url} - ${err.message}`);
  res.status(500).json({
    success: 0,
    message: err.message || "Sunucu tarafında beklenmedik bir hata oluştu.",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});
async function startServer() {
  try {
    await sequelize.authenticate();
    // Test amaçlı loglar
    logger.info("Bu bir bilgi logudur (Combined logda görünmeli)");
    logger.warn("Bu bir uyarı logudur");
    logger.error(
      "Bu bir hata logudur (Hem error hem combined logda görünmeli)",
    );
    console.log("Veritabanı bağlantısı başarılı.");
    app.listen(PORT, () => {
      console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor.`);
    });
  } catch (error) {
    console.error("Veritabanına bağlanılamadı:", error);
  }
}
startServer();
