# 🐾 Pati Market – Evcil Hayvan E-Ticaret Platformu

![Pati Market ana sayfa](docs/screenshots/anasayfa.png)

Kedi, köpek, kuş ve akvaryum ürünleri için geliştirilmiş, uçtan uca bir e-ticaret uygulaması. Müşteri sitesi, yönetim paneli, iyzico ile ödeme ve yapay zekâ destekli canlı destek içerir.

## ✨ Özellikler

**Müşteri tarafı**
- Kayıt / giriş (JWT tabanlı kimlik doğrulama, bcrypt ile şifreleme)
- Hayvan türüne göre ürün listeleme (köpek, kedi, kuş, akvaryum), filtreleme ve sayfalama
- Varyantlı ürünler (boyut, gramaj vb.) ve çoklu ürün görseli
- Sepet, favoriler (wishlist) ve kupon / kampanya sistemi (örn. `HOSGELDIN100`, `INDIRIM10`)
- Adres yönetimi, sipariş takibi ve sipariş iptali
- **iyzico** ile kart ödemesi (kredi ve banka kartı) ve kapıda ödeme
- Satın alınan ürünlere yorum ve puan verme
- İletişim formu (**Resend** ile e-posta gönderimi)
- Pet blog, yardım merkezi, teslimat ve iade sayfaları

**Canlı destek**
- **Socket.IO** ile gerçek zamanlı sohbet
- İlk yanıtları **Google Gemini** tabanlı yapay zekâ asistanı verir; gerekirse görüşme canlı temsilciye aktarılır
- Sohbet mesajları veritabanında **AES-256-GCM** ile şifrelenerek saklanır

**Yönetim paneli**
- Ayrı bir giriş ekranı ve korumalı admin rotaları
- Gelir, sipariş, ürün ve müşteri özetlerini gösteren panel
- Ürün, marka, kategori ve hayvan türü yönetimi
- Müşteri ve admin listeleri
- Sipariş durumlarını güncelleme (Beklemede → Ödendi → Hazırlanıyor → Kargoda → Teslim Edildi / İptal)
- Canlı destek temsilci paneli

## 📸 Ekran Görüntüleri

### Müşteri Sitesi

| Ana Sayfa | Ürün Listeleme |
|---|---|
| ![Ana sayfa](docs/screenshots/anasayfa-tam.png) | ![Ürün listeleme](docs/screenshots/urun-listeleme.png) |

| Sepet ve Ödeme | Profil |
|---|---|
| ![Sepet](docs/screenshots/sepet.png) | ![Profil](docs/screenshots/profil.png) |

### Yönetim Paneli

| Admin Girişi | Panel |
|---|---|
| ![Admin girişi](docs/screenshots/admin-giris.png) | ![Admin paneli](docs/screenshots/admin-panel.png) |

### Canlı Destek

<img src="docs/screenshots/canli-destek.png" alt="Canlı destek" width="320">

## 🛠️ Kullanılan Teknolojiler

| Katman | Teknolojiler |
|---|---|
| Frontend | React 19, Vite, React Router, Material UI, Axios, Socket.IO Client |
| Backend | Node.js, Express 5, Sequelize ORM, Socket.IO, express-validator, Multer, Winston |
| Veritabanı | PostgreSQL |
| Entegrasyonlar | iyzico (ödeme), Resend (e-posta), Google Gemini (AI destek) |

## 📁 Proje Yapısı

```
PetShop_Project/
├── backend/
│   ├── config/         # Veritabanı yapılandırması
│   ├── controllers/    # İş mantığı
│   ├── middlewares/    # Auth, admin ve dosya yükleme middleware'leri
│   ├── migrations/     # Sequelize migration dosyaları
│   ├── models/         # Sequelize modelleri
│   ├── routes/         # API rotaları (/api/...)
│   ├── seeders/        # Admin kullanıcı, marka, kategori, tür verileri
│   ├── services/       # iyzico, Resend, Gemini, mesaj şifreleme
│   ├── sockets/        # Canlı destek socket olayları
│   ├── validators/     # İstek doğrulama kuralları
│   └── app.js          # Sunucu giriş noktası
└── frontend/
    ├── admin/          # Admin paneli HTML girişi
    ├── public/
    └── src/
        ├── Admin/      # Admin paneli bileşenleri
        ├── api/        # Backend ile iletişim (Axios)
        ├── components/ # Ortak bileşenler (Header, ChatWidget...)
        ├── pages/      # Sayfalar
        └── css/
```

## 🚀 Kurulum

### Gereksinimler
- Node.js 20+
- PostgreSQL

### 1. Depoyu klonlayın
```bash
git clone https://github.com/yarencelikk/Petshop_Project.git
cd Petshop_Project
```

### 2. Backend
```bash
cd backend
npm install
```

`backend/.env` dosyasını oluşturun:

```env
PORT=5000
DATABASE_URL=postgres://kullanici:sifre@localhost:5432/petshop
JWT_SECRET=gizli_anahtar
JWT_EXPIRES_IN=1d
ADMIN_PASSWORD=admin_sifresi

IYZIPAY_API_KEY=
IYZIPAY_SECRET_KEY=
IYZIPAY_BASE_URL=https://sandbox-api.iyzipay.com

RESEND_API_KEY=
RESEND_FROM_EMAIL=
CONTACT_RECEIVER_EMAIL=

GEMINI_API_KEY=
MESSAGE_ENCRYPTION_KEY=   # 32 byte, base64 (örn: openssl rand -base64 32)
```

Veritabanını hazırlayıp sunucuyu başlatın:

```bash
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
node app.js
```

API `http://localhost:5000/api` adresinde çalışır.

> `GEMINI_API_KEY` tanımlı değilse canlı destek, önceden tanımlı yanıtlarla çalışmaya devam eder.

### 3. Frontend
```bash
cd frontend
npm install
```

`frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

```bash
npm run dev         # Müşteri sitesi → http://127.0.0.1:5173
npm run dev:admin   # Yönetim paneli → http://127.0.0.1:5174
```

Seed ile oluşturulan admin hesabı: `admin@petshop.com` / `.env` içindeki `ADMIN_PASSWORD`.

## 🔌 API Özeti

| Kaynak | Uç nokta |
|---|---|
| Kullanıcılar | `/api/users` – register, login, profile, change-password |
| Ürünler | `/api/products` |
| Kategoriler / Markalar / Türler | `/api/categories`, `/api/brands`, `/api/pet-types` |
| Sepet | `/api/cart` |
| Favoriler | `/api/wishlist` |
| Adresler | `/api/addresses` |
| Siparişler | `/api/orders` |
| Ödeme | `/api/payments` |
| Kuponlar | `/api/coupons` – available, validate |
| Yorumlar | `/api/reviews` |
| E-posta | `/api/emails/contact` |

## 👩‍💻 Geliştirici

**Yaren Çelik** – [GitHub](https://github.com/yarencelikk)
