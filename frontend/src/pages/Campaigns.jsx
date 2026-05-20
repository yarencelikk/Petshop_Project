import { useEffect, useMemo, useRef, useState } from "react";
import { getAvailableCoupons } from "../api/couponApi";
import "../css/Campaigns.css";
import {
  MdChevronLeft,
  MdChevronRight,
  MdContentCopy,
  MdExpandMore,
  MdLocalOffer,
  MdPercent,
  MdSavings,
} from "react-icons/md";

const campaignImages = [
  "https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?auto=format&fit=crop&q=80&w=1600",
  "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=1200",
  "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=1200",
  "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=1200",
];

const formatDiscount = (coupon) => {
  const amount = Number(coupon.discount_amount || 0);

  if (coupon.discount_type === "percentage") {
    return `%${amount.toLocaleString("tr-TR")}`;
  }

  return `${amount.toLocaleString("tr-TR")} TL`;
};

const formatMinPurchase = (coupon) => {
  const amount = Number(coupon.min_purchase_amount || 0);

  if (amount <= 0) return "Alt limit yok";

  return `${amount.toLocaleString("tr-TR")} TL ve üzeri`;
};

const formatExpiryDate = (date) => {
  if (!date) return "Süre bilgisi yok";

  return new Date(date).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const getCouponTitle = (coupon) => {
  const discount = formatDiscount(coupon);

  return coupon.discount_type === "percentage"
    ? `${discount} indirim fırsatı`
    : `${discount} indirim kuponu`;
};

const Campaigns = () => {
  const scrollRef = useRef(null);
  const [coupons, setCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [copiedCode, setCopiedCode] = useState("");

  const featuredCoupon = coupons[0];
  const sideCoupons = coupons.slice(1, 3);
  const scrollCoupons = coupons.slice(0, 8);

  const heroCoupon = useMemo(() => featuredCoupon || coupons[0], [coupons, featuredCoupon]);

  useEffect(() => {
    const fetchCoupons = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await getAvailableCoupons({ per_page: 12 });
        setCoupons(response.data.data.coupons || []);
      } catch (error) {
        setCoupons([]);
        setErrorMessage(
          error.response?.data?.message || "Aktif kampanyalar yüklenemedi.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchCoupons();
  }, []);

  const scroll = (direction) => {
    const { current } = scrollRef;
    if (!current) return;

    const scrollAmount = 340;
    current.scrollLeft += direction === "left" ? -scrollAmount : scrollAmount;
  };

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
    } catch {
      setCopiedCode("");
    }
  };

  return (
    <div className="campaigns-page">
      <main className="campaigns-container">
        <section className="campaigns-intro">
          <h1>Kampanyalar ve Fırsatlar</h1>
          <p>
            Aktif kuponları keşfedin, kodunuzu kopyalayın ve sepetinizde
            avantajlı alışverişin keyfini çıkarın.
          </p>
        </section>

        {isLoading && (
          <p className="campaign-state">Kampanyalar yükleniyor...</p>
        )}

        {!isLoading && errorMessage && (
          <p className="campaign-state error">{errorMessage}</p>
        )}

        {!isLoading && !errorMessage && coupons.length > 0 && (
          <>
            <section className="hero-campaign campaign-glass-card">
              <div className="campaign-hero-overlay"></div>
              <img
                src={campaignImages[0]}
                alt={getCouponTitle(heroCoupon)}
                className="hero-img"
              />
              <div className="campaign-hero-content">
                <span className="badge-light">AKTİF KUPON</span>
                <h2>{getCouponTitle(heroCoupon)}</h2>
                <p>
                  {heroCoupon.code} koduyla {formatMinPurchase(heroCoupon)}{" "}
                  alışverişlerde geçerli. Son kullanım:{" "}
                  {formatExpiryDate(heroCoupon.expiry_date)}.
                </p>
                <button
                  className="cta-btn-white"
                  type="button"
                  onClick={() => copyCode(heroCoupon.code)}
                >
                  {copiedCode === heroCoupon.code ? "Kopyalandı" : "Kodu Kopyala"}
                </button>
              </div>
            </section>

            <section className="active-campaigns">
              <div className="campaign-section-header">
                <h2>Aktif Kampanyalar</h2>
                <span className="campaign-count">{coupons.length} kupon</span>
              </div>

              <div className="campaign-layout">
                <div className="featured-campaign campaign-glass-card">
                  <div className="featured-img-wrapper">
                    <img
                      src={campaignImages[1]}
                      alt={getCouponTitle(featuredCoupon)}
                    />
                    <span className="coupon-discount-badge">
                      {formatDiscount(featuredCoupon)}
                    </span>
                  </div>
                  <div className="featured-body">
                    <h3>{getCouponTitle(featuredCoupon)}</h3>
                    <p>
                      {formatMinPurchase(featuredCoupon)} alışverişlerde
                      kullanılabilir. Son gün:{" "}
                      {formatExpiryDate(featuredCoupon.expiry_date)}.
                    </p>
                    <div className="promo-code-box">
                      <span className="code-text">KOD: {featuredCoupon.code}</span>
                      <button
                        className="copy-btn"
                        type="button"
                        onClick={() => copyCode(featuredCoupon.code)}
                      >
                        <MdContentCopy />
                        {copiedCode === featuredCoupon.code
                          ? "Kopyalandı"
                          : "Kopyala"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="side-campaigns">
                  {sideCoupons.length === 0 && (
                    <div className="small-campaign-card campaign-glass-card coupon-mini-empty">
                      <MdLocalOffer />
                      <div className="small-card-body">
                        <h4>Yeni kuponlar yakında</h4>
                        <p>Aktif fırsatlar güncellendikçe burada görünür.</p>
                      </div>
                    </div>
                  )}

                  {sideCoupons.map((coupon, index) => (
                    <div
                      className="small-campaign-card campaign-glass-card"
                      key={coupon.id}
                    >
                      <img
                        src={campaignImages[index + 2] || campaignImages[0]}
                        alt={coupon.code}
                      />
                      <div className="small-card-body">
                        <h4>{getCouponTitle(coupon)}</h4>
                        <p>{coupon.code}</p>
                        <button
                          className="link-btn"
                          type="button"
                          onClick={() => copyCode(coupon.code)}
                        >
                          {copiedCode === coupon.code ? "Kopyalandı" : "Kodu Al"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="category-offers campaign-glass-card-high">
              <div className="section-header-inline">
                <h2>Kupon Listesi</h2>
                <div className="scroll-controls">
                  <button
                    className="nav-arrow-btn"
                    type="button"
                    onClick={() => scroll("left")}
                  >
                    <MdChevronLeft />
                  </button>
                  <button
                    className="nav-arrow-btn"
                    type="button"
                    onClick={() => scroll("right")}
                  >
                    <MdChevronRight />
                  </button>
                </div>
              </div>
              <div className="horizontal-scroll hide-scrollbar" ref={scrollRef}>
                {scrollCoupons.map((coupon) => (
                  <div className="campaign-category-card" key={coupon.id}>
                    <div className="cat-icon-circle blue">
                      {coupon.discount_type === "percentage" ? (
                        <MdPercent />
                      ) : (
                        <MdSavings />
                      )}
                    </div>
                    <h3>{coupon.code}</h3>
                    <p>{getCouponTitle(coupon)}</p>
                    <span>{formatMinPurchase(coupon)}</span>
                    <button
                      className="coupon-card-copy"
                      type="button"
                      onClick={() => copyCode(coupon.code)}
                    >
                      {copiedCode === coupon.code ? "Kopyalandı" : "Kopyala"}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {!isLoading && !errorMessage && coupons.length === 0 && (
          <p className="campaign-state">Şu anda aktif kampanya bulunmuyor.</p>
        )}

        <section className="faq-section">
          <h2>Sıkça Sorulan Sorular</h2>
          <div className="faq-grid">
            <div className="faq-item campaign-glass-card">
              <details>
                <summary>
                  Kupon kodu nasıl kullanılır? <MdExpandMore />
                </summary>
                <p>
                  Sepet sayfasındaki indirim kodu alanına kupon kodunuzu girip
                  uygula butonuna basabilirsiniz.
                </p>
              </details>
            </div>
            <div className="faq-item campaign-glass-card">
              <details>
                <summary>
                  Kampanyalar birleştirilir mi? <MdExpandMore />
                </summary>
                <p>
                  Aksi belirtilmedikçe her siparişte yalnızca bir kupon kodu
                  kullanılabilir.
                </p>
              </details>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Campaigns;
