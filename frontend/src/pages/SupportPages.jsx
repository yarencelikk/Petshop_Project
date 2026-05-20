import {
  MdAssignmentReturn,
  MdHelp,
  MdLocalShipping,
  MdMail,
  MdPayments,
  MdQuestionAnswer,
  MdSchedule,
  MdVerified,
} from "react-icons/md";
import "../css/SupportPages.css";

const pageContent = {
  help: {
    eyebrow: "Yardım Merkezi",
    title: "Merak ettiğiniz konularda hızlı destek",
    description:
      "Sipariş, ödeme, teslimat ve üyelik işlemleriniz için en sık sorulan soruları burada topladık.",
    icon: <MdHelp />,
    cards: [
      {
        icon: <MdQuestionAnswer />,
        title: "Siparişimi nasıl takip ederim?",
        text: "Profil sayfanızdaki Siparişlerim bölumunden güncel sipariş durumunuzu takip edebilirsiniz.",
      },
      {
        icon: <MdPayments />,
        title: "Hangi ödeme yöntemleri var?",
        text: "Kredi kartı, banka kartı ve kampanya koşullarına göre taksit seçenekleri kullanılabilir.",
      },
      {
        icon: <MdMail />,
        title: "Destek ekibine nasıl ulaşırım?",
        text: "İletişim sayfasındaki formu veya destek@patimarket.com adresini kullanabilirsiniz.",
      },
    ],
    notes: [
      "Ürün stokları ve kampanya koşulları dönemsel olarak değişebilir.",
      "Hesap ve sipariş işlemleri için giriş yapmanız gerekebilir.",
      "Acil taleplerinizde iletisim sayfasındaki telefon hattını kullanabilirsiniz.",
    ],
  },
  delivery: {
    eyebrow: "Teslimat Bilgileri",
    title: "Siparişleriniz güvenle kapınıza gelsin",
    description:
      "Teslimat süreci, kargo hazırlığı ve adres bilgileri hakkında bilmeniz gereken temel noktalar.",
    icon: <MdLocalShipping />,
    cards: [
      {
        icon: <MdSchedule />,
        title: "Hazırlanma süresi",
        text: "Siparişler genellikle ödeme onayından sonra 1-2 iş günü içinde kargoya hazırlanır.",
      },
      {
        icon: <MdLocalShipping />,
        title: "Kargo takibi",
        text: "Kargoya verilen siparişler için takip bilgisi sipariş detaylarında gösterilir.",
      },
      {
        icon: <MdVerified />,
        title: "Adres kontrolü",
        text: "Teslimatın sorunsuz ilerlemesi için adres ve telefon bilgilerinizi güncel tutun.",
      },
    ],
    notes: [
      "Resmi tatil ve yoğun kampanya dönemlerinde teslimat süresi uzayabilir.",
      "Eksik veya hatalı adres bilgisi teslimat gecikmesine neden olabilir.",
      "Kargo paketini teslim alırken hasar kontrolü yapmanızı öneririz.",
    ],
  },
  returns: {
    eyebrow: "İade Koşulları",
    title: "İade sürecini kolay ve şeffaf tutuyoruz",
    description:
      "ÜrÜn iadesi, değişim talebi ve dikkat edilmesi gereken koşulları buradan inceleyebilirsiniz.",
    icon: <MdAssignmentReturn />,
    cards: [
      {
        icon: <MdAssignmentReturn />,
        title: "İade talebi",
        text: "İade etmek istediğiniz ürün için sipariş detaylarınızla birlikte destek ekibine ulaşın.",
      },
      {
        icon: <MdVerified />,
        title: "Ürün durumu",
        text: "Ürünün kullanılmamış, zarar görmemiş ve mümkünse orijinal ambalajında olması beklenir.",
      },
      {
        icon: <MdPayments />,
        title: "Ücret iadesi",
        text: "İade onaylandıktan sonra geri ödeme, ödeme yaptığınız kanala göre işleme alınır.",
      },
    ],
    notes: [
      "Mama, hijyen ve tek kullanımlık ürünlerde iade koşulları ürün durumuna göre değerlendirilir.",
      "Hasarlı teslimatlarda paket ve ürün fotoğrafı süreci hızlandırır.",
      "İade süreciyle ilgili sorularınız için iletişim sayfasından bize ulaşabilirsiniz.",
    ],
  },
};

const SupportPage = ({ type }) => {
  const content = pageContent[type];

  return (
    <div className="support-page">
      <section className="support-hero">
        <div className="support-hero-content">
          <div className="support-hero-icon">{content.icon}</div>
          <span>{content.eyebrow}</span>
          <h1>{content.title}</h1>
          <p>{content.description}</p>
        </div>
      </section>

      <main className="support-container">
        <section className="support-card-grid">
          {content.cards.map((card) => (
            <article className="support-card" key={card.title}>
              <div className="support-card-icon">{card.icon}</div>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </article>
          ))}
        </section>

        <section className="support-note-panel">
          <h2>Bilmeniz Gerekenler</h2>
          <ul>
            {content.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
};

export const HelpCenter = () => <SupportPage type="help" />;
export const DeliveryInfo = () => <SupportPage type="delivery" />;
export const ReturnPolicy = () => <SupportPage type="returns" />;
