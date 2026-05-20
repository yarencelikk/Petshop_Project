import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCategories } from "../api/categoryApi";
import "../css/Footer.css";

const Footer = () => {
  const [categories, setCategories] = useState([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getCategories({ per_page: 6 });
        setCategories(response.data.data.categories || []);
      } catch {
        setCategories([]);
      } finally {
        setIsCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <footer className="footer-container">
      <div className="footer-top-grid">
        <div className="footer-column space-y-4">
          <h3 className="footer-logo">Pati Market</h3>
          <p className="footer-description">
            Dostlarınızın sağlığı ve mutluluğu için en iyisini sunuyoruz.
            2020'den beri kaliteli ürünler ve uzman tavsiyeleriyle evcil hayvan
            sahiplerinin yanındayız.
          </p>
        </div>

        <div className="footer-column">
          <h4 className="column-title">Kategoriler</h4>
          <ul className="footer-list">
            {isCategoriesLoading && (
              <li className="footer-list-state">Kategoriler yukleniyor...</li>
            )}

            {!isCategoriesLoading &&
              categories.map((category) => (
                <li key={category.id}>
                  <Link to={`/urunler?category=${category.id}`}>
                    {category.name}
                  </Link>
                </li>
              ))}

            {!isCategoriesLoading && categories.length === 0 && (
              <li className="footer-list-state">Kategori bulunamadi.</li>
            )}
          </ul>
        </div>

        <div className="footer-column">
          <h4 className="column-title">Destek</h4>
          <ul className="footer-list">
            <li>
              <Link to="/yardim-merkezi">Yardım Merkezi</Link>
            </li>
            <li>
              <Link to="/teslimat-bilgileri">Teslimat Bilgileri</Link>
            </li>
            <li>
              <Link to="/iade-kosullari">İade Koşulları</Link>
            </li>
            <li>
              <Link to="/iletisim">İletişim</Link>
            </li>
          </ul>
        </div>

        <div className="footer-column">
          <h4 className="column-title">Pati Haberleri</h4>
          <p className="newsletter-text">
            Yeni gelen ürünler ve özel kampanyalardan ilk siz haberdar olun.
          </p>
          <div className="newsletter-form">
            <Link className="newsletter-btn" to="/register">
              Abone Ol
            </Link>
          </div>
        </div>
      </div>

      <div className="footer-bottom-bar">
        <div className="bottom-bar-content">
          <p className="copyright">
            &copy; 2026 Pati Market. Tum Haklari Saklidir.
          </p>
          <div className="payment-methods">
            <div className="payment-item">
              <span className="material-symbols-outlined">credit_card</span>
              <span>VISA</span>
            </div>
            <div className="payment-item">
              <span className="material-symbols-outlined">payments</span>
              <span>MASTERCARD</span>
            </div>
            <div className="payment-item">
              <span className="material-symbols-outlined">
                account_balance_wallet
              </span>
              <span>TAKSIT IMKANI</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
