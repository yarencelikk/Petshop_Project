import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import {
  createBrand,
  deleteBrand,
  getBrands,
  updateBrand,
} from "../api/brandApi";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "../api/categoryApi";
import { getOrders, updateOrderStatus } from "../api/orderApi";
import {
  createPetType,
  deletePetType,
  getPetTypes,
  updatePetType,
} from "../api/petTypeApi";
import {
  createProduct,
  deleteProduct,
  getImageUrl,
  getProducts,
  updateProduct,
} from "../api/productApi";
import {
  createAdmin,
  deleteUser,
  getAllUsers,
  getMyProfile,
} from "../api/authApi";
import { sendAdminEmail } from "../api/emailApi";
import SupportAgentPanel from "./SupportAgentPanel";

const currencyFormatter = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
});

const statusMeta = {
  pending: { label: "Beklemede", className: "pending" },
  paid: { label: "Odendi", className: "paid" },
  preparing: { label: "Hazirlaniyor", className: "preparing" },
  shipped: { label: "Kargoda", className: "shipped" },
  delivered: { label: "Teslim Edildi", className: "delivered" },
  cancelled: { label: "Iptal", className: "cancelled" },
};

const editableStatuses = ["preparing", "shipped", "delivered", "cancelled"];
const terminalStatuses = ["delivered", "cancelled"];

const getCollection = (response, key) => {
  const data = response?.data?.data;
  if (Array.isArray(data)) return data;
  return data?.[key] || [];
};

const getPaginationTotal = (response) => {
  return response?.data?.data?.pagination?.total_items || 0;
};

const getInitials = (name = "") => {
  const cleanName = name.trim();
  if (!cleanName) return "PM";

  return cleanName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};

const formatCurrency = (value) => {
  const number = Number(value || 0);
  return currencyFormatter.format(Number.isNaN(number) ? 0 : number);
};

const getOrderProductName = (order) => {
  const firstItem = order.orderItems?.[0];
  const productName = firstItem?.variants?.product?.name || "Urun";
  const extraCount = Math.max((order.orderItems?.length || 0) - 1, 0);

  return extraCount > 0 ? `${productName} +${extraCount}` : productName;
};

const getUserFullName = (user) => {
  return [user?.name, user?.surname].filter(Boolean).join(" ").trim();
};

