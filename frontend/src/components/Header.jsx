import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { CART_UPDATED_EVENT, getCart } from "../api/cartApi";
import "../css/Header.css";
import logo from "../images/logo.png";

const Header = () => {
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const refreshCartCount = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setCartCount(0);
      return;
    }

    try {
      const response = await getCart();
      const count = response.data.data.items.reduce((total, item) => {
        return total + Number(item.quantity || 0);
      }, 0);
      setCartCount(count);
    } catch {
      setCartCount(0);
    }
  }, []);

  useEffect(() => {
    window.addEventListener(CART_UPDATED_EVENT, refreshCartCount);
    window.addEventListener("storage", refreshCartCount);
    queueMicrotask(refreshCartCount);

    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, refreshCartCount);
      window.removeEventListener("storage", refreshCartCount);
    };
  }, [refreshCartCount]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    const query = searchTerm.trim();
    if (!query) return;

    navigate(`/kopek?search=${encodeURIComponent(query)}`);
  };

  const handleProfileClick = () => {
    const token = localStorage.getItem("token");
    navigate(token ? "/profil" : "/login");
  };

  return (
    <header className="header-shell">
      <div className="header-main-content">
        <Link
          to="/"
          className="logo-section"
          style={{ textDecoration: "none" }}
        >
          <img alt="Pati Market Logo" className="header-logo-img" src={logo} />
          <span className="logo-text">Pati Market</span>
        </Link>

        <form className="search-wrapper" onSubmit={handleSearchSubmit}>
          <div className="search-bar-container">
            <span className="material-symbols-outlined search-icon">
              search
            </span>
            <input
              className="header-input"
              placeholder="Aradığınız ürünü veya dostunuzun ihtiyacını yazın..."
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </form>

        <div className="action-group">
          <button
            className="action-icon-btn"
            type="button"
            onClick={handleProfileClick}
            aria-label="Profil"
          >
            <span className="material-symbols-outlined">person</span>
          </button>

          <button className="action-icon-btn">
            <span className="material-symbols-outlined">light_mode</span>
          </button>

          <div className="cart-link-wrapper">
            <Link to="/sepet" className="cart-main-btn">
              <span className="material-symbols-outlined">shopping_cart</span>
              {cartCount > 0 && (
                <span className="cart-badge-count">{cartCount}</span>
              )}
            </Link>
          </div>
        </div>
      </div>

      <nav className="secondary-nav">
        <div className="nav-links">
          <NavLink
            to="/kopek"
            className={({ isActive }) =>
              isActive ? "nav-anchor active-link" : "nav-anchor"
            }
          >
            Köpek
          </NavLink>

          <NavLink
            to="/kedi"
            className={({ isActive }) =>
              isActive ? "nav-anchor active-link" : "nav-anchor"
            }
          >
            Kedi
          </NavLink>

          <NavLink
            to="/kus"
            className={({ isActive }) =>
              isActive ? "nav-anchor active-link" : "nav-anchor"
            }
          >
            Kuş
          </NavLink>

          <NavLink
            to="/akvaryum"
            className={({ isActive }) =>
              isActive ? "nav-anchor active-link" : "nav-anchor"
            }
          >
            Akvaryum
          </NavLink>

          <Link className="nav-anchor campaign-highlight" to="/kampanyalar">
            <span className="material-symbols-outlined">campaign</span>
            Kampanyalar
          </Link>
        </div>
      </nav>
    </header>
  );
};

export default Header;
