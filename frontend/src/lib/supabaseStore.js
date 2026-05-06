const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const SETTINGS_ID = "main";

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

function getHeaders(extra = {}) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    ...extra
  };
}

async function request(path, options = {}) {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured.");
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
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

export async function fetchSettings() {
  const rows = await request(`store_settings?id=eq.${SETTINGS_ID}&select=*`);
  return rows?.[0] || null;
}

export async function saveSettings(settings) {
  const rows = await request("store_settings?on_conflict=id", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=representation"
    },
    body: JSON.stringify({
      id: SETTINGS_ID,
      ...settings
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
