import { useEffect, useState } from "react";
import { Hero } from "./components/Hero";
import { LocalAdminPanel } from "./components/LocalAdminPanel";
import { ProductGrid } from "./components/ProductGrid";
import { OrderForm } from "./components/OrderForm";
import { productsData } from "./data/products";
import * as cloudStore from "./lib/supabaseStore";

const DEFAULT_WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || "2347070488972";
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "crownadmin";
const PRODUCTS_STORAGE_KEY = "crown-store-products";
const CART_STORAGE_KEY = "crown-store-cart";
const THEME_STORAGE_KEY = "crown-theme";
const STORE_SETTINGS_KEY = "crown-store-settings";
const ORDER_HISTORY_STORAGE_KEY = "crown-store-order-history";
const ADMIN_SESSION_KEY = "crown-store-admin-session";
const ADMIN_PASSWORD_STORAGE_KEY = "crown-store-admin-password";
const IMAGE_DB_NAME = "crown-store-images";
const IMAGE_STORE_NAME = "product-images";
const STORE_CATEGORIES = [
  "Men's Jean",
  "Ladies Jean",
  "Ladies Top",
  "Men's Top",
  "Men's Short",
  "Ladies Short Skirt",
  "Men's  Joggers",
  "Ladies Up And Down",
  "Men’s Up And Down",
  "Ladies Night Wear",
  "Children Underwear",
  "Trousers",
  "Roundneck",
  "Polo",
  "Cap",
  "Men's Under Wears",
  "Ladies Under Wears",
  "Gown",
  "Others"
];
const PLACEHOLDER_IMAGE = "https://via.placeholder.com/800x600?text=Crown+Store";

const defaultStoreSettings = {
  store_name: "Crown Store",
  logo_text: "CS",
  whatsapp_number: DEFAULT_WHATSAPP_NUMBER,
  contact_email: "orders@crownstore.com",
  contact_phone: "+234 707 048 8972",
  contact_address: "Lagos, Nigeria",
  opening_hours: "Monday - Saturday, 9:00 AM - 7:00 PM",
  delivery_note: "Delivery fee depends on your location and order size.",
  payment_note: "Payment is completed on WhatsApp after we confirm stock and delivery fee. We will send bank transfer details or a payment link before dispatch.",
  hero_title: "Elevate Your Style.",
  hero_subtitle: "Discover premium wears for men, women, kids, and bulk orders. Build your cart and complete your order on WhatsApp in minutes."
};

function normalizeWhatsAppNumber(value) {
  const digits = String(value || "").replace(/\D/g, "");

  if (!digits) return "";
  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0")) return `234${digits.slice(1)}`;
  return digits;
}

function normalizeTextArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeProduct(product, fallbackId) {
  const normalized = {
    id: product.id ?? fallbackId,
    name: product.name || "Untitled Product",
    category: product.category || "General",
    audience: product.audience || "All Shoppers",
    price: Number(product.price) || 0,
    in_stock: product.in_stock ?? Number(product.stock_count) > 0,
    stock_count: Math.max(0, Number(product.stock_count) || 0),
    image_url: product.image_url || "",
    image_key: product.image_key || "",
    image_preview_url: product.image_preview_url || "",
    description: product.description || "",
    featured: Boolean(product.featured),
    badge: product.badge || "",
    sizes: normalizeTextArray(product.sizes),
    colors: normalizeTextArray(product.colors)
  };

  normalized.in_stock = normalized.in_stock && normalized.stock_count > 0;
  return normalized;
}

function normalizeSettings(settings = {}) {
  return {
    ...defaultStoreSettings,
    ...settings,
    whatsapp_number: normalizeWhatsAppNumber(settings.whatsapp_number || defaultStoreSettings.whatsapp_number)
  };
}

function cloneStarterProducts() {
  return productsData.map((product, index) => normalizeProduct(product, index + 1));
}

function loadStoredProducts() {
  const stored = localStorage.getItem(PRODUCTS_STORAGE_KEY);
  if (!stored) return cloneStarterProducts();

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) && parsed.length
      ? parsed.map((product, index) => normalizeProduct(product, index + 1))
      : cloneStarterProducts();
  } catch {
    return cloneStarterProducts();
  }
}

