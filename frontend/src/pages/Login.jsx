import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../api/authApi";
import { notifyCartUpdated } from "../api/cartApi";
import "../css/Auth.css";

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsLoading(true);

    try {
      const response = await loginUser(formData);
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.data));
      notifyCartUpdated();
      navigate("/");
    } catch (error) {
      setMessage(error.response?.data?.message || "Giriş yapılamadı.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-container">
        <span className="big-paw-decoration material-symbols-outlined">
          pets
        </span>
        <div className="auth-visual">
          <div className="visual-overlay">
            <div className="visual-content">
              <span className="material-symbols-outlined visual-logo">
                pets
              </span>
              <h1>Pati Market</h1>
              <p>
                Dostun için her şey burada. Doğal içerikler ve uzman bakımıyla
                evcil hayvanınızın mutluluğunu keşfedin.
              </p>
            </div>
          </div>
        </div>

        <div className="auth-form-side">
          <div className="auth-card">
            <header className="auth-header">
              <h2>Tekrar Hoş Geldin!</h2>
              <p>Hesabına giriş yap ve fırsatları keşfet.</p>
            </header>

            <form className="auth-form" onSubmit={handleSubmit}>
              {message && <p className="auth-message error">{message}</p>}

              <div className="form-group">
                <label htmlFor="email">E-posta</label>
                <div className="input-wrapper">
                  <span className="material-symbols-outlined input-icon">
                    mail
                  </span>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="ornek@email.com"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Şifre</label>
                <div className="input-wrapper">
                  <span className="material-symbols-outlined input-icon">
                    lock
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="********"
                    required
                  />
                  <button
                    type="button"
                    className="visibility-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              <div className="forgot-password">
                <a href="#">Şifremi Unuttum?</a>
              </div>

              <button type="submit" className="auth-btn" disabled={isLoading}>
                {isLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
              </button>
            </form>

            <p className="auth-footer-text">
              Henüz bir hesabın yok mu?{" "}
              <Link to="/register">Şimdi Kayıt Ol</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
