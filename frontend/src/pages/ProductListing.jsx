import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getBrands } from "../api/brandApi";
import { getCategories } from "../api/categoryApi";
import { getPetTypes } from "../api/petTypeApi";
import { getProducts, normalizeProduct } from "../api/productApi";
import { getWishlist } from "../api/wishlistApi";
import ProductCard from "../components/ProductCard";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import "../css/ProductListing.css";

const PET_PAGE_LABELS = {
  "/kopek": "Köpek",
  "/kedi": "Kedi",
  "/kus": "Kuş",
  "/akvaryum": "Akvaryum",
};

const normalizeText = (value) => {
  return String(value || "")
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ı", "i")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c");
};

const ProductListing = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const pagePetTypeName = PET_PAGE_LABELS[location.pathname] || "";
  const searchQuery = searchParams.get("search") || "";
  const brandQuery = searchParams.get("brand") || "";
  const categoryQuery = searchParams.get("category") || "";
  const [products, setProducts] = useState([]);
  const [petTypes, setPetTypes] = useState([]);
  const [isPetTypesLoading, setIsPetTypesLoading] = useState(true);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedPetType, setSelectedPetType] = useState(null);
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");
  const [priceFilter, setPriceFilter] = useState({ min: "", max: "" });
  const [sortOption, setSortOption] = useState("name_asc");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBrandsLoading, setIsBrandsLoading] = useState(true);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [brandError, setBrandError] = useState("");
  const [categoryError, setCategoryError] = useState("");

  useEffect(() => {
    const fetchPetTypes = async () => {
      try {
        const response = await getPetTypes({ per_page: 50 });
        setPetTypes(response.data.data.petType);
      } catch {
        setPetTypes([]);
      } finally {
        setIsPetTypesLoading(false);
      }
    };

    fetchPetTypes();
  }, []);

  useEffect(() => {
    if (!isSortOpen) return;

    const handleDocumentClick = (event) => {
      if (!event.target.closest(".sort-control")) {
        setIsSortOpen(false);
      }
    };

    document.addEventListener("click", handleDocumentClick);

    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, [isSortOpen]);

  const routePetTypeId = useMemo(() => {
    if (!pagePetTypeName) return "";
    if (isPetTypesLoading) return null;
    if (petTypes.length === 0) return "__missing__";

    const routePetType = petTypes.find((petType) => {
      return normalizeText(petType.name) === normalizeText(pagePetTypeName);
    });

    return routePetType ? String(routePetType.id) : "__missing__";
  }, [isPetTypesLoading, pagePetTypeName, petTypes]);

  const activePetType = selectedPetType ?? routePetTypeId;

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await getBrands({ per_page: 50 });
        setBrands(response.data.data.brands);
      } catch (error) {
        setBrandError(error.response?.data?.message || "Markalar yüklenemedi.");
      } finally {
        setIsBrandsLoading(false);
      }
    };

    fetchBrands();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getCategories({ per_page: 50 });
        setCategories(response.data.data.categories);
      } catch (error) {
        setCategoryError(
          error.response?.data?.message || "Kategoriler yüklenemedi.",
        );
      } finally {
        setIsCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const selectedBrand = brandQuery;
  const selectedCategory = categoryQuery;

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setErrorMessage("");

      if (pagePetTypeName && activePetType === null) {
        return;
      }

      if (activePetType === "__missing__") {
        setProducts([]);
        setPagination(null);
        setErrorMessage(`${pagePetTypeName} için ürün bulunamadı.`);
        setIsLoading(false);
        return;
      }

      try {
        const response = await getProducts({
          page: currentPage,
          ...(activePetType && activePetType !== "__missing__"
            ? { pet_type: activePetType }
            : {}),
          ...(selectedBrand ? { brand: selectedBrand } : {}),
          ...(selectedCategory ? { category: selectedCategory } : {}),
          ...(priceFilter.min ? { min_price: priceFilter.min } : {}),
          ...(priceFilter.max ? { max_price: priceFilter.max } : {}),
          ...(searchQuery ? { search: searchQuery } : {}),
          sort: sortOption,
        });
        const normalizedProducts =
          response.data.data.products.map(normalizeProduct);

        if (!localStorage.getItem("token")) {
          setProducts(normalizedProducts);
          setPagination(response.data.data.pagination);
          return;
        }

        try {
          const wishlistResponse = await getWishlist({ per_page: 1000 });
          const favoriteVariantIds = new Set(
            wishlistResponse.data.data.wishlist
              .map((item) => item.variants?.id)
              .filter(Boolean)
              .map(String),
          );

          setProducts(
            normalizedProducts.map((product) => ({
              ...product,
              isFavorite: favoriteVariantIds.has(
                String(product.selectedVariantId),
              ),
            })),
          );
        } catch {
          setProducts(normalizedProducts);
        }

        setPagination(response.data.data.pagination);
      } catch (error) {
        setProducts([]);
        setPagination(null);
        setErrorMessage(
          error.response?.data?.message || "Ürünler yüklenemedi.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [
    activePetType,
    currentPage,
    selectedBrand,
    selectedCategory,
    priceFilter,
    searchQuery,
    sortOption,
    pagePetTypeName,
  ]);

  const selectedPetTypeName =
    petTypes.find((petType) => String(petType.id) === String(activePetType))
      ?.name ||
    pagePetTypeName ||
    "Tüm Ürünler";

  const totalItems =
    pagination?.total_items ?? pagination?.totalItems ?? products.length;
  const totalPages = Math.max(
    Number(pagination?.total_pages ?? pagination?.totalPages ?? 1),
    1,
  );
  const activePage = Number(
    pagination?.current_page ?? pagination?.currentPage ?? currentPage,
  );
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

  const handlePageChange = (page) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages);

    if (nextPage === currentPage) return;

    setCurrentPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateRouteFilter = (key, value) => {
    const nextParams = new URLSearchParams(location.search);

    if (value) {
      nextParams.set(key, value);
    } else {
      nextParams.delete(key);
    }

    const nextSearch = nextParams.toString();

    navigate({
      pathname: location.pathname,
      search: nextSearch ? `?${nextSearch}` : "",
    });
    setCurrentPage(1);
  };

  const handleBrandSelect = (value) => {
    updateRouteFilter("brand", value);
  };

  const handleCategorySelect = (value) => {
    updateRouteFilter("category", value);
  };

  const handleResetFilters = () => {
    setSelectedPetType(null);
    setMinPriceInput("");
    setMaxPriceInput("");
    setPriceFilter({ min: "", max: "" });
    setSortOption("name_asc");
    setCurrentPage(1);
    setErrorMessage("");
    navigate({ pathname: location.pathname, search: "" });
  };

  const handleApplyPriceFilter = () => {
    const min = minPriceInput.trim();
    const max = maxPriceInput.trim();

    if (min && max && Number(min) > Number(max)) {
      setErrorMessage("Minimum fiyat maksimum fiyattan büyük olamaz.");
      return;
    }

    setPriceFilter({
      min,
      max,
    });
    setCurrentPage(1);
  };

  const sortOptions = [
    { value: "name_asc", label: "Ada göre A-Z" },
    { value: "name_desc", label: "Ada göre Z-A" },
    { value: "price_asc", label: "Fiyat artan" },
    { value: "price_desc", label: "Fiyat azalan" },
  ];

  const selectedSortLabel =
    sortOptions.find((option) => option.value === sortOption)?.label ||
    "Sırala";

  const handleSortSelect = (value) => {
    setSortOption(value);
    setIsSortOpen(false);
    setCurrentPage(1);
  };

  return (
    <div className="dog-world-container">
      <div className="page-header">
        <div>
          <h1>{selectedPetTypeName}</h1>
          <p>{totalItems} ürün listeleniyor</p>
        </div>
        <div className={`sort-control ${isSortOpen ? "open" : ""}`}>
          <span>Sırala</span>
          <button
            type="button"
            className="sort-control-trigger"
            onClick={() => setIsSortOpen((current) => !current)}
          >
            {selectedSortLabel}
            <span className="material-symbols-outlined sort-chevron">
              expand_more
            </span>
          </button>

          {isSortOpen && (
            <div className="sort-menu">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`sort-menu-item ${
                    sortOption === option.value ? "active" : ""
                  }`}
                  onClick={() => handleSortSelect(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="main-content-layout">
        <aside className="sidebar-filters">
          <button
            type="button"
            className="reset-filters-button"
            onClick={handleResetFilters}
          >
            Filtreleri Sıfırla
          </button>


          <div className="filter-card">
            <h3>Kategoriler</h3>
            <div className="category-list">
              <button
                type="button"
                className={`category-item category-filter-btn ${
                  selectedCategory === "" ? "active" : ""
                }`}
                onClick={() => handleCategorySelect("")}
              >
                <span>Tümü</span>
                <span className="count-badge">-</span>
              </button>

              {isCategoriesLoading && (
                <p className="filter-state">Kategoriler yükleniyor...</p>
              )}

              {!isCategoriesLoading && categoryError && (
                <p className="filter-state error">{categoryError}</p>
              )}

              {!isCategoriesLoading &&
                !categoryError &&
                categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    className={`category-item category-filter-btn ${
                      String(selectedCategory) === String(category.id)
                        ? "active"
                        : ""
                    }`}
                    onClick={() => handleCategorySelect(String(category.id))}
                  >
                    <span>{category.name}</span>
                    <span className="count-badge">
                      {category.products?.length || 0}
                    </span>
                  </button>
                ))}
            </div>
          </div>


          <div className="filter-card">
            <h3 className="filter-title">Marka</h3>
            <div className="filter-content scrollable-content">
              <label className="filter-option">
                <input
                  type="radio"
                  name="brand"
                  className="custom-radio"
                  checked={selectedBrand === ""}
                  onChange={() => handleBrandSelect("")}
                />
                <span className="option-text">Tümü</span>
              </label>

              {isBrandsLoading && (
                <p className="filter-state">Markalar yükleniyor...</p>
              )}

              {!isBrandsLoading && brandError && (
                <p className="filter-state error">{brandError}</p>
              )}

              {!isBrandsLoading &&
                !brandError &&
                brands.map((brand) => (
                  <label key={brand.id} className="filter-option">
                    <input
                      type="radio"
                      name="brand"
                      className="custom-radio"
                      checked={String(selectedBrand) === String(brand.id)}
                      onChange={() => handleBrandSelect(String(brand.id))}
                    />
                    <span className="option-text">{brand.name}</span>
                  </label>
                ))}
            </div>
          </div>

          <div className="filter-card">
            <h3>Fiyat Aralığı</h3>
            <div className="price-inputs">
              <input
                type="number"
                min="0"
                placeholder="Min"
                value={minPriceInput}
                onChange={(event) => setMinPriceInput(event.target.value)}
              />
              <input
                type="number"
                min="0"
                placeholder="Max"
                value={maxPriceInput}
                onChange={(event) => setMaxPriceInput(event.target.value)}
              />
            </div>
            <button className="apply-button" onClick={handleApplyPriceFilter}>
              Uygula
            </button>
          </div>
        </aside>

        <div className="products-grid">
          {isLoading && <p className="product-list-state">Ürünler yükleniyor...</p>}

          {!isLoading && errorMessage && (
            <p className="product-list-state error">{errorMessage}</p>
          )}

          {!isLoading &&
            !errorMessage &&
            products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
        </div>
      </div>

      <div className="pagination-wrapper">
        <button
          type="button"
          className="page-btn"
          disabled={activePage <= 1}
          onClick={() => handlePageChange(activePage - 1)}
        >
          <MdChevronLeft size={24} />
        </button>
        {pageNumbers.map((page) => (
          <button
            key={page}
            type="button"
            className={`page-btn ${activePage === page ? "active" : ""}`}
            onClick={() => handlePageChange(page)}
          >
            {page}
          </button>
        ))}
        <button
          type="button"
          className="page-btn"
          disabled={activePage >= totalPages}
          onClick={() => handlePageChange(activePage + 1)}
        >
          <MdChevronRight size={24} />
        </button>
      </div>
    </div>
  );
};

export default ProductListing;