function loadStoredCart() {
  const stored = localStorage.getItem(CART_STORAGE_KEY);
  if (!stored) return [];

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadStoredSettings() {
  const stored = localStorage.getItem(STORE_SETTINGS_KEY);
  if (!stored) return normalizeSettings(defaultStoreSettings);

  try {
    return normalizeSettings(JSON.parse(stored));
  } catch {
    return normalizeSettings(defaultStoreSettings);
  }
}

function loadStoredOrderHistory() {
  const stored = localStorage.getItem(ORDER_HISTORY_STORAGE_KEY);
  if (!stored) return [];

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadAdminSession() {
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === "active";
}

function getAdminPassword() {
  return localStorage.getItem(ADMIN_PASSWORD_STORAGE_KEY) || ADMIN_PASSWORD;
}

function buildCartKey(productId, size, color) {
  return `${productId}::${size || "default-size"}::${color || "default-color"}`;
}

function sortProducts(list, sortOrder) {
  const sorted = [...list];
  switch (sortOrder) {
    case "price-asc":
      return sorted.sort((a, b) => a.price - b.price);
    case "price-desc":
      return sorted.sort((a, b) => b.price - a.price);
    case "name-asc":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "newest":
      return sorted.sort((a, b) => b.id - a.id);
    case "stock-desc":
      return sorted.sort((a, b) => b.stock_count - a.stock_count);
    case "featured":
    default:
      return sorted.sort((a, b) => {
        if (Number(b.featured) !== Number(a.featured)) {
          return Number(b.featured) - Number(a.featured);
        }
        return b.id - a.id;
      });
  }
}

function getFeaturedProducts(products) {
  const featured = products.filter((product) => product.featured);
  return (featured.length ? featured : products).slice(0, 3);
}

function isDataImage(value) {
  return typeof value === "string" && value.startsWith("data:image/");
}

function serializeProducts(products) {
  return products.map(({ image_preview_url, ...product }) => ({
    ...product,
    image_url: isDataImage(product.image_url) ? "" : product.image_url
  }));
}

function serializeProductForCloud(product) {
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    audience: product.audience,
    price: Number(product.price) || 0,
    in_stock: Boolean(product.in_stock),
    stock_count: Math.max(0, Number(product.stock_count) || 0),
    image_url: product.image_url || "",
    image_key: product.image_key || "",
    image_preview_url: product.image_preview_url || "",
    description: product.description || "",
    featured: Boolean(product.featured),
    badge: product.badge || "",
    sizes: normalizeTextArray(product.sizes),
    colors: normalizeTextArray(product.colors)
  };
}

function saveToStorage(key, value) {
  const safeValue = key === PRODUCTS_STORAGE_KEY ? serializeProducts(value) : value;
  localStorage.setItem(key, JSON.stringify(safeValue));
}

function getStorageErrorMessage(error) {
  if (error?.name === "QuotaExceededError" || error?.code === 22) {
    return "Browser storage is full. Try using a smaller product image, remove old products, or export a backup before clearing space.";
  }
  return "Unable to save this update in the browser.";
}

function openImageDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IMAGE_DB_NAME, 1);

    request.onupgradeneeded = () => {
      request.result.createObjectStore(IMAGE_STORE_NAME);
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveProductImage(imageKey, dataUrl) {
  const db = await openImageDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(IMAGE_STORE_NAME, "readwrite");
    transaction.objectStore(IMAGE_STORE_NAME).put(dataUrl, imageKey);
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

async function getProductImage(imageKey) {
  const db = await openImageDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(IMAGE_STORE_NAME, "readonly");
    const request = transaction.objectStore(IMAGE_STORE_NAME).get(imageKey);
    request.onsuccess = () => resolve(request.result || "");
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
  });
}

