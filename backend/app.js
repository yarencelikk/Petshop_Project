const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const logger = require("./utils/logger");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { sequelize } = require("./models");
const cors = require("cors");
const routes = require("./routes/index");
const app = express();
const server = http.createServer(app);
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://127.0.0.1:5173",
  process.env.ADMIN_FRONTEND_URL || "http://127.0.0.1:5174",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5175",
  "http://localhost:5175",
];
const localDevOriginPattern = /^http:\/\/(localhost|127\.0\.0\.1):517\d$/;
const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || localDevOriginPattern.test(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS origin reddedildi: ${origin}`));
  },
};
const io = new Server(server, {
  cors: {
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || localDevOriginPattern.test(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Socket CORS origin reddedildi: ${origin}`));
    },
    methods: ["GET", "POST"],
  },
});

require("./sockets/chatSocket")(io);

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 5000;
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));
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
    // logger.info("Bu bir bilgi logudur (Combined logda görünmeli)");
    // logger.warn("Bu bir uyarı logudur");
    // logger.error(
    //   "Bu bir hata logudur (Hem error hem combined logda görünmeli)",
    // );
    console.log("Veritabanı bağlantısı başarılı.");
    server.listen(PORT, () => {
      console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor.`);
    });
  } catch (error) {
    console.error("Veritabanına bağlanılamadı:", error);
  }
}
startServer();
