import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../api/authApi";
import "./AdminLogin.css";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setIsLoading(true);

    try {
      const response = await loginUser(formData);
      const user = response.data.data;

      if (user?.role !== "admin") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setMessage("Bu alana sadece admin yetkisine sahip hesaplar girebilir.");
        return;
      }

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(user));
      navigate("/admin");
    } catch (error) {
      setMessage(error.response?.data?.message || "Admin girisi yapilamadi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="admin-login-page">
      <section className="admin-login-visual" aria-label="Pati Market admin">
        <div className="admin-login-copy">
          <span className="material-symbols-outlined">admin_panel_settings</span>
          <h1>Yonetim Paneli</h1>
          <p>
            Siparisleri, urunleri, musterileri ve katalog verilerini tek yerden
            yonetin.
          </p>
        </div>
      </section>

      <section className="admin-login-panel">
        <div className="admin-login-card">
          <header className="admin-login-header">
            <span className="material-symbols-outlined">lock_person</span>
            <h2>Admin Girisi</h2>
            <p>Yetkili hesabinizla devam edin.</p>
          </header>

          <form className="admin-login-form" onSubmit={handleSubmit}>
            {message && <p className="admin-login-message">{message}</p>}

            <label className="admin-login-field" htmlFor="admin-email">
              <span>E-posta</span>
              <div className="admin-login-input">
                <span className="material-symbols-outlined">mail</span>
                <input
                  id="admin-email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@petshop.com"
                  autoComplete="email"
                  required
                />
              </div>
            </label>

            <label className="admin-login-field" htmlFor="admin-password">
              <span>Sifre</span>
              <div className="admin-login-input">
                <span className="material-symbols-outlined">key</span>
                <input
                  id="admin-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="********"
                  autoComplete="current-password"
                  required
                />
                <button
                  className="admin-login-icon-btn"
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Sifreyi gizle" : "Sifreyi goster"}
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </label>

            <button
              className="admin-login-submit"
              type="submit"
              disabled={isLoading}
            >
              <span className="material-symbols-outlined">login</span>
              {isLoading ? "Kontrol ediliyor..." : "Panele Gir"}
            </button>
          </form>

          <div className="admin-login-footer">
            <Link to="/">Magazaya don</Link>
            <Link to="/login">Musteri girisi</Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default AdminLogin;