const normalizeSearchValue = (value) => {
  return String(value || "")
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

const matchesSearchTerm = (values, term) => {
  if (!term) return true;

  return values.some((value) => normalizeSearchValue(value).includes(term));
};

const getApiErrorMessage = (err, fallback) => {
  const responseData = err?.response?.data;
  const validationMessages = responseData?.errors
    ?.map((item) => item.message)
    .filter(Boolean);

  if (validationMessages?.length > 0) {
    return validationMessages.join(" ");
  }

  return responseData?.message || err?.message || fallback;
};

const isPreferenceEnabled = (value) => {
  return value === true || value === "true" || value === 1 || value === "1";
};

const csvEscape = (value) => {
  const text = String(value ?? "");
  if (!/[",\r\n]/.test(text)) return text;

  return `"${text.replaceAll('"', '""')}"`;
};

const csvRow = (values) => values.map(csvEscape).join(",");

const emptyDashboardData = {
  orders: [],
  products: [],
  categories: [],
  brands: [],
  petTypes: [],
  users: [],
  totals: {
    orders: 0,
    products: 0,
    categories: 0,
    brands: 0,
    petTypes: 0,
    users: 0,
  },
};

const emptyQuickForms = {
  category: "",
  brand: "",
  petType: "",
};

const emptyProductForm = {
  id: null,
  name: "",
  description: "",
  category_id: "",
  brand_id: "",
  pet_type_id: "",
  variant_name: "",
  price: "",
  stock: "",
  sku: "",
  imageFile: null,
};

const emptyEmailForm = {
  recipientMode: "all",
  recipients: [],
  subject: "",
  message: "",
};

const emptyAdminForm = {
  name: "",
  surname: "",
  email: "",
  phone_number: "",
  password: "",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(emptyDashboardData);
  const [profile, setProfile] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [adminFormError, setAdminFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [quickForms, setQuickForms] = useState(emptyQuickForms);
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [emailForm, setEmailForm] = useState(emptyEmailForm);
  const [adminForm, setAdminForm] = useState(emptyAdminForm);
  const [savingForm, setSavingForm] = useState("");
  const [deletingItem, setDeletingItem] = useState("");
  const [editingResource, setEditingResource] = useState(null);
  const [editingResourceName, setEditingResourceName] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError("");

    try {
      const [
        ordersResult,
        productsResult,
        categoriesResult,
        brandsResult,
        petTypesResult,
        usersResult,
        profileResult,
      ] = await Promise.allSettled([
        getOrders({ page: 1, per_page: 10 }),
        getProducts({ page: 1, per_page: 8 }),
        getCategories({ page: 1, per_page: 100 }),
        getBrands({ page: 1, per_page: 100 }),
        getPetTypes({ page: 1, per_page: 100 }),
        getAllUsers({ page: 1, per_page: 100 }),
        getMyProfile(),
      ]);

      const getValue = (result) =>
        result.status === "fulfilled" ? result.value : null;

      const ordersResponse = getValue(ordersResult);
      const productsResponse = getValue(productsResult);
      const categoriesResponse = getValue(categoriesResult);
      const brandsResponse = getValue(brandsResult);
      const petTypesResponse = getValue(petTypesResult);
      const usersResponse = getValue(usersResult);
      const profileResponse = getValue(profileResult);
      const usersError =
        usersResult.status === "rejected" ? usersResult.reason : null;

      const failedResults = [
        ordersResult,
        productsResult,
        categoriesResult,
        brandsResult,
        petTypesResult,
        usersResult,
      ].filter((result) => {
        return (
          result.status === "rejected" &&
          result.reason?.response?.status !== 404
        );
      });

      if ([401, 403].includes(usersError?.response?.status)) {
        setError(
          "Müşteri listesinin tamamını görmek için admin hesabı ile giris yapmalısınız. Su an /users/all endpointi yetki hatası dönüyor.",
        );
      } else if (failedResults.length > 0) {
        setError(
          "Bazı admin verileri alınamadı. Token veya backend durumunu kontrol edin.",
        );
      }

      setProfile(profileResponse?.data?.data || null);
      setDashboardData({
        orders: getCollection(ordersResponse, "orders"),
        products: getCollection(productsResponse, "products"),
        categories: getCollection(categoriesResponse, "categories"),
        brands: getCollection(brandsResponse, "brands"),
        petTypes: getCollection(petTypesResponse, "petType"),
        users: getCollection(usersResponse, "users"),
        totals: {
          orders: getPaginationTotal(ordersResponse),
          products: getPaginationTotal(productsResponse),
          categories: getPaginationTotal(categoriesResponse),
          brands: getPaginationTotal(brandsResponse),
          petTypes: getPaginationTotal(petTypesResponse),
          users:
            getPaginationTotal(usersResponse) ||
            getCollection(usersResponse, "users").length,
        },
      });
      return true;
    } catch (err) {
      setError(
        err?.response?.data?.message || "Admin panel verileri yüklenemedi.",
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(loadDashboardData);
  }, []);

  const adminName =
    [profile?.name, profile?.surname].filter(Boolean).join(" ") || "Yönetici";

  const totalRevenue = useMemo(() => {
    return dashboardData.orders.reduce((total, order) => {
      return total + Number(order.total_price || 0);
    }, 0);
  }, [dashboardData.orders]);

  const lowStockProducts = useMemo(() => {
    return dashboardData.products.filter((product) => {
      const stock = (product.variants || []).reduce((total, variant) => {
        return total + Number(variant.stock || 0);
      }, 0);

      return stock <= 5;
    });
  }, [dashboardData.products]);

  const normalizedSearchTerm = useMemo(() => {
    return normalizeSearchValue(searchTerm.trim());
  }, [searchTerm]);

  const filteredOrders = useMemo(() => {
    return dashboardData.orders.filter((order) => {
      const orderUser =
        order.user ||
        dashboardData.users.find((user) => user.id === order.user_id);
      const customerName =
        getUserFullName(orderUser) ||
        orderUser?.email ||
        `Musteri #${order.user_id}`;
      const searchable = [
        `#${order.id}`,
        order.status,
        getOrderProductName(order),
        customerName,
        orderUser?.email,
        orderUser?.phone_number,
        order.user_id,
        order.total_price,
      ];

      return matchesSearchTerm(searchable, normalizedSearchTerm);
    });
  }, [dashboardData.orders, dashboardData.users, normalizedSearchTerm]);

  const filteredProducts = useMemo(() => {
    return dashboardData.products.filter((product) => {
      const variantText = (product.variants || [])
        .map((variant) => {
          return [
            variant.variant_name,
            variant.sku,
            variant.price,
            variant.stock,
          ]
            .filter(Boolean)
            .join(" ");
        })
        .join(" ");

      return matchesSearchTerm(
        [
          product.name,
          product.description,
          product.brand?.name,
          product.category?.name,
          product.petType?.name,
          product.pet_type?.name,
          variantText,
        ],
        normalizedSearchTerm,
      );
    });
  }, [dashboardData.products, normalizedSearchTerm]);

  const recentProducts = normalizedSearchTerm
    ? filteredProducts
    : filteredProducts.slice(0, 5);
  const userById = useMemo(() => {
    return dashboardData.users.reduce((usersMap, user) => {
      usersMap[user.id] = user;
      return usersMap;
    }, {});
  }, [dashboardData.users]);
  const customerUsers = useMemo(() => {
    const usersMap = new Map();

    dashboardData.users.forEach((user) => {
      if (user.role !== "admin") {
        usersMap.set(user.id, user);
      }
    });

    dashboardData.orders.forEach((order) => {
      if (order.user && order.user.role !== "admin") {
        usersMap.set(order.user.id, {
          ...(usersMap.get(order.user.id) || {}),
          ...order.user,
        });
      }
    });

    return Array.from(usersMap.values());
  }, [dashboardData.orders, dashboardData.users]);

  const adminUsers = useMemo(() => {
    return dashboardData.users.filter((user) => user.role === "admin");
  }, [dashboardData.users]);

  const visibleUsers = useMemo(() => {
    return customerUsers.filter((user) => {
      return matchesSearchTerm(
        [
          getUserFullName(user),
          user.email,
          user.phone_number,
          user.role,
          user.id,
        ],
        normalizedSearchTerm,
      );
    });
  }, [customerUsers, normalizedSearchTerm]);

  const visibleAdminUsers = useMemo(() => {
    return adminUsers.filter((user) => {
      return matchesSearchTerm(
        [
          getUserFullName(user),
          user.email,
          user.phone_number,
          user.role,
          user.id,
        ],
        normalizedSearchTerm,
      );
    });
  }, [adminUsers, normalizedSearchTerm]);

  const emailEligibleUsers = customerUsers.filter((user) => {
    return user.email && isPreferenceEnabled(user.notification_deals);
  });
  const handleOrderStatusChange = async (orderId, nextStatus) => {
    setUpdatingOrderId(orderId);
    setError("");

    try {
      const response = await updateOrderStatus(orderId, nextStatus);
      const updatedOrder = response.data.data;

      setDashboardData((current) => ({
        ...current,
        orders: current.orders.map((order) => {
          return order.id === orderId
            ? { ...order, status: updatedOrder.status }
            : order;
        }),
      }));
    } catch (err) {
      setError(
        err?.response?.data?.message || "Siparis durumu guncellenemedi.",
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleQuickFormChange = (event) => {
    const { name, value } = event.target;
    setQuickForms((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleProductFormChange = (event) => {
    const { name, value, files } = event.target;
    setProductForm((current) => ({
      ...current,
      [name]: files ? files[0] || null : value,
    }));
  };

  const handleCreateSimpleResource = async (event, resourceType) => {
    event.preventDefault();
    const value = quickForms[resourceType].trim();
    if (!value) return;

    const createActions = {
      category: createCategory,
      brand: createBrand,
      petType: createPetType,
    };

    const resourceLabels = {
      category: "Kategori",
      brand: "Marka",
      petType: "Hayvan turu",
    };

    setSavingForm(resourceType);
    setError("");
    setSuccessMessage("");

    try {
      await createActions[resourceType]({ name: value });
      setQuickForms((current) => ({
        ...current,
        [resourceType]: "",
      }));
      setSuccessMessage(`${resourceLabels[resourceType]} eklendi.`);
      await loadDashboardData();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          `${resourceLabels[resourceType]} eklenemedi.`,
      );
    } finally {
      setSavingForm("");
    }
  };

  const handleProductSubmit = async (event) => {
    event.preventDefault();
    setSavingForm("product");
    setError("");
    setSuccessMessage("");

    try {
      if (!productForm.id && !productForm.imageFile) {
        throw new Error("Urun resmi secmelisiniz.");
      }

      const payload = new FormData();
      payload.append("name", productForm.name.trim());
      payload.append("description", productForm.description.trim());
      payload.append("category_id", productForm.category_id);
      payload.append("brand_id", productForm.brand_id);
      payload.append("pet_type_id", productForm.pet_type_id);
      if (productForm.imageFile) {
        payload.append("product_image", productForm.imageFile);
      }
      const hasVariantData = [
        productForm.variant_name,
        productForm.price,
        productForm.stock,
        productForm.sku,
      ].some((value) => String(value || "").trim() !== "");

      if (hasVariantData) {
        payload.append(
          "variants",
          JSON.stringify([
            {
              variant_name: productForm.variant_name.trim() || null,
              price:
                productForm.price === "" ? null : Number(productForm.price),
              stock:
                productForm.stock === "" ? null : Number(productForm.stock),
              sku: productForm.sku.trim() || null,
            },
          ]),
        );
      }

      if (productForm.id) {
        await updateProduct(productForm.id, payload);
      } else {
        await createProduct(payload);
      }
      setProductForm(emptyProductForm);
      event.target.reset();
      setSuccessMessage(
        productForm.id
          ? "Urun basariyla guncellendi."
          : "Urun basariyla eklendi.",
      );
      await loadDashboardData();
    } catch (err) {
      setError(
        err?.response?.data?.message || err.message || "Urun eklenemedi.",
      );
    } finally {
      setSavingForm("");
    }
  };

  const handleEditProduct = (product) => {
    const firstVariant = product.variants?.[0] || {};
    setProductForm({
      id: product.id,
      name: product.name || "",
      description: product.description || "",
      category_id: product.category_id || "",
      brand_id: product.brand_id || "",
      pet_type_id: product.pet_type_id || "",
      variant_name: firstVariant.variant_name || "",
      price: firstVariant.price || "",
      stock: firstVariant.stock || "",
      sku: firstVariant.sku || "",
      imageFile: null,
    });
    setSuccessMessage("");
    setError("");
    document.getElementById("ekle")?.scrollIntoView({ behavior: "smooth" });
  };

  const cancelProductEdit = () => {
    setProductForm(emptyProductForm);
    const fileInput = document.getElementById("product-image-upload");
    if (fileInput) fileInput.value = "";
  };

  const startEditResource = (resourceType, item) => {
    setEditingResource({ type: resourceType, id: item.id });
    setEditingResourceName(item.name || "");
    setError("");
    setSuccessMessage("");
  };

  const cancelEditResource = () => {
    setEditingResource(null);
    setEditingResourceName("");
  };

  const handleUpdateResource = async (resourceType, item) => {
    const value = editingResourceName.trim();
    if (!value) return;

    const updateActions = {
      category: updateCategory,
      brand: updateBrand,
      petType: updatePetType,
    };
    const resourceLabels = {
      category: "Kategori",
      brand: "Marka",
      petType: "Hayvan turu",
    };

    setSavingForm(`${resourceType}-${item.id}`);
    setError("");
    setSuccessMessage("");

    try {
      await updateActions[resourceType](item.id, { name: value });
      setSuccessMessage(`${resourceLabels[resourceType]} guncellendi.`);
      cancelEditResource();
      await loadDashboardData();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          `${resourceLabels[resourceType]} guncellenemedi.`,
      );
    } finally {
      setSavingForm("");
    }
  };

  const handleEmailFormChange = (event) => {
    const { name, value } = event.target;
    setEmailForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "recipientMode" ? { recipients: [] } : {}),
    }));
  };

  const handleAdminFormChange = (event) => {
    const { name, value } = event.target;
    if (adminFormError) {
      setAdminFormError("");
    }
    setAdminForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleCreateAdmin = async (event) => {
    event.preventDefault();
    setSavingForm("admin");
    setError("");
    setAdminFormError("");
    setSuccessMessage("");

    try {
      await createAdmin({
        name: adminForm.name.trim(),
        surname: adminForm.surname.trim(),
        email: adminForm.email.trim(),
        phone_number: adminForm.phone_number.trim(),
        password: adminForm.password,
      });
      setAdminForm(emptyAdminForm);
      setSuccessMessage("Admin başarıyla eklendi.");
      await loadDashboardData();
    } catch (err) {
      const message = getApiErrorMessage(err, "Admin eklenemedi.");
      setAdminFormError(message);
      setError(message);
    } finally {
      setSavingForm("");
    }
  };

  const handleEmailRecipientToggle = (email) => {
    setEmailForm((current) => {
      const hasEmail = current.recipients.includes(email);
      return {
        ...current,
        recipients: hasEmail
          ? current.recipients.filter((recipient) => recipient !== email)
          : [...current.recipients, email],
      };
    });
  };

  const handleSendEmail = async (event) => {
    event.preventDefault();
    setSavingForm("email");
    setError("");
    setSuccessMessage("");

    try {
      if (
        emailForm.recipientMode === "selected" &&
        emailForm.recipients.length === 0
      ) {
        throw new Error("En az bir musteri secmelisiniz.");
      }

      const response = await sendAdminEmail({
        recipientMode: emailForm.recipientMode,
        recipients: emailForm.recipients,
        subject: emailForm.subject,
        message: emailForm.message,
      });

      setEmailForm(emptyEmailForm);
      setSuccessMessage(
        `${response.data.data.recipient_count} aliciya e-posta gonderildi.`,
      );
    } catch (err) {
      setError(
        err?.response?.data?.message || err.message || "E-posta gonderilemedi.",
      );
    } finally {
      setSavingForm("");
    }
  };

  const handleDeleteResource = async (resourceType, item) => {
    const deleteActions = {
      category: deleteCategory,
      brand: deleteBrand,
      petType: deletePetType,
      product: deleteProduct,
    };
    const resourceLabels = {
      category: "Kategori",
      brand: "Marka",
      petType: "Hayvan turu",
      product: "Urun",
    };
    const deleteKey = `${resourceType}-${item.id}`;

    if (!window.confirm(`${item.name} kaydini silmek istiyor musunuz?`)) {
      return;
    }

    setDeletingItem(deleteKey);
    setError("");
    setSuccessMessage("");

    try {
      await deleteActions[resourceType](item.id);
      setSuccessMessage(`${resourceLabels[resourceType]} silindi.`);
      await loadDashboardData();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          `${resourceLabels[resourceType]} silinemedi.`,
      );
    } finally {
      setDeletingItem("");
    }
  };

  const handleDeleteAdmin = async (admin) => {
    if (String(admin.id) === String(profile?.id)) {
      setError("Kendi admin hesabınızı silemezsiniz.");
      return;
    }

    const fullName =
      getUserFullName(admin) || admin.email || `Admin #${admin.id}`;

    if (!window.confirm(`${fullName} admin hesabını silmek istiyor musunuz?`)) {
      return;
    }

    setDeletingItem(`admin-${admin.id}`);
    setError("");
    setSuccessMessage("");

    try {
      await deleteUser(admin.id);
      setSuccessMessage("Admin silindi.");
      await loadDashboardData();
    } catch (err) {
      setError(err?.response?.data?.message || "Admin silinemedi.");
    } finally {
      setDeletingItem("");
    }
  };

  const handleDownloadReport = () => {
    const generatedAt = new Date();
    const rows = [
      csvRow(["Pati Market Admin Raporu"]),
      csvRow(["Olusturma Tarihi", generatedAt.toLocaleString("tr-TR")]),
      "",
      csvRow(["Ozet"]),
      csvRow(["Listelenen Gelir", totalRevenue]),
      csvRow(["Siparis", dashboardData.totals.orders]),
      csvRow(["Urun", dashboardData.totals.products]),
      csvRow(["Kategori", dashboardData.totals.categories]),
      csvRow(["Marka", dashboardData.totals.brands]),
      csvRow(["Pet Turu", dashboardData.totals.petTypes]),
      csvRow(["Musteri", dashboardData.totals.users]),
      csvRow(["Dusuk Stoklu Urun", lowStockProducts.length]),
      "",
      csvRow(["Son Siparisler"]),
      csvRow(["Siparis No", "Musteri", "Urun", "Tutar", "Durum"]),
      ...dashboardData.orders.map((order) => {
        const customer = order.user || userById[order.user_id];
        const customerName =
          getUserFullName(customer) ||
          customer?.email ||
          `Musteri #${order.user_id}`;

        return csvRow([
          order.id,
          customerName,
          getOrderProductName(order),
          order.total_price,
          statusMeta[order.status]?.label || order.status || "Bilinmiyor",
        ]);
      }),
      "",
      csvRow(["Urunler"]),
      csvRow(["Urun", "Marka", "Kategori", "Pet Turu", "Stok", "Ilk Fiyat"]),
      ...dashboardData.products.map((product) => {
        const stock = (product.variants || []).reduce((total, variant) => {
          return total + Number(variant.stock || 0);
        }, 0);

        return csvRow([
          product.name,
          product.brand?.name || "Marka yok",
          product.category?.name || "Kategori yok",
          product.petType?.name || product.pet_type?.name || "Pet turu yok",
          stock,
          product.variants?.[0]?.price || "",
        ]);
      }),
      "",
      csvRow(["Katalog Ozeti"]),
      csvRow([
        "Kategoriler",
        ...dashboardData.categories.map((category) => category.name),
      ]),
      csvRow(["Markalar", ...dashboardData.brands.map((brand) => brand.name)]),
      csvRow([
        "Pet Turleri",
        ...dashboardData.petTypes.map((petType) => petType.name),
      ]),
    ];

    const reportContent = `\uFEFF${rows.join("\r\n")}`;
    const blob = new Blob([reportContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStamp = generatedAt.toISOString().slice(0, 10);

    link.href = url;
    link.download = `pati-market-rapor-${dateStamp}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setSuccessMessage("Rapor indirildi.");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  return (
    <div>
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              pets
            </span>
          </div>
          <div>
            <h1 className="brand-title">Pati Market</h1>
            <p className="brand-subtitle">Yönetim Konsolu</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <a className="nav-item active" href="#panel">
            <span className="material-symbols-outlined">dashboard</span>
            <span>Panel</span>
          </a>
          <a className="nav-item" href="#siparisler">
            <span className="material-symbols-outlined">shopping_cart</span>
            <span>Siparişler</span>
          </a>
          <a className="nav-item" href="#urunler">
            <span className="material-symbols-outlined">inventory_2</span>
            <span>Ürünler</span>
          </a>
          <a className="nav-item" href="#ekle">
            <span className="material-symbols-outlined">add_box</span>
            <span>Ekle</span>
          </a>
          <a className="nav-item" href="#kategoriler">
            <span className="material-symbols-outlined">category</span>
            <span>Kategoriler</span>
          </a>
          <a className="nav-item" href="#markalar">
            <span className="material-symbols-outlined">sell</span>
            <span>Markalar</span>
          </a>
          <a className="nav-item" href="#musteriler">
            <span className="material-symbols-outlined">group</span>
            <span>Müşteriler</span>
          </a>
          <a className="nav-item" href="#adminler">
            <span className="material-symbols-outlined">
              admin_panel_settings
            </span>
            <span>Adminler</span>
          </a>
          <a className="nav-item" href="#canli-destek">
            <span className="material-symbols-outlined">support_agent</span>
            <span>Canli Destek</span>
          </a>
          <a className="nav-item" href="#email">
            <span className="material-symbols-outlined">mail</span>
            <span>E-posta</span>
          </a>
        </nav>

        <div className="sidebar-footer">
          <a className="btn-add-product" href="#urunler">
            <span className="material-symbols-outlined">add</span>
            Ürünleri Gör
          </a>
          <div className="user-profile-section">
            <div className="avatar-main avatar-fallback">
              {getInitials(adminName)}
            </div>
            <div>
              <p className="user-name">{adminName}</p>
              <p className="user-role">Yönetici</p>
            </div>
          </div>
        </div>
      </aside>

      <header className="header">
        <div className="search-container">
          <span className="material-symbols-outlined search-icon">search</span>
          <input
            className="search-input"
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Sipariş, ürün, müşteri veya admin ara..."
            type="text"
            value={searchTerm}
          />
        </div>
        <div className="header-actions">
          <div className="header-user">
            <div className="header-user-info">
              <p className="user-name">{adminName}</p>
            </div>
            <div className="avatar-header avatar-fallback">
              {getInitials(adminName)}
            </div>
          </div>
          <button
            className="admin-logout-btn"
            onClick={handleLogout}
            title="Çıkış yap"
            type="button"
          >
            <span className="material-symbols-outlined">logout</span>
            <span>Çıkış</span>
          </button>
        </div>
      </header>

      <main className="main-canvas" id="panel">
        <div className="container">
          <div className="dashboard-header">
            <div>
              <h2 className="dashboard-title">Panel</h2>
            </div>
            <div className="header-buttons">
              <button
                className="btn-secondary"
                onClick={loadDashboardData}
                type="button"
              >
                <span className="material-symbols-outlined">sync</span>
                Yenile
              </button>
              <button
                className="btn-primary natural-bloom-shadow"
                disabled={isLoading}
                onClick={handleDownloadReport}
                type="button"
              >
                <span className="material-symbols-outlined">download</span>
                Rapor
              </button>
            </div>
          </div>

          {error && <div className="admin-alert">{error}</div>}
          {successMessage && (
            <div className="admin-success">{successMessage}</div>
          )}
          {isLoading && (
            <div className="admin-loading">Admin verileri yukleniyor...</div>
          )}

          <div className="bento-grid">
            <div className="summary-card natural-bloom-shadow">
              <div className="card-top">
                <div className="card-icon-wrapper revenue">
                  <span className="material-symbols-outlined">payments</span>
                </div>
              </div>
              <div>
                <p className="card-label">Listelenen Gelir</p>
                <h3 className="card-value">{formatCurrency(totalRevenue)}</h3>
              </div>
            </div>
            <div className="summary-card natural-bloom-shadow">
              <div className="card-top">
                <div className="card-icon-wrapper orders">
                  <span className="material-symbols-outlined">
                    shopping_basket
                  </span>
                </div>
                <span className="badge-trend">
                  {dashboardData.orders.length} kayıt
                </span>
              </div>
              <div>
                <p className="card-label">Toplam Sipariş</p>
                <h3 className="card-value">{dashboardData.totals.orders}</h3>
              </div>
            </div>
            <div className="summary-card natural-bloom-shadow">
              <div className="card-top">
                <div className="card-icon-wrapper customers">
                  <span className="material-symbols-outlined">inventory_2</span>
                </div>
                <span className="badge-trend">
                  {lowStockProducts.length} düşük stok
                </span>
              </div>
              <div>
                <p className="card-label">Toplam Ürün</p>
                <h3 className="card-value">{dashboardData.totals.products}</h3>
              </div>
            </div>
            <div className="summary-card natural-bloom-shadow">
              <div className="card-top">
                <div className="card-icon-wrapper pets">
                  <span className="material-symbols-outlined">group</span>
                </div>
                <span className="badge-stable">Admin</span>
              </div>
              <div>
                <p className="card-label">Müşteriler</p>
                <h3 className="card-value">
                  {dashboardData.totals.users || customerUsers.length}
                </h3>
              </div>
            </div>
          </div>

          <section
            className="admin-create-section natural-bloom-shadow"
            id="ekle"
          >
            <div className="table-header">
              <div>
                <h4 className="chart-title">Yeni Kayıt Ekle</h4>
                <p className="chart-subtitle">
                  Kategori, marka, hayvan türü ve ürün kayıt oluştur
                </p>
              </div>
            </div>

            <div className="admin-create-content">
              <div className="quick-create-grid">
                <form
                  className="admin-create-form compact"
                  onSubmit={(event) =>
                    handleCreateSimpleResource(event, "category")
                  }
                >
                  <label htmlFor="new-category">Kategori</label>
                  <div className="admin-inline-control">
                    <input
                      id="new-category"
                      name="category"
                      value={quickForms.category}
                      onChange={handleQuickFormChange}
                      placeholder="Orn: Mama"
                      required
                    />
                    <button type="submit" disabled={savingForm === "category"}>
                      <span className="material-symbols-outlined">add</span>
                    </button>
                  </div>
                </form>

                <form
                  className="admin-create-form compact"
                  onSubmit={(event) =>
                    handleCreateSimpleResource(event, "brand")
                  }
                >
                  <label htmlFor="new-brand">Marka</label>
                  <div className="admin-inline-control">
                    <input
                      id="new-brand"
                      name="brand"
                      value={quickForms.brand}
                      onChange={handleQuickFormChange}
                      placeholder="Orn: Royal Canin"
                      required
                    />
                    <button type="submit" disabled={savingForm === "brand"}>
                      <span className="material-symbols-outlined">add</span>
                    </button>
                  </div>
                </form>

                <form
                  className="admin-create-form compact"
                  onSubmit={(event) =>
                    handleCreateSimpleResource(event, "petType")
                  }
                >
                  <label htmlFor="new-pet-type">Hayvan Türü</label>
                  <div className="admin-inline-control">
                    <input
                      id="new-pet-type"
                      name="petType"
                      value={quickForms.petType}
                      onChange={handleQuickFormChange}
                      placeholder="Orn: Kedi"
                      required
                    />
                    <button type="submit" disabled={savingForm === "petType"}>
                      <span className="material-symbols-outlined">add</span>
                    </button>
                  </div>
                </form>
              </div>

              <form
                className="admin-create-form product-form"
                onSubmit={handleProductSubmit}
              >
                <div className="product-form-header">
                  <span className="material-symbols-outlined">inventory_2</span>
                  <div>
                    <h5>{productForm.id ? "Urun Duzenle" : "Ürün Ekle"}</h5>
                    <p>
                      {productForm.id
                        ? "Secili urun bilgilerini guncelle"
                        : "Tek varyantla hızlı ürün oluştur"}
                    </p>
                  </div>
                </div>

                <div className="admin-form-grid">
                  <label>
                    Ürün Adı
                    <input
                      name="name"
                      value={productForm.name}
                      onChange={handleProductFormChange}
                      placeholder="Somonlu kedi mamasi"
                      required
                    />
                  </label>
                  <label>
                    Kategori
                    <select
                      name="category_id"
                      value={productForm.category_id}
                      onChange={handleProductFormChange}
                      required
                    >
                      <option value="">Seç</option>
                      {dashboardData.categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Marka
                    <select
                      name="brand_id"
                      value={productForm.brand_id}
                      onChange={handleProductFormChange}
                      required
                    >
                      <option value="">Seç</option>
                      {dashboardData.brands.map((brand) => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Hayvan Türü
                    <select
                      name="pet_type_id"
                      value={productForm.pet_type_id}
                      onChange={handleProductFormChange}
                      required
                    >
                      <option value="">Seç</option>
                      {dashboardData.petTypes.map((petType) => (
                        <option key={petType.id} value={petType.id}>
                          {petType.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="wide-field">
                    Açıklama
                    <textarea
                      name="description"
                      value={productForm.description}
                      onChange={handleProductFormChange}
                      placeholder="Urun detaylarini yazin"
                      rows="3"
                      required
                    />
                  </label>
                  <label>
                    Varyant
                    <input
                      name="variant_name"
                      value={productForm.variant_name}
                      onChange={handleProductFormChange}
                      placeholder="1 kg"
                    />
                  </label>
                  <label>
                    Fiyat
                    <input
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={productForm.price}
                      onChange={handleProductFormChange}
                      placeholder="249.90"
                    />
                  </label>
                  <label>
                    Stok
                    <input
                      name="stock"
                      type="number"
                      min="0"
                      value={productForm.stock}
                      onChange={handleProductFormChange}
                      placeholder="25"
                    />
                  </label>
                  <label>
                    SKU
                    <input
                      name="sku"
                      value={productForm.sku}
                      onChange={handleProductFormChange}
                      placeholder="PM-KEDI-001"
                    />
                  </label>
                  <label className="wide-field product-upload-field">
                    Ürün Görseli {productForm.id ? "(opsiyonel)" : ""}
                    <div className="admin-file-upload">
                      <input
                        id="product-image-upload"
                        name="imageFile"
                        type="file"
                        accept="image/*"
                        onChange={handleProductFormChange}
                        required={!productForm.id}
                      />
                      <span className="material-symbols-outlined">
                        upload_file
                      </span>
                      <div>
                        <strong>
                          {productForm.imageFile
                            ? productForm.imageFile.name
                            : productForm.id
                              ? "Yeni görsel seç"
                              : "Görsel seç"}
                        </strong>
                        <small>PNG, JPG, WEBP</small>
                      </div>
                    </div>
                  </label>
                </div>

                <button
                  className="admin-submit-btn"
                  type="submit"
                  disabled={savingForm === "product"}
                >
                  <span className="material-symbols-outlined">
                    {productForm.id ? "save" : "add_box"}
                  </span>
                  {savingForm === "product"
                    ? "Kaydediliyor..."
                    : productForm.id
                      ? "Ürünü Güncelle"
                      : "Ürün Ekle"}
                </button>
                {productForm.id && (
                  <button
                    className="admin-cancel-edit-btn"
                    onClick={cancelProductEdit}
                    type="button"
                  >
                    Vazgeç
                  </button>
                )}
              </form>
            </div>
          </section>

          <div className="analytics-section">
            <div className="chart-container natural-bloom-shadow">
              <div className="chart-header">
                <div>
                  <h4 className="chart-title">Katalog Özeti</h4>
                  <p className="chart-subtitle">
                    Kategori, marka ve pet türünden gelen dağılım
                  </p>
                </div>
              </div>
              <div className="admin-metric-grid">
                <div className="admin-mini-metric">
                  <span className="material-symbols-outlined">category</span>
                  <div>
                    <p>Kategori</p>
                    <strong>{dashboardData.totals.categories}</strong>
                  </div>
                </div>
                <div className="admin-mini-metric">
                  <span className="material-symbols-outlined">sell</span>
                  <div>
                    <p>Marka</p>
                    <strong>{dashboardData.totals.brands}</strong>
                  </div>
                </div>
                <div className="admin-mini-metric">
                  <span className="material-symbols-outlined">pets</span>
                  <div>
                    <p>Pet Türü</p>
                    <strong>{dashboardData.totals.petTypes}</strong>
                  </div>
                </div>
              </div>
              <div className="catalog-resource-grid" id="kategoriler">
                <div className="resource-list">
                  <h5>Kategoriler</h5>
                  {dashboardData.categories.map((category) => (
                    <div
                      className="resource-item with-action"
                      key={category.id}
                    >
                      {editingResource?.type === "category" &&
                      editingResource?.id === category.id ? (
                        <input
                          className="resource-edit-input"
                          value={editingResourceName}
                          onChange={(event) =>
                            setEditingResourceName(event.target.value)
                          }
                        />
                      ) : (
                        <span>{category.name}</span>
                      )}
                      <div className="resource-actions">
                        <strong>{category.products?.length || 0} urun</strong>
                        {editingResource?.type === "category" &&
                        editingResource?.id === category.id ? (
                          <>
                            <button
                              className="admin-edit-icon-btn save"
                              disabled={
                                savingForm === `category-${category.id}`
                              }
                              onClick={() =>
                                handleUpdateResource("category", category)
                              }
                              type="button"
                              title="Kaydet"
                            >
                              <span className="material-symbols-outlined">
                                check
                              </span>
                            </button>
                            <button
                              className="admin-edit-icon-btn"
                              onClick={cancelEditResource}
                              type="button"
                              title="Vazgec"
                            >
                              <span className="material-symbols-outlined">
                                close
                              </span>
                            </button>
                          </>
                        ) : (
                          <button
                            className="admin-edit-icon-btn"
                            onClick={() =>
                              startEditResource("category", category)
                            }
                            type="button"
                            title="Kategori duzenle"
                          >
                            <span className="material-symbols-outlined">
                              edit
                            </span>
                          </button>
                        )}
                        <button
                          className="admin-delete-icon-btn"
                          disabled={deletingItem === `category-${category.id}`}
                          onClick={() =>
                            handleDeleteResource("category", category)
                          }
                          type="button"
                          title="Kategori sil"
                        >
                          <span className="material-symbols-outlined">
                            delete
                          </span>
                        </button>
                      </div>
                    </div>
                  ))}
                  {!isLoading && dashboardData.categories.length === 0 && (
                    <div className="empty-row">Kategori bulunamadi.</div>
                  )}
                </div>

                <div className="resource-list" id="markalar">
                  <h5>Markalar</h5>
                  {dashboardData.brands.map((brand) => (
                    <div className="resource-item with-action" key={brand.id}>
                      {editingResource?.type === "brand" &&
                      editingResource?.id === brand.id ? (
                        <input
                          className="resource-edit-input"
                          value={editingResourceName}
                          onChange={(event) =>
                            setEditingResourceName(event.target.value)
                          }
                        />
                      ) : (
                        <span>{brand.name}</span>
                      )}
                      <div className="resource-actions">
                        <strong>{brand.products?.length || 0} urun</strong>
                        {editingResource?.type === "brand" &&
                        editingResource?.id === brand.id ? (
                          <>
                            <button
                              className="admin-edit-icon-btn save"
                              disabled={savingForm === `brand-${brand.id}`}
                              onClick={() =>
                                handleUpdateResource("brand", brand)
                              }
                              type="button"
                              title="Kaydet"
                            >
                              <span className="material-symbols-outlined">
                                check
                              </span>
                            </button>
                            <button
                              className="admin-edit-icon-btn"
                              onClick={cancelEditResource}
                              type="button"
                              title="Vazgec"
                            >
                              <span className="material-symbols-outlined">
                                close
                              </span>
                            </button>
                          </>
                        ) : (
                          <button
                            className="admin-edit-icon-btn"
                            onClick={() => startEditResource("brand", brand)}
                            type="button"
                            title="Marka duzenle"
                          >
                            <span className="material-symbols-outlined">
                              edit
                            </span>
                          </button>
                        )}
                        <button
                          className="admin-delete-icon-btn"
                          disabled={deletingItem === `brand-${brand.id}`}
                          onClick={() => handleDeleteResource("brand", brand)}
                          type="button"
                          title="Marka sil"
                        >
                          <span className="material-symbols-outlined">
                            delete
                          </span>
                        </button>
                      </div>
                    </div>
                  ))}
                  {!isLoading && dashboardData.brands.length === 0 && (
                    <div className="empty-row">Marka bulunamadi.</div>
                  )}
                </div>

                <div className="resource-list">
                  <h5>Hayvan Türleri</h5>
                  {dashboardData.petTypes.map((petType) => (
                    <div className="resource-item with-action" key={petType.id}>
                      {editingResource?.type === "petType" &&
                      editingResource?.id === petType.id ? (
                        <input
                          className="resource-edit-input"
                          value={editingResourceName}
                          onChange={(event) =>
                            setEditingResourceName(event.target.value)
                          }
                        />
                      ) : (
                        <span>{petType.name}</span>
                      )}
                      <div className="resource-actions">
                        <strong>Tür</strong>
                        {editingResource?.type === "petType" &&
                        editingResource?.id === petType.id ? (
                          <>
                            <button
                              className="admin-edit-icon-btn save"
                              disabled={savingForm === `petType-${petType.id}`}
                              onClick={() =>
                                handleUpdateResource("petType", petType)
                              }
                              type="button"
                              title="Kaydet"
                            >
                              <span className="material-symbols-outlined">
                                check
                              </span>
                            </button>
                            <button
                              className="admin-edit-icon-btn"
                              onClick={cancelEditResource}
                              type="button"
                              title="Vazgeç"
                            >
                              <span className="material-symbols-outlined">
                                close
                              </span>
                            </button>
                          </>
                        ) : (
                          <button
                            className="admin-edit-icon-btn"
                            onClick={() =>
                              startEditResource("petType", petType)
                            }
                            type="button"
                            title="Hayvan türü düzenle"
                          >
                            <span className="material-symbols-outlined">
                              edit
                            </span>
                          </button>
                        )}
                        <button
                          className="admin-delete-icon-btn"
                          disabled={deletingItem === `petType-${petType.id}`}
                          onClick={() =>
                            handleDeleteResource("petType", petType)
                          }
                          type="button"
                          title="Hayvan türü sil"
                        >
                          <span className="material-symbols-outlined">
                            delete
                          </span>
                        </button>
                      </div>
                    </div>
                  ))}
                  {!isLoading && dashboardData.petTypes.length === 0 && (
                    <div className="empty-row">Hayvan türü bulunamadı.</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="table-card natural-bloom-shadow" id="siparisler">
            <div className="table-header">
              <div>
                <h4 className="chart-title">Son Siparişler</h4>
                <p className="chart-subtitle">
                  Siparişleri listele ve durum güncelle
                </p>
              </div>
            </div>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>SİPARİŞ NO</th>
                    <th>Müşteri</th>
                    <th>Ürün</th>
                    <th>Tutar</th>
                    <th>Durum</th>
                    <th>Güncelle</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => {
                    const status = statusMeta[order.status] || {
                      label: order.status || "Bilinmiyor",
                      className: "pending",
                    };
                    const customer = order.user || userById[order.user_id];
                    const customerName =
                      getUserFullName(customer) ||
                      customer?.email ||
                      `Musteri #${order.user_id}`;

                    return (
                      <tr className="order-table-row" key={order.id}>
                        <td className="order-no" data-label="Siparis No">
                          #{order.id}
                        </td>
                        <td data-label="MÜŞTERİ">
                          <div className="customer-cell">
                            <div className="customer-avatar-text">
                              {getInitials(customerName)}
                            </div>
                            <span className="customer-name">
                              {customerName}
                            </span>
                          </div>
                          {customer?.email && (
                            <small className="customer-email">
                              {customer.email}
                            </small>
                          )}
                        </td>
                        <td data-label="Ürün">
                          <div className="order-product-cell">
                            <span className="product-name">
                              {getOrderProductName(order)}
                            </span>
                            <small>{order.orderItems?.length || 0} kalem</small>
                          </div>
                        </td>
                        <td className="order-amount" data-label="Tutar">
                          {formatCurrency(order.total_price)}
                        </td>
                        <td data-label="Durum">
                          <span className={`status-badge ${status.className}`}>
                            {status.label}
                          </span>
                        </td>
                        <td data-label="Güncelle">
                          <div className="status-action-group">
                            {editableStatuses.map((statusKey) => {
                              const isActive = order.status === statusKey;
                              const isUpdating = updatingOrderId === order.id;
                              const isDisabled =
                                isUpdating ||
                                isActive ||
                                terminalStatuses.includes(order.status);

                              return (
                                <button
                                  className={`status-action-btn ${statusMeta[statusKey].className} ${
                                    isActive ? "active" : ""
                                  }`}
                                  disabled={isDisabled}
                                  key={statusKey}
                                  onClick={() =>
                                    handleOrderStatusChange(order.id, statusKey)
                                  }
                                  title={`${statusMeta[statusKey].label} olarak guncelle`}
                                  type="button"
                                >
                                  <span className="material-symbols-outlined">
                                    {statusKey === "preparing" && "inventory_2"}
                                    {statusKey === "shipped" &&
                                      "local_shipping"}
                                    {statusKey === "delivered" && "task_alt"}
                                    {statusKey === "cancelled" && "cancel"}
                                  </span>
                                  <span className="status-action-label">
                                    {statusMeta[statusKey].label}
                                  </span>
                                </button>
                              );
                            })}
                            {updatingOrderId === order.id && (
                              <small className="status-update-note">
                                Güncelleniyor...
                              </small>
                            )}
                            {terminalStatuses.includes(order.status) && (
                              <small className="status-update-note">
                                Bu sipariş tamamlandı.
                              </small>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!isLoading && filteredOrders.length === 0 && (
                    <tr>
                      <td className="empty-row" colSpan="6">
                        Sipariş bulunamadı.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="split-tables">
            <div className="table-card natural-bloom-shadow" id="urunler">
              <div className="table-header">
                <div>
                  <h4 className="chart-title">Ürünler</h4>
                </div>
              </div>
              <div className="resource-list padded">
                {recentProducts.map((product) => {
                  const firstImage = product.images?.[0];
                  const stock = (product.variants || []).reduce(
                    (total, variant) => {
                      return total + Number(variant.stock || 0);
                    },
                    0,
                  );
                  const firstPrice = product.variants?.[0]?.price;

                  return (
                    <div className="product-resource" key={product.id}>
                      <div className="product-thumb">
                        {firstImage ? (
                          <img
                            alt={product.name}
                            src={getImageUrl(firstImage)}
                          />
                        ) : (
                          <span className="material-symbols-outlined">
                            inventory_2
                          </span>
                        )}
                      </div>
                      <div>
                        <strong>{product.name}</strong>
                        <p>{product.brand?.name || "Marka yok"}</p>
                      </div>
                      <div className="product-resource-meta">
                        <strong>{formatCurrency(firstPrice)}</strong>
                        <span>{stock} stok</span>
                      </div>
                      <button
                        className="admin-edit-icon-btn"
                        onClick={() => handleEditProduct(product)}
                        type="button"
                        title="Urun duzenle"
                      >
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      <button
                        className="admin-delete-icon-btn"
                        disabled={deletingItem === `product-${product.id}`}
                        onClick={() => handleDeleteResource("product", product)}
                        type="button"
                        title="Urun sil"
                      >
                        <span className="material-symbols-outlined">
                          delete
                        </span>
                      </button>
                    </div>
                  );
                })}
                {!isLoading && recentProducts.length === 0 && (
                  <div className="empty-row">Ürün bulunamadı.</div>
                )}
              </div>
            </div>

            <div className="table-card natural-bloom-shadow" id="musteriler">
              <div className="table-header">
                <div>
                  <h4 className="chart-title">Müşteriler</h4>
                </div>
              </div>
              <div className="resource-list padded">
                {visibleUsers.map((user) => {
                  const fullName = getUserFullName(user);

                  return (
                    <div className="resource-item" key={user.id}>
                      <span>
                        {fullName || `Kullanici #${user.id}`}
                        {user.email && <small>{user.email}</small>}
                      </span>
                      <strong>{user.phone_number || user.role}</strong>
                    </div>
                  );
                })}
                {!isLoading && visibleUsers.length === 0 && (
                  <div className="empty-row">Müşteri bulunamadı.</div>
                )}
              </div>
            </div>
          </div>

          <section className="table-card natural-bloom-shadow" id="adminler">
            <div className="table-header">
              <div>
                <h4 className="chart-title">Adminler</h4>
                <p className="chart-subtitle">
                  Yeni admin ekle ve mevcut admin hesaplarını yönet
                </p>
              </div>
            </div>

            <div className="admin-management-layout">
              <form className="admin-user-form" onSubmit={handleCreateAdmin}>
                {adminFormError && (
                  <div className="admin-form-error">{adminFormError}</div>
                )}
                <label>
                  Ad
                  <input
                    name="name"
                    onChange={handleAdminFormChange}
                    placeholder="Ad"
                    required
                    value={adminForm.name}
                  />
                </label>
                <label>
                  Soyad
                  <input
                    name="surname"
                    onChange={handleAdminFormChange}
                    placeholder="Soyad"
                    required
                    value={adminForm.surname}
                  />
                </label>
                <label>
                  E-posta
                  <input
                    name="email"
                    onChange={handleAdminFormChange}
                    placeholder="admin@pati.market"
                    required
                    type="email"
                    value={adminForm.email}
                  />
                </label>
                <label>
                  Telefon
                  <input
                    name="phone_number"
                    onChange={handleAdminFormChange}
                    placeholder="5xx1234567"
                    required
                    value={adminForm.phone_number}
                  />
                </label>
                <label>
                  Şifre
                  <input
                    name="password"
                    onChange={handleAdminFormChange}
                    placeholder="En az 6 karakter"
                    required
                    type="password"
                    value={adminForm.password}
                  />
                </label>
                <button
                  className="admin-submit-btn"
                  disabled={savingForm === "admin"}
                  type="submit"
                >
                  <span className="material-symbols-outlined">person_add</span>
                  {savingForm === "admin" ? "Ekleniyor..." : "Admin Ekle"}
                </button>
              </form>

              <div className="resource-list admin-user-list">
                {visibleAdminUsers.map((admin) => {
                  const isCurrentAdmin =
                    String(admin.id) === String(profile?.id);
                  const fullName =
                    getUserFullName(admin) || `Admin #${admin.id}`;

                  return (
                    <div className="resource-item with-action" key={admin.id}>
                      <span>
                        {fullName}
                        {admin.email && <small>{admin.email}</small>}
                      </span>
                      <div className="resource-actions">
                        {isCurrentAdmin && <strong>Aktif hesap</strong>}
                        <button
                          className="admin-delete-icon-btn"
                          disabled={
                            isCurrentAdmin ||
                            deletingItem === `admin-${admin.id}`
                          }
                          onClick={() => handleDeleteAdmin(admin)}
                          type="button"
                          title={
                            isCurrentAdmin
                              ? "Kendi hesabınızı silemezsiniz"
                              : "Admin sil"
                          }
                        >
                          <span className="material-symbols-outlined">
                            delete
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
                {!isLoading && visibleAdminUsers.length === 0 && (
                  <div className="empty-row">Admin bulunamadi.</div>
                )}
              </div>
            </div>
          </section>

          <section
            className="table-card natural-bloom-shadow"
            id="canli-destek"
          >
            <div className="table-header">
              <div>
                <h4 className="chart-title">Canli Destek</h4>
                <p className="chart-subtitle">
                  Bekleyen sohbetleri kabul et, müşteriye cevap yaz ve görüşmeyi bitir
                </p>
              </div>
            </div>
            <SupportAgentPanel profile={profile} />
          </section>

          <section className="table-card natural-bloom-shadow" id="email">
            <div className="table-header">
              <div>
                <h4 className="chart-title">Müşterilere E-posta Gönder</h4>
              </div>
            </div>

            <form className="admin-email-form" onSubmit={handleSendEmail}>
              <div className="admin-email-layout">
                <div className="admin-email-fields">
                  <label>
                    Alicilar
                    <select
                      name="recipientMode"
                      value={emailForm.recipientMode}
                      onChange={handleEmailFormChange}
                    >
                      <option value="all">Tüm müşteriler</option>
                      <option value="selected">Seçili müşteriler</option>
                    </select>
                  </label>

                  <label>
                    Konu
                    <input
                      name="subject"
                      value={emailForm.subject}
                      onChange={handleEmailFormChange}
                      placeholder="Kampanya duyurusu"
                      required
                    />
                  </label>

                  <label>
                    Mesaj
                    <textarea
                      name="message"
                      value={emailForm.message}
                      onChange={handleEmailFormChange}
                      rows="7"
                      placeholder="Merhaba, yeni kampanyalarımızı inceleyebilirsiniz."
                      required
                    />
                  </label>

                  <button
                    className="admin-submit-btn"
                    type="submit"
                    disabled={savingForm === "email"}
                  >
                    <span className="material-symbols-outlined">send</span>
                    {savingForm === "email"
                      ? "Gönderiliyor..."
                      : "E-posta Gönder"}
                  </button>
                </div>

                <div className="admin-recipient-list">
                  <div className="recipient-list-header">
                    <strong>Müşteriler</strong>
                    <span>{emailEligibleUsers.length} izinli e-posta</span>
                  </div>
                  {emailEligibleUsers.map((user) => {
                    const fullName = getUserFullName(user);
                    const disabled = emailForm.recipientMode === "all";
                    const checked =
                      disabled || emailForm.recipients.includes(user.email);

                    return (
                      <label className="recipient-option" key={user.id}>
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabled}
                          onChange={() =>
                            handleEmailRecipientToggle(user.email)
                          }
                        />
                        <span>
                          {fullName || `Kullanici #${user.id}`}
                          <small>{user.email}</small>
                        </span>
                      </label>
                    );
                  })}
                  {emailEligibleUsers.length === 0 && (
                    <div className="empty-row">
                      Kampanya e-postası izni olan müşteri yok.
                    </div>
                  )}
                </div>
              </div>
            </form>
          </section>

          <div className="footer-spacing"></div>
        </div>
      </main>
    </div>
  );
}
