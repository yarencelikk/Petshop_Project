import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api/authApi";
import "../css/Auth.css";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
    phone_number: "",
    password: "",
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
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

    if (!acceptedTerms) {
      setMessage("Devam etmek için kullanım koşullarını kabul etmelisiniz.");
      return;
    }

    setIsLoading(true);

    try {
      await registerUser({
        ...formData,
        phone_number: formData.phone_number.replace(/\s/g, ""),
      });
      navigate("/login");
    } catch (error) {
      const validationMessage = error.response?.data?.errors?.[0]?.message;
      setMessage(
        validationMessage ||
          error.response?.data?.message ||
          "Kayıt oluşturulamadı.",
      );
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
        <div className="auth-visual register-visual">
          <div className="visual-overlay">
            <div className="visual-content">
              <span className="material-symbols-outlined visual-logo">
                pets
              </span>
              <h1>Pati Market</h1>
              <p>
                Sürdürülebilir ve doğal içeriklerle evcil dostlarınızın yaşam
                kalitesini artırın.
              </p>
            </div>
          </div>
        </div>

        <div className="auth-form-side">
          <div className="auth-card">
            <header className="auth-header">
              <h2>Hesap Oluştur</h2>
              <p>Senin ve dostların için yeni bir başlangıç yapalım.</p>
            </header>

            <form className="auth-form" onSubmit={handleSubmit}>
              {message && <p className="auth-message error">{message}</p>}

              <div className="form-group">
                <label htmlFor="name">Ad</label>
                <div className="input-wrapper">
                  <span className="material-symbols-outlined input-icon">
                    person
                  </span>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Ayşe"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="surname">Soyad</label>
                <div className="input-wrapper">
                  <span className="material-symbols-outlined input-icon">
                    badge
                  </span>
                  <input
                    type="text"
                    id="surname"
                    name="surname"
                    value={formData.surname}
                    onChange={handleChange}
                    placeholder="Yılmaz"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">E-posta Adresi</label>
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
                    placeholder="email@ornek.com"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="phone_number">Telefon Numarası</label>
                <div className="input-wrapper">
                  <span className="material-symbols-outlined input-icon">
                    call
                  </span>
                  <input
                    type="tel"
                    id="phone_number"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    placeholder="05XX XXX XX XX"
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
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="********"
                    required
                  />
                </div>
              </div>

              <div className="terms-checkbox">
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                />
                <label htmlFor="terms">
                  Kullanım koşullarını ve <span>Gizlilik Politikası</span>'nı
                  okudum.
                </label>
              </div>

              <button type="submit" className="auth-btn" disabled={isLoading}>
                {isLoading ? "Kayıt oluşturuluyor..." : "Kayıt Ol"}
              </button>
            </form>

            <div className="auth-footer-divider">
              <p>
                Zaten bir hesabın var mı? <Link to="/login">Giriş Yap</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
