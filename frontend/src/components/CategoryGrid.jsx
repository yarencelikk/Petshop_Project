import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  GiAquarium,
  GiBowlOfRice,
  GiCat,
  GiDogBowl,
  GiHealthNormal,
  GiSittingDog,
  GiTennisBall,
} from "react-icons/gi";
import { PiBird } from "react-icons/pi";
import { TbSandbox } from "react-icons/tb";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import { MdPets, MdShower } from "react-icons/md";
import { getCategories } from "../api/categoryApi";
import "../css/CategoryGrid.css";

const CATEGORY_STYLES = [
  {
    icon: <GiDogBowl size={44} />,
    color: "rgba(255, 123, 84, 0.16)",
    iconColor: "#F97316",
  },
  {
    icon: <GiTennisBall size={42} />,
    color: "rgba(56, 189, 248, 0.16)",
    iconColor: "#0284C7",
  },
  {
    icon: <MdShower size={42} />,
    color: "rgba(20, 184, 166, 0.16)",
    iconColor: "#0F766E",
  },
  {
    icon: <GiHealthNormal size={34} />,
    color: "rgba(239, 68, 68, 0.14)",
    iconColor: "#DC2626",
  },
];

const normalizeText = (value) => {
  return String(value || "")
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c");
};

const getCategoryStyle = (categoryName, index) => {
  const name = normalizeText(categoryName);

  if (name.includes("mama") || name.includes("beslen")) {
    return CATEGORY_STYLES[0];
  }

  if (name.includes("oyuncak") || name.includes("eglen")) {
    return CATEGORY_STYLES[1];
  }

  if (
    name.includes("kum") ||
    name.includes("litter") ||
    name.includes("tuvalet")
  ) {
    return {
      icon: <TbSandbox size={44} />,
      color: "rgba(245, 158, 11, 0.18)",
      iconColor: "#B45309",
    };
  }

  if (
    name.includes("bakim") ||
    name.includes("temiz") ||
    name.includes("hijyen")
  ) {
    return CATEGORY_STYLES[2];
  }

  if (name.includes("kopek")) {
    return {
      icon: <GiSittingDog size={42} />,
      color: "rgba(34, 197, 94, 0.15)",
      iconColor: "#16A34A",
    };
  }

  if (name.includes("kedi")) {
    return {
      icon: <GiCat size={42} />,
      color: "rgba(168, 85, 247, 0.15)",
      iconColor: "#7E22CE",
    };
  }

  if (name.includes("kus")) {
    return {
      icon: <PiBird size={42} />,
      color: "rgba(236, 72, 153, 0.14)",
      iconColor: "#DB2777",
    };
  }

  if (name.includes("akvaryum") || name.includes("balik")) {
    return {
      icon: <GiAquarium size={44} />,
      color: "rgba(6, 182, 212, 0.16)",
      iconColor: "#0891B2",
    };
  }

  if (name.includes("saglik")) {
    return CATEGORY_STYLES[3];
  }

  return {
    icon: index % 2 === 0 ? <MdPets size={42} /> : <GiBowlOfRice size={42} />,
    color: index % 2 === 0 ? "rgba(99, 102, 241, 0.14)" : "rgba(249, 115, 22, 0.14)",
    iconColor: index % 2 === 0 ? "#4F46E5" : "#EA580C",
  };
};

const getProductCountText = (products = []) => {
  const count = products.length;
  return `${count} Urun`;
};

const CategoryGrid = () => {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getCategories();
        setCategories(response.data.data.categories);
      } catch (error) {
        setErrorMessage(
          error.response?.data?.message || "Kategoriler yuklenemedi.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const scrollCategories = (direction) => {
    const { current } = scrollRef;
    if (!current) return;

    current.scrollLeft += direction === "left" ? -280 : 280;
  };

  const goToCategory = (categoryId) => {
    navigate(`/urunler?category=${categoryId}`);
  };

  return (
    <section className="category-section">
      <div className="category-section-header">
        <h2>Kategoriler</h2>
        <div className="category-scroll-controls">
          <button
            className="category-arrow-btn"
            type="button"
            onClick={() => scrollCategories("left")}
            aria-label="Onceki kategoriler"
          >
            <MdChevronLeft />
          </button>
          <button
            className="category-arrow-btn"
            type="button"
            onClick={() => scrollCategories("right")}
            aria-label="Sonraki kategoriler"
          >
            <MdChevronRight />
          </button>
        </div>
      </div>

      {isLoading && <p className="category-state">Kategoriler yukleniyor...</p>}

      {!isLoading && errorMessage && (
        <p className="category-state error">{errorMessage}</p>
      )}

      {!isLoading && !errorMessage && (
        <div className="grid-container" ref={scrollRef}>
          {categories.map((category, index) => {
            const style = getCategoryStyle(category.name, index);

            return (
              <button
                key={category.id}
                className="category-grid-card"
                type="button"
                onClick={() => goToCategory(category.id)}
              >
                <div
                  className="icon-circle"
                  style={{
                    backgroundColor: style.color,
                    color: style.iconColor,
                  }}
                >
                  {style.icon}
                </div>
                <h3>{category.name}</h3>
                <p>{getProductCountText(category.products)}</p>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default CategoryGrid;
