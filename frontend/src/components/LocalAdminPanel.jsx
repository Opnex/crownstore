import { useEffect, useState } from "react";

const emptyForm = {
  name: "",
  category: "",
  audience: "All Shoppers",
  price: "",
  stock_count: "20",
  description: "",
  image_url: "",
  in_stock: true,
  featured: false,
  badge: "",
  sizes: "",
  colors: ""
};

const ORDER_STATUSES = ["New", "Confirmed", "Paid", "Delivered", "Cancelled"];
const ADMIN_PLACEHOLDER_IMAGE = "https://via.placeholder.com/160x160?text=Crown+Store";

async function compressImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const maxWidth = 800;
        const scale = Math.min(1, maxWidth / image.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        const context = canvas.getContext("2d");

        if (!context) {
          reject(new Error("Canvas is not available."));
          return;
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.68));
      };
      image.onerror = () => reject(new Error("Unable to load the selected image."));
      image.src = typeof reader.result === "string" ? reader.result : "";
    };
    reader.onerror = () => reject(new Error("Unable to read the selected image."));
    reader.readAsDataURL(file);
  });
}

export function LocalAdminPanel({
  products,
  settings,
  orderHistory,
  saveProduct,
  deleteProduct,
  saveSettings,
  updateOrderStatus,
  clearOrderHistory,
  logoutAdmin,
  changeAdminPassword,
  isCloudReady,
  isSupabaseConfigured
}) {
  const [form, setForm] = useState(emptyForm);
  const [settingsForm, setSettingsForm] = useState({
    store_name: settings.store_name,
    logo_text: settings.logo_text,
    whatsapp_number: settings.whatsapp_number,
    contact_email: settings.contact_email,
    contact_phone: settings.contact_phone,
    contact_address: settings.contact_address,
    opening_hours: settings.opening_hours,
    delivery_note: settings.delivery_note,
    payment_note: settings.payment_note,
    hero_title: settings.hero_title,
    hero_subtitle: settings.hero_subtitle
  });
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState("");
  const [settingsStatus, setSettingsStatus] = useState("");
  const [settingsStatusType, setSettingsStatusType] = useState("success");
  const [passwordStatus, setPasswordStatus] = useState("");
  const [passwordStatusType, setPasswordStatusType] = useState("success");
  const [isProductSaving, setIsProductSaving] = useState(false);
  const [isSettingsSaving, setIsSettingsSaving] = useState(false);
  const [adminProductSearch, setAdminProductSearch] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: ""
  });
  const categoryOptions = [
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
    "Others",
    ...new Set(products.map((product) => product.category).filter(Boolean))
  ].filter((category, index, list) => list.indexOf(category) === index);
  const searchedAdminProducts = adminProductSearch
    ? products.filter((product) => {
      const query = adminProductSearch.toLowerCase();
      return (
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.sizes.some((size) => size.toLowerCase().includes(query)) ||
        product.colors.some((color) => color.toLowerCase().includes(query))
      );
    })
    : products;

  useEffect(() => {
    if (editingId && !products.some((product) => product.id === editingId)) {
      resetForm();
    }
  }, [editingId, products]);

  useEffect(() => {
    setSettingsForm({
      store_name: settings.store_name,
      logo_text: settings.logo_text,
      whatsapp_number: settings.whatsapp_number,
      contact_email: settings.contact_email,
      contact_phone: settings.contact_phone,
      contact_address: settings.contact_address,
      opening_hours: settings.opening_hours,
      delivery_note: settings.delivery_note,
      payment_note: settings.payment_note,
      hero_title: settings.hero_title,
      hero_subtitle: settings.hero_subtitle
    });
  }, [settings]);

  useEffect(() => {
    if (!settingsStatus) return;

    const timer = setTimeout(() => {
      setSettingsStatus("");
    }, 5000);

    return () => clearTimeout(timer);
  }, [settingsStatus]);

  useEffect(() => {
    if (!passwordStatus || passwordStatusType === "error") return;

    const timer = setTimeout(() => {
      setPasswordStatus("");
    }, 5000);

    return () => clearTimeout(timer);
  }, [passwordStatus, passwordStatusType]);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  function handleSettingsChange(event) {
    const { name, value } = event.target;
    setSettingsForm((current) => ({ ...current, [name]: value }));
    setSettingsStatus("");
    setSettingsStatusType("success");
  }

  function handlePasswordChange(event) {
    const { name, value } = event.target;
    setPasswordForm((current) => ({ ...current, [name]: value }));
    setPasswordStatus("");
    setPasswordStatusType("success");
  }

  async function handleImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const imageUrl = await compressImageFile(file);
      setForm((current) => ({ ...current, image_url: imageUrl }));
      setStatus(isSupabaseConfigured ? "Image ready for cloud upload." : "Image compressed and saved for this browser.");
    } catch (error) {
      setStatus(error.message);
    }
  }

  function startEdit(product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      category: product.category,
      audience: product.audience,
      price: String(product.price),
      stock_count: String(product.stock_count),
      description: product.description,
      image_url: product.image_preview_url || product.image_url || "",
      image_key: product.image_key || "",
      in_stock: product.in_stock,
      featured: product.featured,
      badge: product.badge || "",
      sizes: product.sizes.join(", "),
      colors: product.colors.join(", ")
    });
    setStatus(`Editing ${product.name}.`);
  }

  function resetForm(nextStatus = "") {
    setEditingId(null);
    setForm(emptyForm);
    setStatus(nextStatus);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsProductSaving(true);

    try {
      await saveProduct(
        {
          ...form,
          price: Number(form.price),
          stock_count: Number(form.stock_count),
          in_stock: form.in_stock && Number(form.stock_count) > 0
        },
        editingId
      );

      resetForm(editingId ? "Product updated and synced." : "Product added and synced.");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIsProductSaving(false);
    }
  }

  async function handleSettingsSubmit(event) {
    event.preventDefault();
    setIsSettingsSaving(true);
    try {
      await saveSettings({
        ...settings,
        ...settingsForm
      });
      setSettingsStatus("Store details saved and synced.");
      setSettingsStatusType("success");
    } catch (error) {
      setSettingsStatus(error.message);
      setSettingsStatusType("error");
    } finally {
      setIsSettingsSaving(false);
    }
  }

  function handlePasswordSubmit(event) {
    event.preventDefault();

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordStatus("New password and confirmation do not match.");
      setPasswordStatusType("error");
      return;
    }

    try {
      changeAdminPassword(passwordForm.current_password, passwordForm.new_password);
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: ""
      });
      setPasswordStatus("Admin password changed successfully.");
      setPasswordStatusType("success");
    } catch (error) {
      setPasswordStatus(error.message);
      setPasswordStatusType("error");
    }
  }

  return (
    <div className="app-shell admin-shell">
      <header className="admin-header">
        <a href="/" className="store-logo">
          <span className="logo-mark">{settings.logo_text}</span>
          <span>{settings.store_name}</span>
        </a>
        <div className="admin-header-actions">
          <button type="button" className="ghost-button admin-link" onClick={logoutAdmin}>Log out</button>
          <a href="/" className="ghost-button admin-link">Back to store</a>
        </div>
      </header>

      <div className="admin-topbar">
        <div>
          <p className="eyebrow">Admin</p>
          <h1 className="admin-title">Store manager</h1>
          <p className="catalog-summary">
            Update your store details, products, stock, and recent WhatsApp orders.
          </p>
          <p className={isCloudReady ? "cloud-status connected" : "cloud-status"}>
            {isSupabaseConfigured
              ? isCloudReady ? "Cloud sync connected" : "Cloud sync is configured but not connected yet"
              : "Cloud sync is not configured. Changes stay on this browser only."}
          </p>
        </div>
      </div>

      <main className="admin-layout">
        <div className="admin-main">
          <section className="panel">
            <div className="section-head">
              <p className="eyebrow">Inventory</p>
              <h2>{editingId ? "Edit product" : "Add a product"}</h2>
            </div>
            <form className="order-form admin-form-grid" onSubmit={handleSubmit}>
              <div className="admin-fieldset full-field">
                <p className="fieldset-title">Basic info</p>
                <div className="admin-form-grid">
                  <input name="name" placeholder="Product name" value={form.name} onChange={handleChange} required />
                  <select name="category" value={form.category} onChange={handleChange} required>
                    <option value="">Select category</option>
                    {categoryOptions.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  <textarea className="full-field" name="description" placeholder="Product description" value={form.description} onChange={handleChange} required />
                </div>
              </div>
              <div className="admin-fieldset full-field">
                <p className="fieldset-title">Pricing and options</p>
                <div className="admin-form-grid">
                  <input name="price" type="number" min="0" placeholder="Price" value={form.price} onChange={handleChange} required />
                  <input name="stock_count" type="number" min="0" placeholder="Stock count" value={form.stock_count} onChange={handleChange} required />
                  <input name="sizes" placeholder="Sizes, comma separated" value={form.sizes} onChange={handleChange} />
                  <input name="colors" placeholder="Colors, comma separated" value={form.colors} onChange={handleChange} />
                  <label className="checkbox-row">
                    <input type="checkbox" name="featured" checked={form.featured} onChange={handleChange} />
                    Mark as featured
                  </label>
                  <label className="checkbox-row">
                    <input type="checkbox" name="in_stock" checked={form.in_stock} onChange={handleChange} />
                    Mark as in stock
                  </label>
                </div>
              </div>
              <div className="admin-fieldset full-field">
                <p className="fieldset-title">Image</p>
                <div className="admin-form-grid">
                  <input type="file" accept="image/*" onChange={handleImageUpload} />
                  <input name="image_url" placeholder="Image URL or uploaded image" value={form.image_url} onChange={handleChange} />
                </div>
              </div>
              <div className="form-actions full-field">
                <button type="submit" disabled={isProductSaving}>
                  {isProductSaving ? "Saving..." : editingId ? "Update product" : "Add product"}
                </button>
                <button type="button" className="ghost-button" onClick={() => resetForm()} disabled={isProductSaving}>
                  Clear
                </button>
              </div>
            </form>
            {form.image_url ? (
              <div className="upload-preview">
                <img src={form.image_url} alt="Preview" />
              </div>
            ) : null}
            {status ? <p className="form-status">{status}</p> : null}
          </section>

          <section className="panel">
            <div className="section-head">
              <p className="eyebrow">Store Details</p>
              <h2>Public page and checkout</h2>
            </div>
            <form className="order-form admin-form-grid" onSubmit={handleSettingsSubmit}>
              <input name="store_name" placeholder="Store name" value={settingsForm.store_name} onChange={handleSettingsChange} required />
              <input name="logo_text" placeholder="Logo text, e.g. CS" value={settingsForm.logo_text} onChange={handleSettingsChange} maxLength="4" required />
              <input name="whatsapp_number" placeholder="WhatsApp number" value={settingsForm.whatsapp_number} onChange={handleSettingsChange} required />
              <input name="contact_phone" placeholder="Public phone number" value={settingsForm.contact_phone} onChange={handleSettingsChange} required />
              <input name="contact_email" type="email" placeholder="Public email address" value={settingsForm.contact_email} onChange={handleSettingsChange} required />
              <input name="opening_hours" placeholder="Opening hours" value={settingsForm.opening_hours} onChange={handleSettingsChange} required />
              <input name="hero_title" placeholder="Hero title" value={settingsForm.hero_title} onChange={handleSettingsChange} required />
              <textarea className="full-field" name="hero_subtitle" placeholder="Hero subtitle" value={settingsForm.hero_subtitle} onChange={handleSettingsChange} required />
              <textarea className="full-field" name="contact_address" placeholder="Contact address" value={settingsForm.contact_address} onChange={handleSettingsChange} required />
              <textarea className="full-field" name="delivery_note" placeholder="Delivery note" value={settingsForm.delivery_note} onChange={handleSettingsChange} required />
              <textarea className="full-field" name="payment_note" placeholder="Payment instruction shown at checkout" value={settingsForm.payment_note} onChange={handleSettingsChange} required />
              <div className="form-actions full-field">
                <button type="submit" disabled={isSettingsSaving}>
                  {isSettingsSaving ? "Saving..." : "Save settings"}
                </button>
              </div>
            </form>
            {settingsStatus ? <p className={`form-status ${settingsStatusType === "error" ? "error-message" : "success-message"}`}>{settingsStatus}</p> : null}
          </section>

          <section className="panel">
            <div className="section-head">
              <p className="eyebrow">Security</p>
              <h2>Change admin password</h2>
              <p className="catalog-summary">
                This password is saved in this browser for the frontend-only admin page.
              </p>
            </div>
            <form className="order-form admin-form-grid" onSubmit={handlePasswordSubmit}>
              <input
                type="password"
                name="current_password"
                placeholder="Current password"
                value={passwordForm.current_password}
                onChange={handlePasswordChange}
                required
              />
              <input
                type="password"
                name="new_password"
                placeholder="New password"
                value={passwordForm.new_password}
                onChange={handlePasswordChange}
                required
              />
              <input
                className="full-field"
                type="password"
                name="confirm_password"
                placeholder="Confirm new password"
                value={passwordForm.confirm_password}
                onChange={handlePasswordChange}
                required
              />
              <div className="form-actions full-field">
                <button type="submit">Update password</button>
              </div>
            </form>
            {passwordStatus ? <p className={`form-status ${passwordStatusType === "error" ? "error-message" : "success-message"}`}>{passwordStatus}</p> : null}
          </section>
        </div>

        <aside className="sidebar admin-sidebar">
          <section className="panel">
            <div className="section-head">
              <p className="eyebrow">Products</p>
              <h2>Catalog list</h2>
            </div>
            <input
              type="search"
              className="search-input admin-search"
              placeholder="Search products, categories, sizes, or colors..."
              value={adminProductSearch}
              onChange={(event) => setAdminProductSearch(event.target.value)}
            />
            <div className="admin-product-list">
              {searchedAdminProducts.map((product) => (
                <article key={product.id} className="admin-product-card">
                  <img
                    className="admin-product-image"
                    src={product.image_preview_url || product.image_url || ADMIN_PLACEHOLDER_IMAGE}
                    alt={product.name}
                    loading="lazy"
                    decoding="async"
                    onError={(event) => {
                      event.currentTarget.src = ADMIN_PLACEHOLDER_IMAGE;
                    }}
                  />
                  <div className="admin-product-info">
                    <div className="order-head">
                      <strong>{product.name}</strong>
                      <span>{product.stock_count} left</span>
                    </div>
                    <p>{product.category}</p>
                    <p>N{product.price.toLocaleString()}{product.featured ? " | Featured" : ""}</p>
                    <div className="form-actions admin-card-actions">
                      <button type="button" onClick={() => startEdit(product)}>
                        Edit
                      </button>
                      <button type="button" className="ghost-button delete-button" onClick={() => deleteProduct(product.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
              {!searchedAdminProducts.length ? (
                <p className="empty">No product matched that search.</p>
              ) : null}
            </div>
          </section>

          <section className="panel">
            <div className="section-head">
              <p className="eyebrow">Order History</p>
              <h2>Recent local checkouts</h2>
            </div>
            {orderHistory.length ? (
              <div className="history-actions">
                <button type="button" className="ghost-button delete-button" onClick={clearOrderHistory}>
                  Clear order history
                </button>
              </div>
            ) : null}
            <div className="orders-list">
              {orderHistory.length ? (
                orderHistory.map((order) => (
                  <article key={order.id} className="order-card">
                    <div className="order-head">
                      <strong>{order.customer_name}</strong>
                      <span>{new Date(order.created_at).toLocaleDateString()}</span>
                    </div>
                    <p>{order.phone}</p>
                    <p>{order.address}</p>
                    <p>N{order.total_amount.toLocaleString()}</p>
                    <div className="order-items">
                      {order.items?.map((item) => (
                        <span key={item.cart_key || `${item.name}-${item.quantity}`}>
                          {item.quantity} x {item.name}{item.variant_label ? ` (${item.variant_label})` : ""}
                        </span>
                      ))}
                    </div>
                    {order.notes ? <p>Note: {order.notes}</p> : null}
                    <select
                      className="status-select"
                      value={order.status || "New"}
                      onChange={(event) => updateOrderStatus(order.id, event.target.value)}
                    >
                      {ORDER_STATUSES.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                    <a className="wa-link" href={order.whatsapp_url} target="_blank" rel="noreferrer">
                      Follow up on WhatsApp
                    </a>
                  </article>
                ))
              ) : (
                <p className="empty">Local order history will appear here after customers start checkout.</p>
              )}
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}
