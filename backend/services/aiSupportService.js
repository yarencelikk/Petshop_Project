const { GoogleGenAI, Type } = require("@google/genai");
const {
  Brand,
  Category,
  PetType,
  Product,
  ProductVariant,
} = require("../models");

function normalizeText(value) {
  return String(value || "")
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getFallbackReply(userMessage) {
  const text = normalizeText(userMessage);
  const includesAny = (keywords) =>
    keywords.some((keyword) => text.includes(normalizeText(keyword)));

  if (includesAny(["merhaba", "selam", "slm", "iyi gunler", "iyi aksamlar"])) {
    return {
      text: "Merhaba! Pet urunleri, mama secimi, siparis adimlari, kampanyalar ve teslimat hakkinda yardimci olabilirim.",
      shouldEscalate: false,
      intent: "greeting",
      confidence: 0.9,
    };
  }

  if (includesAny(["kedi", "mama", "yas mama", "kuru mama"])) {
    return {
      text: "Kedi mamasi secerken kedinizin yasi, kilosu, kisir olup olmadigi ve hassasiyetleri onemli. Yavru kediler icin kitten, kisir kediler icin sterilised, hassas sindirim icin sensitive urunleri tercih edebilirsiniz.",
      shouldEscalate: false,
      intent: "cat_food_advice",
      confidence: 0.85,
    };
  }

  if (includesAny(["kopek", "köpek", "yavru kopek", "yavru köpek"])) {
    return {
      text: "Kopek urunu secerken irk boyutu, yas ve aktivite seviyesi belirleyicidir. Yavru kopekler icin puppy mama, buyuk irklar icin large breed, hassas mide icin sensitive secenekleri uygundur.",
      shouldEscalate: false,
      intent: "dog_food_advice",
      confidence: 0.85,
    };
  }

  if (includesAny(["kus", "kuş", "muhabbet", "papagan", "papağan"])) {
    return {
      text: "Kuslar icin yem seciminde tur onemli. Muhabbet kuslari icin karisik yem ve mineral blok, papaganlar icin turune uygun tohum/pelet ve oyuncaklar tercih edilebilir.",
      shouldEscalate: false,
      intent: "bird_product_advice",
      confidence: 0.82,
    };
  }

  if (includesAny(["akvaryum", "balik", "balık", "filtre", "isitici", "ısıtıcı"])) {
    return {
      text: "Akvaryum urunlerinde balik turu ve akvaryum litresi onemli. Filtre, isitici, su duzenleyici ve ture uygun yem temel ihtiyaclardir.",
      shouldEscalate: false,
      intent: "aquarium_advice",
      confidence: 0.82,
    };
  }

  if (includesAny(["kampanya", "indirim", "kupon", "firsat", "fırsat"])) {
    return {
      text: "Kampanyalari ve kuponlari Kampanyalar sayfasindan takip edebilirsiniz. Kupon kullanimi varsa sepet veya odeme adiminda kod alanina girmeniz yeterlidir.",
      shouldEscalate: false,
      intent: "campaign_info",
      confidence: 0.85,
    };
  }

  if (
    includesAny([
      "nasil siparis",
      "nasıl sipariş",
      "siparis nasil",
      "sipariş nasıl",
      "sepet",
    ])
  ) {
    return {
      text: "Siparis vermek icin urunu sepete ekleyin, sepet sayfasindan adres ve odeme adimlarini tamamlayin. Siparisiniz olustuktan sonra profilinizden durumunu takip edebilirsiniz.",
      shouldEscalate: false,
      intent: "order_how_to",
      confidence: 0.88,
    };
  }

  if (includesAny(["calisma saat", "çalışma saat", "saat kacta", "saat kaçta"])) {
    return {
      text: "Online magazadan her zaman siparis verebilirsiniz. Canli destek uygun temsilci oldugunda yanit verir; detayli islem taleplerinde sizi temsilciye aktarabilirim.",
      shouldEscalate: false,
      intent: "working_hours",
      confidence: 0.78,
    };
  }

  if (includesAny(["tuvalet", "kum", "tasma", "oyuncak", "vitamin", "odul", "ödül"])) {
    return {
      text: "Bu urunlerde petinizin turu, yasi ve ihtiyaci onemli. Kedi kumu icin topaklanan kum, kopek tasmasi icin uygun beden, oyuncaklarda ise yas ve dayaniklilik kriterlerine bakabilirsiniz.",
      shouldEscalate: false,
      intent: "product_advice",
      confidence: 0.78,
    };
  }

  if (
    includesAny([
      "iade",
      "iptal",
      "para",
      "odeme",
      "ödeme",
      "kart",
      "kargo nerede",
      "siparisim nerede",
      "siparişim nerede",
      "eksik",
      "hasarli",
      "hasarlı",
      "bozuk",
      "sikayet",
      "şikayet",
    ])
  ) {
    return {
      text: "Bu konu hesap veya siparis detaylari gerektirebilir. Isterseniz sizi musteri temsilcisine aktarabilirim.",
      shouldEscalate: true,
      intent: "support_needed",
      confidence: 0.8,
    };
  }

  return {
    text: "Bunu genel olarak yardimci olacak sekilde cevaplayabilirim: Petinizin turu, yasi ve ihtiyacina gore urun secmek en dogru yaklasimdir. Bana kedi/kopek/kus/akvaryum ve aradiginiz urun tipini yazarsaniz daha net oneride bulunabilirim.",
    shouldEscalate: false,
    intent: "general_support",
    confidence: 0.65,
  };
}

function getDirectSupportReply(userMessage) {
  const reply = getFallbackReply(userMessage);
  const directIntents = new Set([
    "greeting",
    "campaign_info",
    "order_how_to",
    "working_hours",
    "support_needed",
  ]);

  return directIntents.has(reply.intent) ? reply : null;
}

function getSearchTokens(userMessage) {
  return normalizeText(userMessage)
    .split(/[^a-z0-9ğüşöçıİ]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3)
    .slice(0, 8);
}

function formatPrice(value) {
  const number = Number(value || 0);
  if (Number.isNaN(number) || number <= 0) return null;

  return `${number.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} TL`;
}

function productToContextLine(product) {
  const variant = product.variants?.[0];
  const price = formatPrice(variant?.price);
  const stock =
    product.variants?.reduce((total, item) => total + Number(item.stock || 0), 0) ??
    0;

  return [
    product.name,
    product.petTypeName ? `pet turu: ${product.petTypeName}` : null,
    product.brand?.name ? `marka: ${product.brand.name}` : null,
    product.category?.name ? `kategori: ${product.category.name}` : null,
    variant?.variant_name ? `varyant: ${variant.variant_name}` : null,
    price ? `fiyat: ${price}` : null,
    `stok: ${stock}`,
  ]
    .filter(Boolean)
    .join(" | ");
}

function rankProduct(product, tokens) {
  const haystack = normalizeText(
    [
      product.name,
      product.description,
      product.petTypeName,
      product.brand?.name,
      product.category?.name,
      ...(product.variants || []).map((variant) => variant.variant_name),
    ].join(" "),
  );

  return tokens.reduce((score, token) => {
    return score + (haystack.includes(token) ? 1 : 0);
  }, 0);
}

async function buildStoreContext(userMessage) {
  const tokens = getSearchTokens(userMessage);
  const requestedPetTypes = ["kedi", "kopek", "köpek", "kus", "kuş", "akvaryum", "balik", "balık"]
    .map(normalizeText)
    .filter((petType) => tokens.includes(petType));
  const [categories, brands, petTypes, products] = await Promise.all([
    Category.findAll({ attributes: ["name"], order: [["name", "ASC"]] }),
    Brand.findAll({ attributes: ["name"], order: [["name", "ASC"]] }),
    PetType.findAll({ attributes: ["id", "name"], order: [["name", "ASC"]] }),
    Product.findAll({
      include: [
        { model: Brand, as: "brand", attributes: ["name"] },
        { model: Category, as: "category", attributes: ["name"] },
        {
          model: ProductVariant,
          as: "variants",
          attributes: ["variant_name", "price", "stock", "sku"],
        },
      ],
      limit: 80,
    }),
  ]);
  const petTypeById = petTypes.reduce((map, petType) => {
    map[petType.id] = petType.name;
    return map;
  }, {});

  products.forEach((product) => {
    product.petTypeName = petTypeById[product.pet_type_id] || "";
  });

  const rankedProducts = products
    .map((product) => ({ product, score: rankProduct(product, tokens) }))
    .sort((a, b) => b.score - a.score)
    .filter((item, index) => {
      if (requestedPetTypes.length > 0) {
        const productPetType = normalizeText(item.product.petTypeName);
        return requestedPetTypes.some((petType) => productPetType.includes(petType));
      }

      return item.score > 0 || index < 8;
    })
    .slice(0, 12)
    .map((item) => item.product);

  return {
    categories: categories.map((category) => category.name).slice(0, 30),
    brands: brands.map((brand) => brand.name).slice(0, 30),
    petTypes: petTypes.map((petType) => petType.name).slice(0, 20),
    products: rankedProducts.map(productToContextLine),
  };
}

function contextToText(context) {
  return [
    `Pet turleri: ${context.petTypes.join(", ") || "Kayit yok"}`,
    `Kategoriler: ${context.categories.join(", ") || "Kayit yok"}`,
    `Markalar: ${context.brands.join(", ") || "Kayit yok"}`,
    `Ilgili urunler:\n${
      context.products.length
        ? context.products.map((product) => `- ${product}`).join("\n")
        : "- Eslesen urun bulunamadi"
    }`,
  ].join("\n");
}

function getContextFallbackReply(userMessage, context) {
  if (!context.products.length) {
    return getFallbackReply(userMessage);
  }

  return {
    text: `Magazamizdaki ilgili urunlerden bazilari sunlar:\n${context.products
      .slice(0, 5)
      .map((product) => `- ${product}`)
      .join(
        "\n",
      )}\n\nDilerseniz petinizin yasi, turu ve ihtiyacini yazin; bu liste icinden daha net oneride bulunayim.`,
    shouldEscalate: false,
    intent: "store_product_context",
    confidence: 0.82,
  };
}

async function getRealAiSupportReply(userMessage) {
  const directReply = getDirectSupportReply(userMessage);
  if (directReply) {
    return directReply;
  }

  let storeContext = null;

  try {
    storeContext = await buildStoreContext(userMessage);
  } catch (error) {
    console.error("Magaza context hatasi:", error.message);
  }

  if (!process.env.GEMINI_API_KEY) {
    if (storeContext) {
      return getContextFallbackReply(userMessage, storeContext);
    }

    return getFallbackReply(userMessage);
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      contents: `
        Kullanici mesaji: ${userMessage}

        Magaza verisi:
        ${storeContext ? contextToText(storeContext) : "Magaza verisi okunamadi."}
      `,
      config: {
        systemInstruction: `
          Sen bir petshop e-ticaret sitesinin resmi destek asistanisin.
          Cevap verirken oncelikle "Magaza verisi" bolumundeki gercek kategori, marka ve urunleri kullan.
          Urun sorularinda varsa urun adi, marka, varyant, fiyat ve stok bilgisini soyle.
          Magazada olmayan bir urunu varmis gibi soyleme; yoksa benzer urunleri oner veya bulunamadigini belirt.
          Yardimci olabilecegin konular: pet urunleri, mama/secim tavsiyesi, kampanya bilgileri,
          siparis verme adimlari, teslimat ve iade sureclerinin genel aciklamasi.
          Hesaba ozel islem, canli siparis iptali, odeme itirazi, para iadesi veya detayli sikayet
          gerektiren durumlarda temsilciye aktarma onayi iste.
          Kisa, net ve Turkce cevap ver.
        `,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            shouldEscalate: { type: Type.BOOLEAN },
            intent: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
          },
          required: ["text", "shouldEscalate", "intent", "confidence"],
        },
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini API hatasi:", error.message);
    if (storeContext) {
      return getContextFallbackReply(userMessage, storeContext);
    }

    return getFallbackReply(userMessage);
  }
}

module.exports = { getRealAiSupportReply };
