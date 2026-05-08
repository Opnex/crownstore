const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const PRODUCT_IMAGES_BUCKET = "product-images";
const SETTINGS_ID = "main";
const SETTINGS_COLUMNS = [
  "store_name",
  "logo_text",
  "whatsapp_number",
  "contact_email",
  "contact_phone",
  "contact_address",
  "opening_hours",
  "delivery_note",
  "payment_note",
  "hero_title",
  "hero_subtitle"
];
const REQUEST_TIMEOUT_MS = 12000;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

function getHeaders(extra = {}) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    ...extra
  };
}

function dataUrlToBlob(dataUrl) {
  const [meta, content] = dataUrl.split(",");
  const mime = meta.match(/data:(.*);base64/)?.[1] || "image/jpeg";
  const binary = atob(content);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mime });
}

async function fetchWithRetry(url, options = {}, attempts = 2) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeout);
      return response;
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;
      if (attempt === attempts) break;
    }
  }

  throw lastError;
}

async function request(path, options = {}) {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured.");
  }

  const response = await fetchWithRetry(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: getHeaders(options.headers)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Supabase request failed.");
  }

  if (response.status === 204) return null;
  return response.json();
}

export async function fetchProducts() {
  return request("products?select=*&order=id.desc");
}

export async function upsertProduct(product) {
  const saved = await request("products?on_conflict=id", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=representation"
    },
    body: JSON.stringify(product)
  });

  return saved?.[0] || product;
}

export async function removeProduct(productId) {
  return request(`products?id=eq.${encodeURIComponent(productId)}`, {
    method: "DELETE"
  });
}

export async function uploadProductImage(dataUrl, productId) {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured.");
  }

  const blob = dataUrlToBlob(dataUrl);
  const extension = blob.type.includes("png") ? "png" : "jpg";
  const imagePath = `${productId}-${Date.now()}.${extension}`;
  const response = await fetchWithRetry(`${SUPABASE_URL}/storage/v1/object/${PRODUCT_IMAGES_BUCKET}/${imagePath}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": blob.type,
      "x-upsert": "true"
    },
    body: blob
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 404 && errorText.toLowerCase().includes("bucket")) {
      throw new Error("Supabase Storage bucket 'product-images' was not found. Create it in Supabase Storage before uploading product photos.");
    }
    throw new Error(errorText || "Product image upload failed.");
  }

  return {
    image_key: imagePath,
    image_url: `${SUPABASE_URL}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${imagePath}`,
    image_preview_url: `${SUPABASE_URL}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${imagePath}`
  };
}

export async function fetchSettings() {
  const rows = await request(`store_settings?id=eq.${SETTINGS_ID}&select=*`);
  return rows?.[0] || null;
}

export async function saveSettings(settings) {
  const safeSettings = SETTINGS_COLUMNS.reduce((payload, key) => {
    payload[key] = settings[key] || "";
    return payload;
  }, {});

  const rows = await request("store_settings?on_conflict=id", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=representation"
    },
    body: JSON.stringify({
      id: SETTINGS_ID,
      ...safeSettings
    })
  });

  return rows?.[0] || settings;
}

export async function fetchOrders() {
  return request("orders?select=*&order=created_at.desc");
}

export async function upsertOrder(order) {
  const rows = await request("orders?on_conflict=id", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=representation"
    },
    body: JSON.stringify(order)
  });

  return rows?.[0] || order;
}

export async function clearOrders() {
  return request("orders?id=not.is.null", {
    method: "DELETE"
  });
}
