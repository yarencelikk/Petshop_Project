import { useState } from "react";
import {
  MdAccessTime,
  MdEmail,
  MdLocationOn,
  MdPhone,
  MdSupportAgent,
} from "react-icons/md";
import { sendContactEmail } from "../api/emailApi";
import "../css/Contact.css";

const contactCards = [
  {
    icon: <MdPhone />,
    title: "Telefon",
    text: "0850 000 00 00",
    detail: "Hafta ici 09:00 - 18:00",
  },
  {
    icon: <MdEmail />,
    title: "E-posta",
    text: "destek@patimarket.com",
    detail: "24 saat icinde donus yapilir",
  },
  {
    icon: <MdLocationOn />,
    title: "Adres",
    text: "Pati Market Merkez Ofis",
    detail: "Istanbul, Turkiye",
  },
];

const emptyContactForm = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

const Contact = () => {
  const [formData, setFormData] = useState(emptyContactForm);
  const [formStatus, setFormStatus] = useState({ type: "", message: "" });
  const [isSending, setIsSending] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSending(true);
    setFormStatus({ type: "", message: "" });

    try {
      const response = await sendContactEmail(formData);

      setFormData(emptyContactForm);
      setFormStatus({
        type: "success",
        message:
          response.data?.message ||
          "Mesajiniz alindi. En kisa surede sizinle iletisime gececegiz.",
      });
    } catch (error) {
      setFormStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          "Mesaj gonderilemedi. Lutfen daha sonra tekrar deneyin.",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="contact-page">
      <section className="contact-hero">
        <div className="contact-hero-content">
          <span>Iletisim</span>
          <h1>Size yardim etmek icin buradayiz</h1>
          <p>
            Siparis, urun, teslimat veya dostunuzun ihtiyaclari hakkinda bize
            ulasin. Ekibimiz en kisa surede sizinle iletisime gececek.
          </p>
        </div>
      </section>

      <main className="contact-container">
        <section className="contact-card-grid">
          {contactCards.map((card) => (
            <article className="contact-info-card" key={card.title}>
              <div className="contact-info-icon">{card.icon}</div>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
              <span>{card.detail}</span>
            </article>
          ))}
        </section>

        <section className="contact-main-grid">
          <div className="contact-form-panel">
            <div className="contact-section-title">
              <span>Mesaj Gonder</span>
              <h2>Bizimle iletisime gecin</h2>
            </div>

            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="contact-form-row">
                <label>
                  Ad Soyad
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Adiniz ve soyadiniz"
                    required
                  />
                </label>
                <label>
                  E-posta
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="ornek@mail.com"
                    required
                  />
                </label>
              </div>

              <label>
                Konu
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Size nasil yardim edebiliriz?"
                  required
                />
              </label>

              <label>
                Mesaj
                <textarea
                  rows="6"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Mesajinizi yazin"
                  required
                />
              </label>

              {formStatus.message && (
                <div className={`contact-form-status ${formStatus.type}`}>
                  {formStatus.message}
                </div>
              )}

              <button type="submit" disabled={isSending}>
                {isSending ? "Gonderiliyor..." : "Gonder"}
              </button>
            </form>
          </div>

          <aside className="contact-support-panel">
            <div className="support-icon">
              <MdSupportAgent />
            </div>
            <h2>Destek Saatleri</h2>
            <p>
              Musteri destek ekibimiz hafta ici siparis, teslimat ve urun
              sorulariniz icin hizmet verir.
            </p>

            <div className="support-hours">
              <MdAccessTime />
              <div>
                <strong>Pazartesi - Cuma</strong>
                <span>09:00 - 18:00</span>
              </div>
            </div>

            <div className="support-note">
              Acil olmayan talepleriniz icin e-posta kanalini kullanabilirsiniz.
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
};

export default Contact;
