import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAvailableCoupons } from "../api/couponApi";
import "../css/Hero.css";
import bannerImg from "../images/banner.png";

const fallbackCoupons = [
  {
    code: "PATI150",
    discount_amount: 150,
    discount_type: "fixed",
    min_purchase_amount: 1750,
  },
  {
    code: "PATI300",
    discount_amount: 300,
    discount_type: "fixed",
    min_purchase_amount: 3000,
  },
  {
    code: "PATI500",
    discount_amount: 500,
    discount_type: "fixed",
    min_purchase_amount: 4500,
  },
];

const formatDiscountAmount = (coupon) => {
  const amount = Number(coupon.discount_amount || 0);

  if (coupon.discount_type === "percentage") {
    return {
      amount: `%${amount.toLocaleString("tr-TR")}`,
      label: "INDIRIM",
    };
  }

  return {
    amount: amount.toLocaleString("tr-TR"),
    label: "TL INDIRIM",
  };
};

const formatCondition = (coupon) => {
  const minPurchase = Number(coupon.min_purchase_amount || 0);

  if (minPurchase <= 0) return "Alt limitsiz";

  return `${minPurchase.toLocaleString("tr-TR")} TL ve uzerine`;
};

const Hero = () => {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState([]);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const response = await getAvailableCoupons({ per_page: 3 });
        setCoupons(response.data.data.coupons || []);
      } catch {
        setCoupons([]);
      }
    };

    fetchCoupons();
  }, []);

  const activeCoupons = useMemo(
    () => (coupons.length > 0 ? coupons : fallbackCoupons),
    [coupons],
  );
  const heroCoupon = activeCoupons[0];

  return (
    <section className="hero-section-wrapper">
      <div className="hero-main-banner">
        <img
          alt="Happy pets background"
          className="hero-bg-img"
          src={bannerImg}
        />
        <div className="hero-overlay"></div>
        <div className="hero-main-content">
          <span className="hero-badge">
            {coupons.length > 0 ? "Aktif Kupon " : "Buyuk Firsatlar"}
          </span>
          <h1 className="hero-title">
            {heroCoupon.code}
            <br />
            Kuponunu Kaçırma!
          </h1>

          <p className="hero-subtitle">
            Aktif kampanyalardan yararlan, kupon kodunu sepetinde kullan ve
            dostun için alışverişi avantajlı hale getir.
          </p>

          <div className="discount-tiers">
            {activeCoupons.slice(0, 3).map((coupon, index) => {
              const discount = formatDiscountAmount(coupon);

              return (
                <div className="tier-group" key={coupon.id || coupon.code}>
                  {index > 0 && <div className="tier-divider"></div>}
                  <div className="tier">
                    <div className="tier-amount">{discount.amount}</div>
                    <span className="tier-label">{discount.label}</span>
                    <span className="tier-condition">
                      {formatCondition(coupon)}
                    </span>
                    <span className="tier-code">{coupon.code}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            className="hero-cta-btn"
            type="button"
            onClick={() => navigate("/kampanyalar")}
          >
            Kampanyaları Gör
          </button>
        </div>
      </div>

      <div className="hero-side-banners">
        <div className="side-card purple-theme">
          <div className="card-content">
            <span className="hero-promo-badge">Pet Blog</span>
            <h3 className="card-title">Dostun İçin BakIm Rehberi</h3>
            <p className="card-subtitle">Beslenme, bakIm ve oyun Önerileri.</p>
            <button
              className="card-link blog-card-link"
              type="button"
              onClick={() => navigate("/pet-blog")}
            >
              Yazıları incele
            </button>
          </div>
        </div>

        <div className="side-card glass-theme">
          <div className="card-content">
            <h3 className="card-title dark-text">Kuponlari Sepette Kullan</h3>
            <p className="card-subtitle">{formatCondition(heroCoupon)}</p>
            <button
              className="card-link blue-text"
              type="button"
              onClick={() => navigate("/kampanyalar")}
            >
              Tümünü Gör
            </button>
          </div>
          <span className="material-symbols-outlined paw-bg-icon">pets</span>
        </div>
      </div>
    </section>
  );
};

export default Hero;
