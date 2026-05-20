import "../css/TrustBar.css";

const TrustBar = () => {
  return (
    <section className="trust-bar">
      <div className="trust-item">
        <span className="material-symbols-outlined">local_shipping</span>
        <div>
          <h4>Aynı Gün Kargo</h4>
          <p>Saat 14:00'e kadar</p>
        </div>
      </div>
      <div className="trust-divider"></div>
      <div className="trust-item">
        <span className="material-symbols-outlined">verified_user</span>
        <div>
          <h4>Güvenli Ödeme</h4>
          <p>256-bit SSL koruma</p>
        </div>
      </div>
      <div className="trust-divider"></div>
      <div className="trust-item">
        <span className="material-symbols-outlined">support_agent</span>
        <div>
          <h4>7/24 Destek</h4>
          <p>Bize her an ulaşın</p>
        </div>
      </div>
    </section>
  );
};

export default TrustBar;
