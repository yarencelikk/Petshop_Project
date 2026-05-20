import { useEffect, useMemo, useRef, useState } from "react";
import { changePassword, getMyProfile, updateProfile } from "../api/authApi";
import "../css/Settings.css";

const initialProfileForm = {
  name: "",
  surname: "",
  email: "",
  phone_number: "",
};

const initialPasswordForm = {
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const getAssetUrl = (path) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const origin = apiUrl.replace(/\/api\/?$/, "");

  return `${origin}${path}`;
};

const Settings = () => {
  const fileInputRef = useRef(null);
  const [notifications, setNotifications] = useState({
    orders: true,
    deals: false,
  });
  const [profileForm, setProfileForm] = useState(initialProfileForm);
  const [passwordForm, setPasswordForm] = useState(initialPasswordForm);
  const [profileImage, setProfileImage] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const previewImage = useMemo(
    () => (selectedImage ? URL.createObjectURL(selectedImage) : ""),
    [selectedImage],
  );

  const avatarUrl = useMemo(
    () => previewImage || getAssetUrl(profileImage),
    [previewImage, profileImage],
  );

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setMessage("");

      try {
        const response = await getMyProfile();
        const profile = response.data.data;

        setProfileForm({
          name: profile.name || "",
          surname: profile.surname || "",
          email: profile.email || "",
          phone_number: profile.phone_number || "",
        });
        setProfileImage(profile.image || "");
        setNotifications({
          orders: profile.notification_orders !== false,
          deals: profile.notification_deals === true,
        });
      } catch (error) {
        setMessage(
          error.response?.data?.message || "Profil bilgileri getirilemedi.",
        );
        setMessageType("error");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    if (!previewImage) return undefined;

    return () => URL.revokeObjectURL(previewImage);
  }, [previewImage]);

  const toggleNotification = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
    }
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleReset = () => {
    clearSelectedImage();
    setPasswordForm(initialPasswordForm);
    setMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    if (
      passwordForm.newPassword &&
      passwordForm.newPassword !== passwordForm.confirmPassword
    ) {
      setMessage("Yeni sifreler eslesmiyor.");
      setMessageType("error");
      setSaving(false);
      return;
    }

    try {
      const payload = new FormData();
      const imageFile = fileInputRef.current?.files?.[0];

      payload.append("name", profileForm.name);
      payload.append("surname", profileForm.surname);
      payload.append("phone_number", profileForm.phone_number);
      payload.append("notification_orders", String(notifications.orders));
      payload.append("notification_deals", String(notifications.deals));

      if (imageFile) {
        payload.append("profile_image", imageFile);
      }

      const profileResponse = await updateProfile(payload);
      const updatedProfile = profileResponse.data.data;

      setProfileForm({
        name: updatedProfile.name || "",
        surname: updatedProfile.surname || "",
        email: updatedProfile.email || profileForm.email,
        phone_number: updatedProfile.phone_number || "",
      });
      setProfileImage(updatedProfile.image || "");
      clearSelectedImage();

      if (passwordForm.oldPassword && passwordForm.newPassword) {
        await changePassword({
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword,
        });
        setPasswordForm(initialPasswordForm);
      }

      setMessage("Profil bilgileriniz basariyla guncellendi.");
      setMessageType("success");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Profil bilgileri guncellenemedi.",
      );
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="settings-container">
        <div className="loading">Profil bilgileri yukleniyor...</div>
      </section>
    );
  }

  return (
    <section className="settings-container">
      <div className="settings-header">
        <h1 className="title">Ayarlar</h1>
        <p className="subtitle">Hesap detaylarinizi ve tercihlerinizi yonetin.</p>
      </div>

      <form className="settings-content" onSubmit={handleSubmit}>
        {message && (
          <p className={`settings-message ${messageType}`}>{message}</p>
        )}

        <div className="settings-card">
          <div className="card-title">
            <span className="material-symbols-outlined">person</span>
            <h2>Profil Ayarlari</h2>
          </div>

          <div className="profile-upload-section">
            <button
              className="avatar-wrapper"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Profil fotografini degistir"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profil" className="current-avatar" />
              ) : (
                <span className="material-symbols-outlined avatar-placeholder">
                  person
                </span>
              )}
              <div className="avatar-overlay">
                <span className="material-symbols-outlined">edit</span>
              </div>
            </button>
            <input
              ref={fileInputRef}
              name="profile_image"
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
              className="visually-hidden"
              onChange={handleImageChange}
            />
            <div className="upload-actions">
              <h3>Profil Fotografi</h3>
              <div className="btn-group">
                <button
                  className="settings-delete-btn"
                  type="button"
                  aria-label="Secili fotografi kaldir"
                  onClick={clearSelectedImage}
                  disabled={!selectedImage}
                >
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
              <p className="upload-hint">JPG, GIF veya PNG. Maksimum 2MB.</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="input-group">
              <label htmlFor="name">Ad</label>
              <input
                id="name"
                name="name"
                type="text"
                value={profileForm.name}
                onChange={handleProfileChange}
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="surname">Soyad</label>
              <input
                id="surname"
                name="surname"
                type="text"
                value={profileForm.surname}
                onChange={handleProfileChange}
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="email">E-posta Adresi</label>
              <input
                id="email"
                name="email"
                type="email"
                value={profileForm.email}
                disabled
              />
            </div>
            <div className="input-group">
              <label htmlFor="phone_number">Telefon Numarasi</label>
              <input
                id="phone_number"
                name="phone_number"
                type="tel"
                value={profileForm.phone_number}
                onChange={handleProfileChange}
                required
              />
            </div>
          </div>
        </div>

        <div className="settings-card">
          <div className="card-title">
            <span className="material-symbols-outlined">
              notifications_active
            </span>
            <h2>Bildirim Tercihleri</h2>
          </div>
          <div className="toggle-list">
            <div className="toggle-item">
              <div className="toggle-info">
                <p className="toggle-label">Siparis Guncellemeleri</p>
                <p className="toggle-hint">
                  Teslimat durumunuz hakkinda SMS ve E-posta alin.
                </p>
              </div>
              <button
                className={`switch ${notifications.orders ? "active" : ""}`}
                type="button"
                onClick={() => toggleNotification("orders")}
                aria-pressed={notifications.orders}
              >
                <div className="dot"></div>
              </button>
            </div>
            <div className="toggle-item border-top">
              <div className="toggle-info">
                <p className="toggle-label">Kampanyalar ve Firsatlar</p>
                <p className="toggle-hint">
                  Uyelere ozel firsatlardan haberdar olun.
                </p>
              </div>
              <button
                className={`switch ${notifications.deals ? "active" : ""}`}
                type="button"
                onClick={() => toggleNotification("deals")}
                aria-pressed={notifications.deals}
              >
                <div className="dot"></div>
              </button>
            </div>
          </div>
        </div>

        <div className="settings-card">
          <div className="card-title">
            <span className="material-symbols-outlined">shield</span>
            <h2>Guvenlik</h2>
          </div>
          <div className="form-grid">
            <div className="input-group full-width">
              <label htmlFor="oldPassword">Mevcut Sifre</label>
              <input
                id="oldPassword"
                name="oldPassword"
                type="password"
                value={passwordForm.oldPassword}
                onChange={handlePasswordChange}
                placeholder="********"
              />
            </div>
            <div className="input-group">
              <label htmlFor="newPassword">Yeni Sifre</label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                placeholder="Min. 8 karakter"
              />
            </div>
            <div className="input-group">
              <label htmlFor="confirmPassword">Yeni Sifre (Tekrar)</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                placeholder="Sifreyi tekrarla"
              />
            </div>
          </div>
        </div>

        <div className="settings-footer">
          <button
            className="btn-large btn-outline"
            type="button"
            onClick={handleReset}
            disabled={saving}
          >
            Iptal
          </button>
          <button className="btn-large btn-primary shadow" type="submit" disabled={saving}>
            {saving ? "Kaydediliyor..." : "Degisiklikleri Kaydet"}
          </button>
        </div>
      </form>
    </section>
  );
};

export default Settings;
