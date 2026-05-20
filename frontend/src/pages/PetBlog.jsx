import "../css/PetBlog.css";
import {
  MdFavorite,
  MdPets,
  MdRestaurant,
  MdSelfImprovement,
  MdWaterDrop,
} from "react-icons/md";

const posts = [
  {
    id: 1,
    title: "Kopeklerde Saglikli Beslenme Rutini",
    category: "Beslenme",
    readTime: "5 dk",
    image:
      "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&q=80&w=1200",
    excerpt:
      "Mama secimi, porsiyon kontrolu ve odul mamalarini dengeli kullanmak icin pratik bir rehber.",
  },
  {
    id: 2,
    title: "Kediler Icin Evde Zenginlestirme Fikirleri",
    category: "Davranis",
    readTime: "4 dk",
    image:
      "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&q=80&w=1200",
    excerpt:
      "Tirmalama alanlari, saklanma noktalarindan oyuncak rotasyonuna kadar mutlu bir ev duzeni.",
  },
  {
    id: 3,
    title: "Kus ve Akvaryum Bakiminda Temizlik Takvimi",
    category: "Bakim",
    readTime: "6 dk",
    image:
      "https://images.unsplash.com/photo-1520808663317-647b476a81b9?auto=format&fit=crop&q=80&w=1200",
    excerpt:
      "Kafes, filtre ve su degisimi icin hatirlamasi kolay haftalik kontrol listesi.",
  },
];

const quickTips = [
  {
    icon: <MdRestaurant />,
    title: "Porsiyonlari Olcun",
    text: "Dostunuzun yasina, kilosuna ve aktivite duzeyine gore mama miktarini duzenleyin.",
  },
  {
    icon: <MdWaterDrop />,
    title: "Su Kabini Taze Tutun",
    text: "Temiz su, sindirim ve genel enerji icin gunluk bakimin en sade ama en etkili parcasidir.",
  },
  {
    icon: <MdSelfImprovement />,
    title: "Rutin Olusturun",
    text: "Beslenme, oyun ve dinlenme saatlerinin benzer kalmasi guven hissini artirir.",
  },
];

const PetBlog = () => {
  return (
    <div className="pet-blog-page">
      <section className="pet-blog-hero">
        <img
          src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=1800"
          alt="Pet blog"
        />
        <div className="pet-blog-hero-overlay"></div>
        <div className="pet-blog-hero-content">
          <span>Pet Blog</span>
          <h1>Dostun Icin Bakim Rehberi</h1>
          <p>
            Beslenme, oyun, temizlik ve gunluk yasam ipuclariyla evcil
            dostunuzun rutinini daha mutlu ve dengeli hale getirin.
          </p>
        </div>
      </section>

      <main className="pet-blog-container">
        <section className="featured-blog-post">
          <div className="featured-blog-copy">
            <span className="blog-eyebrow">One Cikan Rehber</span>
            <h2>Yeni Bir Dost Sahiplenmeden Once Hazirlik Listesi</h2>
            <p>
              Mama, yatak, oyuncak, tasma ve veteriner planlamasi. Eve yeni
              gelen dostunuz icin ilk haftayi sakin ve guvenli gecirmenize
              yardim eden temel kontrol listesi.
            </p>
            <div className="blog-meta-row">
              <span>Baslangic rehberi</span>
              <span>7 dk okuma</span>
            </div>
          </div>
          <div className="featured-blog-icon">
            <MdPets />
          </div>
        </section>

        <section className="blog-grid-section">
          <div className="blog-section-title">
            <h2>Son Yazilar</h2>
            <p>Kisa, uygulanabilir ve dost canlisi oneriler.</p>
          </div>

          <div className="blog-card-grid">
            {posts.map((post) => (
              <article className="blog-card" key={post.id}>
                <img src={post.image} alt={post.title} />
                <div className="blog-card-body">
                  <div className="blog-card-meta">
                    <span>{post.category}</span>
                    <span>{post.readTime}</span>
                  </div>
                  <h3>{post.title}</h3>
                  <p>{post.excerpt}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="quick-tips-section">
          <div className="blog-section-title">
            <h2>Hizli Bakim Ipuclari</h2>
            <p>Gunluk rutinde hemen uygulayabileceginiz kucuk notlar.</p>
          </div>

          <div className="quick-tips-grid">
            {quickTips.map((tip) => (
              <article className="quick-tip-card" key={tip.title}>
                <div className="quick-tip-icon">{tip.icon}</div>
                <h3>{tip.title}</h3>
                <p>{tip.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="blog-note">
          <MdFavorite />
          <p>
            Bu blogdaki bilgiler genel bilgilendirme amaclidir. Saglikla ilgili
            ozel durumlarda veteriner hekiminize danisin.
          </p>
        </section>
      </main>
    </div>
  );
};

export default PetBlog;