async function deleteProductImage(imageKey) {
  if (!imageKey) return;
  const db = await openImageDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(IMAGE_STORE_NAME, "readwrite");
    transaction.objectStore(IMAGE_STORE_NAME).delete(imageKey);
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

export default function App() {
  const [products, setProducts] = useState(loadStoredProducts);
  const [cart, setCart] = useState(loadStoredCart);
  const [storeSettings, setStoreSettings] = useState(loadStoredSettings);
  const [orderHistory, setOrderHistory] = useState(loadStoredOrderHistory);
  const [message, setMessage] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("featured");
  const [lastOrder, setLastOrder] = useState(null);
  const [isAdminAuthed, setIsAdminAuthed] = useState(loadAdminSession);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem(THEME_STORAGE_KEY) === "dark");
  const [toasts, setToasts] = useState([]);
  const [isCloudReady, setIsCloudReady] = useState(false);
  const isAdminPath = window.location.pathname.startsWith("/admin");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDarkMode ? "dark" : "light");
    localStorage.setItem(THEME_STORAGE_KEY, isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    try {
      saveToStorage(PRODUCTS_STORAGE_KEY, products);
    } catch (error) {
      setMessage(getStorageErrorMessage(error));
    }
  }, [products]);

  useEffect(() => {
    if (!cloudStore.isSupabaseConfigured) return;

    let isMounted = true;

    async function loadCloudStore() {
      const [productsResult, settingsResult, ordersResult] = await Promise.allSettled([
        cloudStore.fetchProducts(),
        cloudStore.fetchSettings(),
        cloudStore.fetchOrders()
      ]);

      if (!isMounted) return;

      if (productsResult.status === "fulfilled" && Array.isArray(productsResult.value) && productsResult.value.length) {
        setProducts(productsResult.value.map((product, index) => normalizeProduct(product, index + 1)));
      }
      if (settingsResult.status === "fulfilled" && settingsResult.value) {
        setStoreSettings(normalizeSettings(settingsResult.value));
      }
      if (ordersResult.status === "fulfilled" && Array.isArray(ordersResult.value)) {
        setOrderHistory(ordersResult.value);
      }

      if (productsResult.status === "fulfilled" || settingsResult.status === "fulfilled") {
        setIsCloudReady(true);
      } else {
        setIsCloudReady(false);
        setMessage("Cloud store is slow or unavailable right now. Showing saved local data while it reconnects.");
      }
    }

    loadCloudStore();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function hydrateProductImages() {
      const hydratedProducts = await Promise.all(
        products.map(async (product) => {
          if (product.image_preview_url) return product;

          if (isDataImage(product.image_url)) {
            const imageKey = product.image_key || `product-image-${product.id}`;
            await saveProductImage(imageKey, product.image_url);
            return {
              ...product,
              image_key: imageKey,
              image_preview_url: product.image_url,
              image_url: ""
            };
          }

          if (product.image_key) {
            const imagePreviewUrl = await getProductImage(product.image_key);
            return imagePreviewUrl ? { ...product, image_preview_url: imagePreviewUrl } : product;
          }

          return product;
        })
      );

      if (!isMounted) return;

      const changed = hydratedProducts.some((product, index) => product !== products[index]);
      if (changed) {
        setProducts(hydratedProducts);
      }
    }

    hydrateProductImages().catch(() => {
      setMessage("Some saved product images could not be loaded from this browser.");
    });

    return () => {
      isMounted = false;
    };
  }, [products]);

  useEffect(() => {
    try {
      saveToStorage(CART_STORAGE_KEY, cart);
    } catch (error) {
      setMessage(getStorageErrorMessage(error));
    }
  }, [cart]);

  useEffect(() => {
    try {
      saveToStorage(STORE_SETTINGS_KEY, storeSettings);
    } catch (error) {
      setMessage(getStorageErrorMessage(error));
    }
  }, [storeSettings]);

  useEffect(() => {
    try {
      saveToStorage(ORDER_HISTORY_STORAGE_KEY, orderHistory);
    } catch (error) {
      setMessage(getStorageErrorMessage(error));
    }
  }, [orderHistory]);

  function addToast(text) {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, text }]);
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4000);
  }

  const categoryFilters = [
    "All",
    ...STORE_CATEGORIES
  ];

  function addToCart(product, selection = {}) {
    const size = selection.size || product.sizes[0] || "";
    const color = selection.color || product.colors[0] || "";
    const cartKey = buildCartKey(product.id, size, color);
    const itemInCart = cart.find((item) => item.cart_key === cartKey);
    const nextQuantity = itemInCart ? itemInCart.quantity + 1 : 1;

    if (nextQuantity > product.stock_count) {
      addToast(`Only ${product.stock_count} unit${product.stock_count === 1 ? "" : "s"} available for ${product.name}.`);
      return;
    }

    const variantLabel = [size ? `Size ${size}` : "", color || ""].filter(Boolean).join(" / ");

    setCart((current) => {
      const existing = current.find((item) => item.cart_key === cartKey);
      if (existing) {
        return current.map((item) =>
          item.cart_key === cartKey ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...current,
        {
          cart_key: cartKey,
          product_id: product.id,
          name: product.name,
          quantity: 1,
          price: product.price,
          size,
          color,
          variant_label: variantLabel
        }
      ];
    });

    setMessage("");
    setLastOrder(null);
    addToast(`Added ${product.name}${variantLabel ? ` (${variantLabel})` : ""} to order.`);
  }

  function updateCart(cartKey, quantity) {
    const item = cart.find((entry) => entry.cart_key === cartKey);
    if (!item) return;

    const product = products.find((productItem) => productItem.id === item.product_id);
    if (!product) return;

    const safeQuantity = Math.max(0, Math.min(quantity, product.stock_count));
    setCart((current) =>
      current
        .map((entry) => (entry.cart_key === cartKey ? { ...entry, quantity: safeQuantity } : entry))
        .filter((entry) => entry.quantity > 0)
    );
  }

  function buildWhatsAppUrl(order) {
    const lines = [
      `Hello ${storeSettings.store_name}!`,
      "",
      "I want to place this order:",
      `Name: ${order.customer_name}`,
      `Phone: ${order.phone}`,
      `Address: ${order.address}`,
      ""
    ];

    order.items.forEach((item, index) => {
      lines.push(`${index + 1}. ${item.name}${item.variant_label ? ` (${item.variant_label})` : ""}`);
      lines.push(`   Qty: ${item.quantity} x N${item.price.toLocaleString()} = N${(item.quantity * item.price).toLocaleString()}`);
    });

    lines.push("");
    lines.push(`Subtotal: N${order.total_amount.toLocaleString()}`);
    if (order.notes) {
      lines.push(`Notes: ${order.notes}`);
    }
    lines.push(`Delivery Note: ${storeSettings.delivery_note}`);
    lines.push(`Payment: ${storeSettings.payment_note}`);

    return `https://wa.me/${normalizeWhatsAppNumber(storeSettings.whatsapp_number)}?text=${encodeURIComponent(lines.join("\n"))}`;
  }

  async function submitOrder(customer) {
    if (!cart.length) {
      throw new Error("Add at least one product to the order.");
    }

    const totalAmount = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const order = {
      id: Date.now(),
      customer_name: customer.customer_name,
      phone: customer.phone,
      address: customer.address,
      notes: customer.notes,
      total_amount: totalAmount,
      created_at: new Date().toISOString(),
      status: "New",
      items: cart.map((item) => ({ ...item }))
    };

    order.whatsapp_url = buildWhatsAppUrl(order);
    window.open(order.whatsapp_url, "_blank", "noopener,noreferrer");

    const nextProducts = products.map((product) => {
        const totalSelected = cart
          .filter((item) => item.product_id === product.id)
          .reduce((sum, item) => sum + item.quantity, 0);

        if (!totalSelected) return product;

        const nextStock = Math.max(product.stock_count - totalSelected, 0);
        return {
          ...product,
          stock_count: nextStock,
          in_stock: nextStock > 0
        };
      });

    if (cloudStore.isSupabaseConfigured) {
      try {
        await Promise.all([
          cloudStore.upsertOrder(order),
          ...nextProducts
            .filter((product) => products.some((current) => current.id === product.id && current.stock_count !== product.stock_count))
            .map((product) => cloudStore.upsertProduct(serializeProductForCloud(product)))
        ]);
      } catch (error) {
        throw new Error("Order was prepared, but cloud stock/order history could not be updated.");
      }
    }

    setProducts(nextProducts);
    setOrderHistory((current) => [order, ...current]);
    setCart([]);
    setIsCartOpen(false);
    setLastOrder(order);
    setMessage("WhatsApp checkout is ready. Review the message and send it to complete the order.");
    addToast("WhatsApp opened with your order summary.");
    return order;
  }

  async function saveProduct(payload, editingId) {
    const nextId = editingId || (products.length ? Math.max(...products.map((product) => product.id)) + 1 : 1);
    const imageKey = `product-image-${nextId}`;
    const shouldStoreImage = isDataImage(payload.image_url);
    let cloudImage = null;
    let imageUploadWarning = "";

    if (shouldStoreImage && cloudStore.isSupabaseConfigured) {
      try {
        cloudImage = await cloudStore.uploadProductImage(payload.image_url, nextId);
      } catch (error) {
        imageUploadWarning = error.message;
      }
    }

    const normalizedPayload = normalizeProduct(
      {
        ...payload,
        id: nextId,
        image_key: cloudImage?.image_key || (shouldStoreImage ? imageKey : payload.image_key || ""),
        image_preview_url: cloudImage?.image_preview_url || (shouldStoreImage ? payload.image_url : payload.image_preview_url || ""),
        image_url: cloudImage?.image_url || (shouldStoreImage ? "" : payload.image_url)
      },
      nextId
    );

    if (shouldStoreImage && !cloudImage) {
      try {
        await saveProductImage(imageKey, payload.image_url);
      } catch (error) {
        throw new Error(getStorageErrorMessage(error));
      }
    }

    const cloudPayload = serializeProductForCloud(normalizedPayload);
    const savedProduct = cloudStore.isSupabaseConfigured
      ? normalizeProduct(await cloudStore.upsertProduct(cloudPayload), nextId)
      : normalizedPayload;

    const nextProducts = editingId
      ? products.map((product) =>
        product.id === editingId ? { ...product, ...savedProduct, id: editingId } : product
      )
      : [
        {
          ...savedProduct,
          id: nextId
        },
        ...products
      ];

    try {
      saveToStorage(PRODUCTS_STORAGE_KEY, nextProducts);
    } catch (error) {
      throw new Error(getStorageErrorMessage(error));
    }

    setProducts(nextProducts);
    setMessage(
      imageUploadWarning
        ? `${editingId ? "Product updated" : "New product added"}, but image upload failed: ${imageUploadWarning}`
        : editingId ? "Product updated." : "New product added."
    );
  }

  async function deleteProduct(productId) {
    if (!window.confirm("Delete this product from the local catalog?")) return;

    const deletedProduct = products.find((product) => product.id === productId);
    if (deletedProduct?.image_key) {
      deleteProductImage(deletedProduct.image_key).catch(() => {});
    }

    if (cloudStore.isSupabaseConfigured) {
      await cloudStore.removeProduct(productId);
    }

    setProducts((current) => current.filter((product) => product.id !== productId));
    setCart((current) => current.filter((item) => item.product_id !== productId));
    setMessage("Product removed from the catalog.");
  }

  async function saveSettings(nextSettings) {
    const normalizedSettings = normalizeSettings(nextSettings);
    const savedSettings = cloudStore.isSupabaseConfigured
      ? normalizeSettings(await cloudStore.saveSettings(normalizedSettings))
      : normalizedSettings;
    setStoreSettings(savedSettings);
    setMessage("Store settings updated.");
  }

  function loginAdmin(password) {
    if (password !== getAdminPassword()) {
      throw new Error("Incorrect admin password.");
    }
    sessionStorage.setItem(ADMIN_SESSION_KEY, "active");
    setIsAdminAuthed(true);
  }

  function changeAdminPassword(currentPassword, nextPassword) {
    if (currentPassword !== getAdminPassword()) {
      throw new Error("Current password is incorrect.");
    }
    if (nextPassword.length < 6) {
      throw new Error("New password must be at least 6 characters.");
    }
    localStorage.setItem(ADMIN_PASSWORD_STORAGE_KEY, nextPassword);
    setMessage("Admin password changed locally.");
  }

  function logoutAdmin() {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setIsAdminAuthed(false);
  }

  async function updateOrderStatus(orderId, status) {
    const updatedOrder = orderHistory.find((order) => order.id === orderId);
    const nextOrder = updatedOrder ? { ...updatedOrder, status } : null;

    if (cloudStore.isSupabaseConfigured && nextOrder) {
      await cloudStore.upsertOrder(nextOrder);
    }

    setOrderHistory((current) =>
      current.map((order) => (order.id === orderId ? { ...order, status } : order))
    );
    setMessage("Order status updated.");
  }

  async function clearOrderHistory() {
    if (!window.confirm("Clear the local order history in this browser?")) return;
    if (cloudStore.isSupabaseConfigured) {
      await cloudStore.clearOrders();
    }
    setOrderHistory([]);
    setMessage("Order history cleared.");
  }

  const filteredProducts = activeFilter === "All"
    ? products
    : products.filter((product) => {
      const filter = activeFilter.toLowerCase();
      return product.category.toLowerCase().includes(filter);
    });

  const searchedProducts = searchQuery
    ? filteredProducts.filter((product) => {
      const query = searchQuery.toLowerCase();
      return (
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        product.audience.toLowerCase().includes(query) ||
        product.badge.toLowerCase().includes(query) ||
        product.sizes.some((size) => size.toLowerCase().includes(query)) ||
        product.colors.some((color) => color.toLowerCase().includes(query))
      );
    })
    : filteredProducts;

  const displayedProducts = sortProducts(searchedProducts, sortOrder);
  const featuredProducts = getFeaturedProducts(products);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (isAdminPath) {
    if (!isAdminAuthed) {
      return (
        <AdminLogin
          storeSettings={storeSettings}
          loginAdmin={loginAdmin}
        />
      );
    }

    return (
      <LocalAdminPanel
        products={products}
        settings={storeSettings}
        orderHistory={orderHistory}
        saveProduct={saveProduct}
        deleteProduct={deleteProduct}
        saveSettings={saveSettings}
        updateOrderStatus={updateOrderStatus}
        clearOrderHistory={clearOrderHistory}
        logoutAdmin={logoutAdmin}
        changeAdminPassword={changeAdminPassword}
        isCloudReady={isCloudReady}
        isSupabaseConfigured={cloudStore.isSupabaseConfigured}
      />
    );
  }

  return (
    <div className="app-shell">
      <header className="store-header">
        <a href="/" className="store-logo">
          <span className="logo-mark">{storeSettings.logo_text}</span>
          <span>{storeSettings.store_name}</span>
        </a>
        <nav className="store-nav" aria-label="Store navigation">
          <a href="#store-catalog">Shop</a>
          <a href="#order-bag" onClick={() => setIsCartOpen(true)}>Order</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <Hero settings={storeSettings} />
      {message ? <p className="banner banner-accent">{message}</p> : null}

      <section className="featured-band" aria-labelledby="featured-title">
        <div className="section-head">
          <p className="eyebrow">Featured</p>
          <h2 id="featured-title">Fresh picks from the store</h2>
        </div>
        <div className="featured-strip">
          {featuredProducts.map((product) => (
            <a key={product.id} href={`#product-${product.id}`} className="featured-item">
              <img
                src={product.image_preview_url || product.image_url || "https://via.placeholder.com/180x180?text=Crown+Store"}
                alt={product.name}
                loading="lazy"
                decoding="async"
                onError={(event) => {
                  event.currentTarget.src = PLACEHOLDER_IMAGE;
                }}
              />
              <span>{product.name}</span>
              <strong>N{product.price.toLocaleString()}</strong>
            </a>
          ))}
        </div>
      </section>

      <main className="layout">
        <section id="store-catalog">
          <div className="section-head">
            <p className="eyebrow">Available Stock</p>
            <h2>Simple picks for everyday style</h2>
            <p className="catalog-summary">
              Browse {displayedProducts.length} product{displayedProducts.length === 1 ? "" : "s"}
              {activeFilter !== "All" ? ` in ${activeFilter}.` : "."}
            </p>
            <div className="toolbar">
              <div className="category-filters">
                {categoryFilters.map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveFilter(category)}
                    className={activeFilter === category ? "filter-chip active" : "ghost-button filter-chip"}
                  >
                    {category}
                  </button>
                ))}
              </div>
              <div className="catalog-tools">
                <select className="sort-select" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
                  <option value="featured">Featured first</option>
                  <option value="newest">Newest</option>
                  <option value="price-asc">Price: Low to high</option>
                  <option value="price-desc">Price: High to low</option>
                  <option value="name-asc">Name: A to Z</option>
                  <option value="stock-desc">Stock: High to low</option>
                </select>
              </div>
            </div>
            <input
              type="search"
              className="search-input"
              placeholder="Search for Men's Jeans, Ladies Jeans, gowns, polos, sizes, or colors..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>

          {displayedProducts.length > 0 ? (
            <ProductGrid
              products={displayedProducts}
              addToCart={addToCart}
            />
          ) : (
            <p className="empty empty-results">
              No products matched this filter or search yet. Try a different category or a broader keyword.
            </p>
          )}
        </section>

        <aside className={isCartOpen ? "sidebar order-sidebar mobile-cart-open" : "sidebar order-sidebar"} id="order-bag">
          <OrderForm
            cart={cart}
            updateCart={updateCart}
            submitOrder={submitOrder}
            lastOrder={lastOrder}
            storeSettings={storeSettings}
          />
        </aside>
      </main>

      <ContactSection settings={storeSettings} />

      <footer className="store-footer">
        <a href="/admin" className="store-footer-link">Shop with Crown</a>
      </footer>

      <a className="floating-whatsapp" href={`https://wa.me/${normalizeWhatsAppNumber(storeSettings.whatsapp_number)}`} target="_blank" rel="noreferrer">
        WhatsApp
      </a>

      <button className="mobile-cart-button" onClick={() => setIsCartOpen((current) => !current)} aria-expanded={isCartOpen} aria-controls="order-bag">
        {isCartOpen ? "Close order" : `Order bag (${cartCount})`}
      </button>

      <button className="theme-toggle" onClick={() => setIsDarkMode(!isDarkMode)} aria-label="Toggle color theme">
        {isDarkMode ? "Light" : "Dark"}
      </button>

      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className="toast">{toast.text}</div>
        ))}
      </div>
    </div>
  );
}

