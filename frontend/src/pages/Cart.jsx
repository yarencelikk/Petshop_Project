import { useEffect, useState } from "react";
import {
  getCart,
  normalizeCartItem,
  notifyCartUpdated,
  removeFromCart,
  updateCartItemQuantity,
} from "../api/cartApi";
import { validateCoupon } from "../api/couponApi";
import { getPaymentMethods, processPayment } from "../api/paymentApi";
import "../css/Cart.css";
import {
  MdAdd,
  MdChevronRight,
  MdDelete,
  MdLocalShipping,
  MdRemove,
} from "react-icons/md";

const Cart = () => {
  const [items, setItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState("0.00");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("cash_on_delivery");
  const [paymentCard, setPaymentCard] = useState({
    cardHolderName: "",
    cardNumber: "",
    expireMonth: "",
    expireYear: "",
    cvc: "",
  });
  const [identityNumber, setIdentityNumber] = useState("");
  const [paymentMessage, setPaymentMessage] = useState("");
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const cartTotal = Number(totalAmount || 0);
  const discountAmount = appliedCoupon
    ? Math.min(
        cartTotal,
        appliedCoupon.discount_type === "fixed"
          ? Number(appliedCoupon.discount_amount || 0)
          : (cartTotal * Number(appliedCoupon.discount_amount || 0)) / 100,
      )
    : 0;
  const finalAmount = Math.max(0, cartTotal - discountAmount);
  const isCardPayment = ["credit_card", "bank_transfer"].includes(
    paymentMethod,
  );

  const refreshCart = async () => {
    const response = await getCart();
    setItems(response.data.data.items.map(normalizeCartItem));
    setTotalAmount(response.data.data.totalAmount);
    setAppliedCoupon(null);
    setCouponMessage("");
  };

  useEffect(() => {
    const fetchCart = async () => {
      try {
        await refreshCart();
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Sepet yüklenemedi.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCart();
  }, []);

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const response = await getPaymentMethods();
        setPaymentMethods(response.data.data);
      } catch {
        setPaymentMethods([
          { id: "cash_on_delivery", name: "Kapıda Ödeme" },
          { id: "bank_transfer", name: "Banka Kartı" },
          { id: "credit_card", name: "Kredi Kartı" },
        ]);
      }
    };

    fetchPaymentMethods();
  }, []);

  const handleRemove = async (variantId) => {
    try {
      setErrorMessage("");
      await removeFromCart(variantId);
      await refreshCart();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Ürün silinemedi.");
    }
  };

  const handleQuantityChange = async (item, nextQuantity) => {
    try {
      setErrorMessage("");
      await updateCartItemQuantity(item.variant_id, nextQuantity);
      await refreshCart();
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Sepet adedi güncellenemedi.",
      );
    }
  };

  const handleApplyCoupon = async () => {
    const code = couponCode.trim();

    if (!code) {
      setCouponMessage("Kupon kodu girin.");
      return;
    }

    try {
      setCouponMessage("");
      const response = await validateCoupon(code, cartTotal);
      setAppliedCoupon(response.data.data);
      setCouponCode(response.data.data.code);
      setCouponMessage(response.data.message || "Kupon uygulandı.");
    } catch (error) {
      setAppliedCoupon(null);
      setCouponMessage(error.response?.data?.message || "Kupon uygulanamadı.");
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponMessage("");
  };

  const handleCardInputChange = (event) => {
    const { name, value } = event.target;
    setPaymentCard((current) => ({ ...current, [name]: value }));
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;

    const payload = {
      paymentMethod,
      ...(appliedCoupon ? { coupon_code: appliedCoupon.code } : {}),
    };

    if (isCardPayment) {
      payload.paymentCard = {
        ...paymentCard,
        cardNumber: paymentCard.cardNumber.replace(/\D/g, ""),
        expireMonth: paymentCard.expireMonth.replace(/\D/g, ""),
        expireYear: paymentCard.expireYear.replace(/\D/g, ""),
        cvc: paymentCard.cvc.replace(/\D/g, ""),
      };
      payload.identityNumber = identityNumber.replace(/\D/g, "");
    }

    try {
      setPaymentMessage("");
      setIsPaymentProcessing(true);
      const response = await processPayment(payload);
      setPaymentMessage(response.data.message || "Siparişiniz oluşturuldu.");
      setCouponCode("");
      setAppliedCoupon(null);
      await refreshCart();
      notifyCartUpdated();
    } catch (error) {
      const validationMessage = error.response?.data?.errors
        ?.map((item) => item.message)
        .filter(Boolean)
        .join(" ");
      setPaymentMessage(
        validationMessage ||
          error.response?.data?.message ||
          "Ödeme işlemi tamamlanamadı.",
      );
    } finally {
      setIsPaymentProcessing(false);
    }
  };

  return (
    <div className="cart-page">
      <div className="cart-page-container">
        <nav className="cart-breadcrumbs">
          <span>Anasayfa</span>
          <MdChevronRight />
          <span className="active">Sepetim</span>
        </nav>

        <h1 className="page-title">Sepetim ({items.length} Ürün)</h1>

        <div className="cart-grid">
          <div className="cart-items-section">
            {isLoading && (
              <div className="cart-glass-card cart-empty-state">
                Sepet yükleniyor...
              </div>
            )}

            {!isLoading && errorMessage && (
              <div className="cart-glass-card cart-empty-state">
                {errorMessage}
              </div>
            )}

            {!isLoading && !errorMessage && items.length === 0 && (
              <div className="cart-glass-card cart-empty-state">
                Sepetiniz boş.
              </div>
            )}

            {!isLoading &&
              !errorMessage &&
              items.map((item) => (
                <div key={item.id} className="cart-item cart-glass-card">
                  <div className="item-image-wrapper">
                    {item.image && <img src={item.image} alt={item.title} />}
                  </div>
                  <div className="item-details">
                    <span className="brand-label">Pati Market</span>
                    <h3>{item.title}</h3>
                    <p className="specs-text">{item.specs}</p>
                    <div className="item-actions">
                      <button
                        className="action-btn delete"
                        onClick={() => handleRemove(item.variant_id)}
                      >
                        <MdDelete /> Sil
                      </button>
                    </div>
                  </div>
                  <div className="item-price-qty">
                    <div className="price-tag">{item.priceText}</div>
                    <div className="qty-control">
                      <button
                        className="qty-btn"
                        onClick={() =>
                          handleQuantityChange(item, item.quantity - 1)
                        }
                      >
                        <MdRemove />
                      </button>
                      <span className="qty-val">{item.quantity}</span>
                      <button
                        className="qty-btn"
                        onClick={() =>
                          handleQuantityChange(item, item.quantity + 1)
                        }
                      >
                        <MdAdd />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

            {!isLoading && !errorMessage && items.length > 0 && (
              <div className="shipping-info-banner">
                <MdLocalShipping className="shipping-icon" />
                <p>Tebrikler! Sepetinizde kargo bedava kampanyası aktif.</p>
              </div>
            )}
          </div>

          <aside className="summary-section">
            <div className="summary-card cart-glass-card">
              <h2>Sipariş Özeti</h2>
              <div className="summary-row">
                <span>Ürün Toplamı</span>
                <span>{cartTotal.toLocaleString("tr-TR")} TL</span>
              </div>
              <div className="summary-row free">
                <span>Kargo Toplamı</span>
                <strong>BEDAVA</strong>
              </div>
              {appliedCoupon && (
                <div className="summary-row discount">
                  <span>Kupon ({appliedCoupon.code})</span>
                  <strong>-{discountAmount.toLocaleString("tr-TR")} TL</strong>
                </div>
              )}
              <div className="summary-total">
                <span>Toplam</span>
                <span className="final-price">
                  {finalAmount.toLocaleString("tr-TR")} TL
                </span>
              </div>
              <div className="coupon-area">
                <input
                  type="text"
                  placeholder="İndirim Kodu"
                  value={couponCode}
                  onChange={(event) => setCouponCode(event.target.value)}
                />
                <button
                  type="button"
                  className="coupon-btn"
                  onClick={
                    appliedCoupon ? handleRemoveCoupon : handleApplyCoupon
                  }
                >
                  {appliedCoupon ? "KALDIR" : "UYGULA"}
                </button>
              </div>
              {couponMessage && (
                <p className="coupon-message">{couponMessage}</p>
              )}
              <div className="payment-methods-box">
                <span className="payment-methods-title">Ödeme Yöntemi</span>
                {paymentMethods.map((method) => (
                  <label key={method.id} className="payment-method-option">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.id}
                      checked={paymentMethod === method.id}
                      onChange={(event) => setPaymentMethod(event.target.value)}
                    />
                    {method.name}
                  </label>
                ))}
              </div>

              {isCardPayment && (
                <div className="card-payment-form">
                  <input
                    name="cardHolderName"
                    placeholder="Kart Üzerindeki İsim"
                    value={paymentCard.cardHolderName}
                    onChange={handleCardInputChange}
                  />
                  <input
                    name="cardNumber"
                    placeholder="Kart Numarası"
                    value={paymentCard.cardNumber}
                    onChange={handleCardInputChange}
                  />
                  <div className="card-payment-row">
                    <input
                      name="expireMonth"
                      placeholder="Ay"
                      value={paymentCard.expireMonth}
                      onChange={handleCardInputChange}
                    />
                    <input
                      name="expireYear"
                      placeholder="Yıl"
                      value={paymentCard.expireYear}
                      onChange={handleCardInputChange}
                    />
                    <input
                      name="cvc"
                      placeholder="CVC"
                      value={paymentCard.cvc}
                      onChange={handleCardInputChange}
                    />
                  </div>
                  <input
                    placeholder="T.C. Kimlik No"
                    value={identityNumber}
                    onChange={(event) => setIdentityNumber(event.target.value)}
                  />
                </div>
              )}

              {paymentMessage && (
                <p className="payment-message">{paymentMessage}</p>
              )}

              <button
                className="checkout-btn"
                type="button"
                disabled={isPaymentProcessing || items.length === 0}
                onClick={handleCheckout}
              >
                {isPaymentProcessing ? "İşleniyor..." : "Ödemeye Geç"}{" "}
                <MdChevronRight />
              </button>
              <p className="shipping-notice">
                Ürünlerin kargoya verilme süresi ortalama 24 saattir.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Cart;
