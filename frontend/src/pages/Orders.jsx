import { useEffect, useState } from "react";
import { getImageUrl } from "../api/productApi";
import { getOrderById, getOrders } from "../api/orderApi";
import "../css/Orders.css";

const statusLabels = {
  pending: "Beklemede",
  preparing: "Hazırlanıyor",
  shipped: "Kargoda",
  delivered: "Teslim Edildi",
  cancelled: "İptal Edildi",
};

const statusTypes = {
  pending: "pending",
  preparing: "preparing",
  shipped: "cargo",
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

const formatPrice = (value) => {
  return `${Number(value || 0).toLocaleString("tr-TR")} TL`;
};

const formatDate = (value) => {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const getOrderItems = (order) => {
  return order.orderItems || order.items || [];
};

const getProductImage = (item) => {
  const variant = item?.variants || item?.variant || {};
  const product = variant?.product || {};
  const images = Array.isArray(product?.images) ? product.images : [];
  if (images.length > 0) {
    return getImageUrl(images[0]);
  }
};

const normalizeOrder = (order) => {
  const items = getOrderItems(order);
  const images = items.map(getProductImage).filter(Boolean);

  return {
    ...order,
    displayId: `#PATI-${order.id}`,
    date: formatDate(order.created_at || order.createdAt),
    total: formatPrice(order.total_price),
    statusLabel: statusLabels[order.status] || order.status || "Beklemede",
    statusType: statusTypes[order.status] || "pending",
    statusIcon: statusIcons[order.status] || "schedule",
    images: images.slice(0, 3),
    extraItems: Math.max(items.length - 3, 0),
  };
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  const fetchOrders = async () => {
    try {
      const response = await getOrders({ per_page: 50 });
      setOrders(response.data.data.orders.map(normalizeOrder));
      setMessage("");
    } catch (error) {
      setOrders([]);
      setMessage(error.response?.data?.message || "Siparişler yüklenemedi.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(fetchOrders);
  }, []);

  const handleToggleDetails = async (orderId) => {
    if (selectedOrderId === orderId) {
      setSelectedOrderId(null);
      setSelectedOrder(null);
      return;
    }

    try {
      setMessage("");
      const response = await getOrderById(orderId);
      setSelectedOrderId(orderId);
      setSelectedOrder(response.data.data);
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Sipariş detayı yüklenemedi.",
      );
    }
  };

  return (
    <section className="orders-section">
      <div className="orders-header">
        <h1 className="title">Siparişlerim</h1>
      </div>

      {isLoading && <p className="orders-state">Siparişler yükleniyor...</p>}
      {!isLoading && message && <p className="orders-state">{message}</p>}
      {!isLoading && orders.length === 0 && !message && (
        <p className="orders-state">Henüz siparişiniz bulunmuyor.</p>
      )}

      <div className="orders-feed">
        {orders.map((order) => (
          <article key={order.id} className="order-card">
            <div className="order-card-header">
              <div className="info-group-wrapper">
                <div className="info-item">
                  <span className="label">Sipariş No</span>
                  <span className="value primary-text">{order.displayId}</span>
                </div>
                <div className="info-item">
                  <span className="label">Tarih</span>
                  <span className="value">{order.date}</span>
                </div>
                <div className="info-item">
                  <span className="label">Toplam</span>
                  <span className="value primary-text font-price">
                    {order.total}
                  </span>
                </div>
              </div>

              <div className={`status-badge ${order.statusType}`}>
                <span className="material-symbols-outlined">
                  {order.statusIcon}
                </span>
                <span className="status-text">{order.statusLabel}</span>
              </div>
            </div>

            <div className="order-card-body">
              <div className="product-thumbnails">
                {order.images.map((img, index) => (
                  <img
                    key={`${order.id}-${index}`}
                    src={img}
                    alt="Ürün"
                    className="thumb"
                  />
                ))}
                {order.images.length === 0 && (
                  <div className="extra-count">Görsel yok</div>
                )}
                {order.extraItems > 0 && (
                  <div className="extra-count">+{order.extraItems}</div>
                )}
              </div>

              <div className="action-buttons">
                <button
                  className="btn btn-outline"
                  type="button"
                  onClick={() => handleToggleDetails(order.id)}
                >
                  {selectedOrderId === order.id
                    ? "Detayı Gizle"
                    : "Sipariş Detayı"}
                </button>
              </div>
            </div>

            {selectedOrderId === order.id && selectedOrder && (
              <div className="order-detail-panel">
                {getOrderItems(selectedOrder).map((item) => {
                  const variant = item.variants || item.variant || {};
                  const product = variant.product || {};

                  return (
                    <div key={item.id} className="order-detail-row">
                      <span>{product.name || "Ürün"}</span>
                      <span>{variant.variant_name || variant.sku || "-"}</span>
                      <span>{item.quantity} adet</span>
                      <strong>{formatPrice(item.price_at_purchase)}</strong>
                    </div>
                  );
                })}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
};

export default Orders;