function AdminLogin({ storeSettings, loginAdmin }) {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    try {
      loginAdmin(password);
    } catch (error) {
      setStatus(error.message);
    }
  }

  return (
    <div className="app-shell admin-shell login-shell">
      <section className="panel login-panel">
        <a href="/" className="store-logo login-logo">
          <span className="logo-mark">{storeSettings.logo_text}</span>
          <span>{storeSettings.store_name}</span>
        </a>
        <div className="section-head">
          <p className="eyebrow">Admin Login</p>
          <h1 className="admin-title">Private store manager</h1>
          <p className="catalog-summary">Enter the admin password to edit products, settings, and orders.</p>
          <p className="catalog-summary">
            If you forget it, reset it from the app environment or remove the saved admin password from this browser.
          </p>
        </div>
        <form className="order-form" onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Admin password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoFocus
            required
          />
          <button type="submit">Unlock admin</button>
          <a href="/" className="ghost-button login-back">Back to store</a>
        </form>
        {status ? <p className="form-status status-block">{status}</p> : null}
      </section>
    </div>
  );
}

function ContactSection({ settings }) {
  const phoneHref = String(settings.contact_phone || "").replace(/[^\d+]/g, "");

  return (
    <section className="contact-section" id="contact">
      <div className="contact-copy">
        <p className="eyebrow">Contact</p>
        <h2>Reach Crown Store</h2>
        <p>Ask about sizing, delivery fee, pickup, bulk orders, or payment confirmation.</p>
      </div>
      <div className="contact-grid">
        <a href={`tel:${phoneHref}`} className="contact-card">
          <span>Phone</span>
          <strong>{settings.contact_phone}</strong>
        </a>
        <a href={`mailto:${settings.contact_email}`} className="contact-card">
          <span>Email</span>
          <strong>{settings.contact_email}</strong>
        </a>
        <div className="contact-card">
          <span>Address</span>
          <strong>{settings.contact_address}</strong>
        </div>
        <div className="contact-card">
          <span>Hours</span>
          <strong>{settings.opening_hours}</strong>
        </div>
      </div>
    </section>
  );
}
