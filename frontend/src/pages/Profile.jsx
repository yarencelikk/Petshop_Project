import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyProfile } from "../api/authApi";
import { notifyCartUpdated } from "../api/cartApi";
import { getOrders } from "../api/orderApi";
import AddressManager from "./Address";
import Favorites from "./Favorites";
import Settings from "./Settings";
import Orders from "./Orders";
import "../css/Profile.css";

const statusLabels = {
  pending: "Beklemede",
  preparing: "Hazırlanıyor",
  shipped: "Kargoda",
  delivered: "Teslim Edildi",
  cancelled: "İptal Edildi",
};

const statusClasses = {
  pending: "ship",
  preparing: "ship",
  shipped: "ship",
  delivered: "delivered",
  cancelled: "cancelled",
};

const statusIcons = {
  pending: "schedule",
  preparing: "inventory_2",
  shipped: "local_shipping",
  delivered: "package_2",
  cancelled: "cancel",
};

const formatOrderDate = (value) => {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const getAssetUrl = (path) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const origin = apiUrl.replace(/\/api\/?$/, "");

  return `${origin}${path}`;
};

const Profile = ({ initialView = "profile" }) => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState(initialView);
  const [recentOrders, setRecentOrders] = useState([]);
  const [profile, setProfile] = useState(() => getStoredUser());

  const displayName =
    `${profile?.name || ""} ${profile?.surname || ""}`.trim() || "Pati Üyesi";

  const profileImageUrl = getAssetUrl(profile?.image);

  useEffect(() => {
    const fetchRecentOrders = async () => {
      try {
        const response = await getOrders({ per_page: 2 });
        setRecentOrders(response.data.data.orders);
      } catch {
        setRecentOrders([]);
      }
    };

    queueMicrotask(fetchRecentOrders);
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getMyProfile();
        setProfile(response.data.data);
      } catch {
        setProfile((currentProfile) => currentProfile || getStoredUser());
      }
    };

    queueMicrotask(fetchProfile);
  }, []);

  const renderContent = () => {
    if (activeView === "addresses") {
      return <AddressManager />;
    }

    if (activeView === "orders") {
      return <Orders />;
    }

    if (activeView === "favorites") {
      return <Favorites />;
    }

    if (activeView === "settings") {
      return <Settings />;
    }

    return (
      <>
        <section className="welcome-banner">
          <div className="banner-text">
            <h2>Hoş geldin, {displayName}!</h2>
            <p>Senin ve dostların için her şey hazır.</p>
          </div>
          <span className="material-symbols-outlined banner-icon">pets</span>
        </section>

        <div className="grid-row">
          <section className="section-card">
            <div className="profile-section-header">
              <h3>Son Siparişlerim</h3>
              <button
                className="profile-inline-link"
                type="button"
                onClick={() => setActiveView("orders")}
              >
                Tümünü Gör
              </button>
            </div>

            {recentOrders.length === 0 && (
              <p className="empty-profile-text">Henüz siparişiniz yok.</p>
            )}

            {recentOrders.map((order) => {
              const statusClass = statusClasses[order.status] || "ship";

              return (
                <div key={order.id} className="order-item">
                  <div className="order-info">
                    <div className={`order-icon ${statusClass}`}>
                      <span className="material-symbols-outlined">
                        {statusIcons[order.status] || "package_2"}
                      </span>
                    </div>
                    <div>
                      <p>#PATI-{order.id}</p>
                      <small>{formatOrderDate(order.created_at)}</small>
                    </div>
                  </div>
                  <div className="order-status">
                    <span className={`profile-status-badge ${statusClass}`}>
                      {statusLabels[order.status] || order.status}
                    </span>
                    <p>
                      {Number(order.total_price || 0).toLocaleString("tr-TR")}{" "}
                      TL
                    </p>
                  </div>
                </div>
              );
            })}
          </section>
        </div>
      </>
    );
  };

  const navItems = [
    { id: "orders", icon: "package_2", label: "SİPARİŞLERİM" },
    { id: "profile", icon: "person", label: "PROFİLİM" },
    { id: "addresses", icon: "location_on", label: "ADRESLER" },
    { id: "favorites", icon: "favorite", label: "FAVORİLERİM" },
    { id: "settings", icon: "settings", label: "AYARLAR" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    notifyCartUpdated();
    navigate("/");
  };

  return (
    <div className="pati-container">
      <main className="main-layout">
        <aside className="profile-sidebar">
          <div className="profile-sidebar-card">
            <div className="user-avatar user-avatar-placeholder">
              {profileImageUrl ? (
                <img
                  className="sidebar-avatar-image"
                  src={profileImageUrl}
                  alt={displayName}
                />
              ) : (
                <span className="material-symbols-outlined">person</span>
              )}
            </div>
            <div className="user-info">
              <h3>{displayName}</h3>
            </div>
          </div>

          <nav className="profile-sidebar-nav">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`profile-nav-item ${
                  activeView === item.id ? "active" : ""
                }`}
                onClick={() => setActiveView(item.id)}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                {item.label}
              </button>
            ))}

            <button
              type="button"
              className="profile-nav-item logout-nav-item"
              onClick={handleLogout}
            >
              <span className="material-symbols-outlined">logout</span>
              ÇIKIŞ YAP
            </button>
          </nav>
        </aside>

        <div className="content-area">{renderContent()}</div>
      </main>
    </div>
  );
};

export default Profile;
