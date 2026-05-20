import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { useEffect } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProductListingPage from "./pages/ProductListing";
import ProductDetail from "./pages/ProductDetail";
import CampaignsPage from "./pages/Campaigns";
import Profile from "./pages/Profile";
import CartPage from "./pages/Cart";
import PetBlog from "./pages/PetBlog";
import Contact from "./pages/Contact";
import Dashboard from "./Admin/Dashboard";
import AdminLogin from "./Admin/AdminLogin";
import { DeliveryInfo, HelpCenter, ReturnPolicy } from "./pages/SupportPages";

// Header ve Footer'ın görünüp görünmeyeceğine karar veren yardımcı bileşen
const AppContent = () => {
  const location = useLocation();

  // Login ve Register sayfalarında Header/Footer gizlensin
  const noHeaderFooter = ["/login", "/register", "/admin", "/admin/login"].includes(
    location.pathname,
  );

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname, location.search]);

  return (
    <>
      {!noHeaderFooter && <Header />}

      <main className={!noHeaderFooter ? "main-content-padding" : ""}>
        <Routes>
          {/* Kimlik Doğrulama Sayfaları */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Genel Sayfalar */}
          <Route path="/" element={<HomePage />} />
          <Route path="/kopek" element={<ProductListingPage key="kopek" />} />
          <Route path="/kedi" element={<ProductListingPage key="kedi" />} />
          <Route path="/kus" element={<ProductListingPage key="kus" />} />
          <Route
            path="/akvaryum"
            element={<ProductListingPage key="akvaryum" />}
          />
          <Route path="/urunler" element={<ProductListingPage />} />
          <Route path="/urun/:id" element={<ProductDetail />} />
          <Route path="/sepet" element={<CartPage />} />
          <Route path="/kampanyalar" element={<CampaignsPage />} />
          <Route path="/pet-blog" element={<PetBlog />} />
          <Route path="/iletisim" element={<Contact />} />
          <Route path="/yardim-merkezi" element={<HelpCenter />} />
          <Route path="/teslimat-bilgileri" element={<DeliveryInfo />} />
          <Route path="/iade-kosullari" element={<ReturnPolicy />} />

          {/* Profil Sayfaları */}
          <Route path="/profil" element={<Profile />} />
          <Route path="/adres" element={<Profile initialView="addresses" />} />

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<Dashboard />} />
        </Routes>
      </main>

      {!noHeaderFooter && <Footer />}
    </>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
