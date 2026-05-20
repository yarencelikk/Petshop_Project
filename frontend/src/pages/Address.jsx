import { useEffect, useState } from "react";
import {
  createAddress,
  deleteAddress,
  getAddresses,
  updateAddress,
} from "../api/addressApi";
import "../css/Address.css";

const emptyForm = {
  title: "",
  city: "",
  district: "",
  address_detail: "",
  is_default: false,
};

const AddressManager = () => {
  const [addresses, setAddresses] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  const fetchAddresses = async () => {
    try {
      const response = await getAddresses({ per_page: 50 });
      setAddresses(response.data.data.addresses);
      setMessage("");
    } catch (error) {
      if (error.response?.status === 404) {
        setAddresses([]);
        setMessage("");
        return;
      }

      setMessage(error.response?.data?.message || "Adresler yüklenemedi.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(fetchAddresses);
  }, []);

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingAddressId(null);
    setIsFormOpen(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setMessage("");
      if (editingAddressId) {
        await updateAddress(editingAddressId, formData);
      } else {
        await createAddress(formData);
      }

      resetForm();
      await fetchAddresses();
    } catch (error) {
      setMessage(error.response?.data?.message || "Adres kaydedilemedi.");
    }
  };

  const handleEdit = (address) => {
    setFormData({
      title: address.title || "",
      city: address.city || "",
      district: address.district || "",
      address_detail: address.address_detail || "",
      is_default: Boolean(address.is_default),
    });
    setEditingAddressId(address.id);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      setMessage("");
      await deleteAddress(id);
      await fetchAddresses();
    } catch (error) {
      setMessage(error.response?.data?.message || "Adres silinemedi.");
    }
  };

  const handleMakeDefault = async (address) => {
    try {
      setMessage("");
      await updateAddress(address.id, { ...address, is_default: true });
      await fetchAddresses();
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Varsayılan adres güncellenemedi.",
      );
    }
  };

  return (
    <section className="address-section">
      <div className="address-header">
        <div>
          <h1 className="title">Kayıtlı Adreslerim</h1>
          <p className="subtitle">
            Siparişleriniz için kayıtlı adreslerinizi buradan yönetebilirsiniz.
          </p>
        </div>
        <button
          className="add-address-btn"
          type="button"
          onClick={() => {
            setFormData(emptyForm);
            setEditingAddressId(null);
            setIsFormOpen((current) => !current);
          }}
        >
          <span className="material-symbols-outlined">add_location_alt</span>
          Yeni Adres Ekle
        </button>
      </div>

      {message && <p className="address-state">{message}</p>}

      {isFormOpen && (
        <form className="address-form" onSubmit={handleSubmit}>
          <div className="address-form-grid">
            <input
              name="title"
              placeholder="Adres Başlığı"
              value={formData.title}
              onChange={handleInputChange}
              required
            />
            <input
              name="city"
              placeholder="İl"
              value={formData.city}
              onChange={handleInputChange}
              required
            />
            <input
              name="district"
              placeholder="İlçe"
              value={formData.district}
              onChange={handleInputChange}
              required
            />
            <label className="address-default-field">
              <input
                name="is_default"
                type="checkbox"
                checked={formData.is_default}
                onChange={handleInputChange}
              />
              Varsayılan adres
            </label>
          </div>
          <textarea
            name="address_detail"
            placeholder="Adres detayı"
            value={formData.address_detail}
            onChange={handleInputChange}
            required
          />
          <div className="address-form-actions">
            <button type="button" className="address-link-btn" onClick={resetForm}>
              Vazgeç
            </button>
            <button type="submit" className="make-default-btn">
              {editingAddressId ? "Güncelle" : "Kaydet"}
            </button>
          </div>
        </form>
      )}

      {isLoading && <p className="address-state">Adresler yükleniyor...</p>}

      {!isLoading && addresses.length === 0 && (
        <p className="address-state">Kayıtlı adresiniz yok.</p>
      )}

      <div className="address-grid">
        {addresses.map((addr) => (
          <div
            key={addr.id}
            className={`address-card ${addr.is_default ? "default" : ""}`}
          >
            <div className="card-top">
              <div className="icon-wrapper">
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontVariationSettings: addr.is_default ? "'FILL' 1" : "none",
                  }}
                >
                  {addr.is_default ? "home" : "location_on"}
                </span>
              </div>
              <div>
                <div className="card-title-group">
                  <h3>{addr.title}</h3>
                  {addr.is_default && (
                    <span className="default-badge">Varsayılan Adres</span>
                  )}
                </div>
                <p className="owner-name">
                  {addr.district}, {addr.city}
                </p>
              </div>
            </div>

            <div className="card-content">
              <div className="info-row">
                <span className="material-symbols-outlined">location_on</span>
                <p>{addr.address_detail}</p>
              </div>
            </div>

            <div className="card-footer">
              <div className="address-footer-links">
                <button
                  className="address-link-btn"
                  type="button"
                  onClick={() => handleEdit(addr)}
                >
                  Düzenle
                </button>
                <button
                  className="address-link-btn delete"
                  type="button"
                  onClick={() => handleDelete(addr.id)}
                >
                  Sil
                </button>
              </div>
              {!addr.is_default && (
                <button
                  className="make-default-btn"
                  type="button"
                  onClick={() => handleMakeDefault(addr)}
                >
                  Varsayılan Yap
                </button>
              )}
            </div>
          </div>
        ))}

        <button
          className="empty-add-card"
          type="button"
          onClick={() => {
            setFormData(emptyForm);
            setEditingAddressId(null);
            setIsFormOpen(true);
          }}
        >
          <div className="empty-icon">
            <span className="material-symbols-outlined">add_location</span>
          </div>
          <h4>Yeni Bir Adres Ekle</h4>
          <p>Teslimat noktalarınızı buraya tanımlayın.</p>
        </button>
      </div>
    </section>
  );
};

export default AddressManager;
