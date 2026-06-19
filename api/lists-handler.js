import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "../backend/lib/supabase-admin.js";

const VALID_CATEGORIES = new Set([
  "movie", "tv", "anime", "game", "book", "music",
  "fashion", "food", "travel", "car", "sport"
]);

const VALID_LIST_TYPES = new Set(["favorites", "completed", "watchlist", "custom"]);

const EXTERNAL_SOURCES = {
  movie: "tmdb", tv: "tmdb", anime: "tmdb", game: "igdb",
  book: "openlibrary", music: "spotify", travel: "local_db",
  fashion: "local_db", food: "local_db", car: "local_db", sport: "sportsdb"
};

function parsePath(query) {
  const raw = String(query?.path || "").split("/").filter(Boolean);
  return raw;
}

function jsonResponse(res, status, body) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.setHeader("Pragma", "no-cache");
  return res.status(status).json(body);
}

async function resolveUserId(req) {
  const authHeader = String(req.headers["authorization"] || "").trim();
  if (!authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  try {
    const client = await getAuthenticatedClient(req);
    const { data, error } = await client.auth.getUser(token);
    if (error || !data?.user?.id) return null;
    return data.user.id;
  } catch (err) {
    console.error("resolveUserId error:", err);
    return null;
  }
}

async function getAuthenticatedClient(req) {
  const url = String(process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_REF || "").trim();
  let anonKey = String(
    process.env.SUPABASE_ANON_KEY || 
    process.env.SUPABASE_KEY || 
    process.env.SUPABASE_SERVICE_ROLE_KEY || 
    process.env.SUPABASE_SERVICE_KEY || 
    ""
  ).trim();

  let formattedUrl = url;
  if (formattedUrl && !/^https?:\/\//i.test(formattedUrl)) {
    if (/^[a-z0-9]{20}$/i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}.supabase.co`;
    } else if (/supabase\.co/i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }
  }

  if (!formattedUrl || !anonKey) {
    // If running in an environment without env vars, fallback to the hardcoded anon key
    formattedUrl = "https://gfkhjbztayjyojsgdpgk.supabase.co";
    anonKey = "sb_publishable_Rw-VlOLSWfzsycF4JMFUvg_vNlaMwVd";
  }

  const authHeader = String(req.headers["authorization"] || "").trim();
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  return createClient(formattedUrl, anonKey, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    },
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

// ============================================================================
// GET /api/lists?category=X
// Returns all lists (default + custom) for a user in a category
// ============================================================================

async function handleGetLists(req, res) {
  const userId = await resolveUserId(req);
  if (!userId) return jsonResponse(res, 401, { success: false, message: "Unauthorized" });

  let category = String(req.query?.category || "").toLowerCase().trim();
  if (category === "sports") category = "sport";

  if (!category || !VALID_CATEGORIES.has(category)) {
    return jsonResponse(res, 400, { success: false, message: "Invalid category" });
  }

  const admin = await getAuthenticatedClient(req);
  try {
    const { data, error } = await admin.rpc("get_user_lists", {
      p_user_id: userId,
      p_category: category
    });
    if (error) return jsonResponse(res, 500, { success: false, message: error.message });
    return jsonResponse(res, 200, { success: true, lists: data || [] });
  } catch (err) {
    return jsonResponse(res, 500, { success: false, message: String(err.message || err) });
  }
}

// ============================================================================
// POST /api/lists
// Create a custom list
// Body: { category, name, icon?, description? }
// ============================================================================

async function handleCreateList(req, res) {
  const userId = await resolveUserId(req);
  if (!userId) return jsonResponse(res, 401, { success: false, message: "Unauthorized" });

  const body = req.body || {};
  let category = String(body.category || "").toLowerCase().trim();
  if (category === "sports") category = "sport";
  const name = String(body.name || "").trim();

  if (!category || !VALID_CATEGORIES.has(category)) {
    return jsonResponse(res, 400, { success: false, message: "Invalid category" });
  }
  if (!name || name.length < 1 || name.length > 100) {
    return jsonResponse(res, 400, { success: false, message: "List name must be 1-100 characters" });
  }

  const admin = await getAuthenticatedClient(req);
  try {
    const { data, error } = await admin
      .from("user_lists")
      .insert({
        user_id: userId,
        name: name,
        category: category,
        type: "custom",
        icon: body.icon || "fas fa-list",
        description: body.description || ""
      })
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505") {
        return jsonResponse(res, 409, { success: false, message: "A list with that name already exists" });
      }
      return jsonResponse(res, 500, { success: false, message: error.message });
    }

    return jsonResponse(res, 201, { success: true, list: data });
  } catch (err) {
    return jsonResponse(res, 500, { success: false, message: String(err.message || err) });
  }
}

// ============================================================================
// PUT /api/lists/:id
// Update a custom list
// Body: { name?, icon?, description? }
// ============================================================================

async function handleUpdateList(req, res) {
  const userId = await resolveUserId(req);
  if (!userId) return jsonResponse(res, 401, { success: false, message: "Unauthorized" });

  const pathParts = parsePath(req.query);
  const listId = pathParts[1];
  if (!listId) return jsonResponse(res, 400, { success: false, message: "List ID required" });

  const body = req.body || {};
  const updates = {};
  if (body.name !== undefined) updates.name = String(body.name).trim();
  if (body.icon !== undefined) updates.icon = String(body.icon).trim();
  if (body.description !== undefined) updates.description = String(body.description).trim();

  const admin = await getAuthenticatedClient(req);
  try {
    const { data, error } = await admin
      .from("user_lists")
      .update(updates)
      .eq("id", listId)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error) {
      if (error.code === "PGRST116") return jsonResponse(res, 404, { success: false, message: "List not found" });
      return jsonResponse(res, 500, { success: false, message: error.message });
    }

    return jsonResponse(res, 200, { success: true, list: data });
  } catch (err) {
    return jsonResponse(res, 500, { success: false, message: String(err.message || err) });
  }
}

// ============================================================================
// DELETE /api/lists/:id
// Delete a custom list and all its items
// ============================================================================

async function handleDeleteList(req, res) {
  const userId = await resolveUserId(req);
  if (!userId) return jsonResponse(res, 401, { success: false, message: "Unauthorized" });

  const pathParts = parsePath(req.query);
  const listId = pathParts[1];
  if (!listId) return jsonResponse(res, 400, { success: false, message: "List ID required" });

  const admin = await getAuthenticatedClient(req);
  try {
    const { error } = await admin
      .from("user_lists")
      .delete()
      .eq("id", listId)
      .eq("user_id", userId);

    if (error) return jsonResponse(res, 500, { success: false, message: error.message });

    return jsonResponse(res, 200, { success: true, message: "List deleted" });
  } catch (err) {
    return jsonResponse(res, 500, { success: false, message: String(err.message || err) });
  }
}

// ============================================================================
// GET /api/lists/:id/items
// Returns items in a specific list
// ============================================================================

async function handleGetListItems(req, res) {
  const userId = await resolveUserId(req);
  if (!userId) return jsonResponse(res, 401, { success: false, message: "Unauthorized" });

  const pathParts = parsePath(req.query);
  const listId = pathParts[1];
  if (!listId) return jsonResponse(res, 400, { success: false, message: "List ID required" });

  const admin = await getAuthenticatedClient(req);
  try {
    const { data, error } = await admin.rpc("get_list_items", {
      p_list_id: listId,
      p_user_id: userId
    });

    if (error) return jsonResponse(res, 500, { success: false, message: error.message });
    return jsonResponse(res, 200, { success: true, items: data || [] });
  } catch (err) {
    return jsonResponse(res, 500, { success: false, message: String(err.message || err) });
  }
}

// ============================================================================
// POST /api/lists/:id/items
// Add item to a custom list
// Body: { external_id, external_source?, metadata? }
// ============================================================================

async function handleAddItemToList(req, res) {
  const userId = await resolveUserId(req);
  if (!userId) return jsonResponse(res, 401, { success: false, message: "Unauthorized" });

  const pathParts = parsePath(req.query);
  const listId = pathParts[1];
  if (!listId) return jsonResponse(res, 400, { success: false, message: "List ID required" });

  const body = req.body || {};
  const externalId = String(body.external_id || "").trim();
  if (!externalId) return jsonResponse(res, 400, { success: false, message: "external_id required" });

  const externalSource = String(body.external_source || "local_db").trim();

  const admin = await getAuthenticatedClient(req);
  try {
    const { data, error } = await admin.rpc("add_item_to_list", {
      p_list_id: listId,
      p_user_id: userId,
      p_external_id: externalId,
      p_external_source: externalSource,
      p_metadata: body.metadata || {}
    });

    if (error) return jsonResponse(res, 500, { success: false, message: error.message });
    return jsonResponse(res, 201, { success: true, result: data });
  } catch (err) {
    return jsonResponse(res, 500, { success: false, message: String(err.message || err) });
  }
}

// ============================================================================
// DELETE /api/lists/:id/items/:externalId
// Remove item from a custom list
// ============================================================================

async function handleRemoveItemFromList(req, res) {
  const userId = await resolveUserId(req);
  if (!userId) return jsonResponse(res, 401, { success: false, message: "Unauthorized" });

  const pathParts = parsePath(req.query);
  const listId = pathParts[1];
  const externalId = pathParts[3];
  if (!listId || !externalId) {
    return jsonResponse(res, 400, { success: false, message: "List ID and external_id required" });
  }

  const admin = await getAuthenticatedClient(req);
  try {
    const { data, error } = await admin.rpc("remove_item_from_list", {
      p_list_id: listId,
      p_user_id: userId,
      p_external_id: externalId
    });

    if (error) return jsonResponse(res, 500, { success: false, message: error.message });
    return jsonResponse(res, 200, { success: true, result: data });
  } catch (err) {
    return jsonResponse(res, 500, { success: false, message: String(err.message || err) });
  }
}

// ============================================================================
// POST /api/lists/toggle
// Toggle item in a default list (favorites/completed/watchlist)
// Body: { category, type, external_id, external_source?, metadata? }
// ============================================================================

async function handleToggleItem(req, res) {
  const userId = await resolveUserId(req);
  if (!userId) return jsonResponse(res, 401, { success: false, message: "Unauthorized" });

  const body = req.body || {};
  let category = String(body.category || "").toLowerCase().trim();
  if (category === "sports") category = "sport";
  const listType = String(body.type || "").toLowerCase().trim();
  const externalId = String(body.external_id || "").trim();

  if (!category || !VALID_CATEGORIES.has(category)) {
    return jsonResponse(res, 400, { success: false, message: "Invalid category" });
  }
  if (!listType || listType === "custom") {
    return jsonResponse(res, 400, { success: false, message: "Invalid list type (must be favorites, completed, or watchlist)" });
  }
  if (!externalId) {
    return jsonResponse(res, 400, { success: false, message: "external_id required" });
  }

  const externalSource = String(body.external_source || EXTERNAL_SOURCES[category] || "local_db").trim();

  const admin = await getAuthenticatedClient(req);
  try {
    const { data, error } = await admin.rpc("toggle_list_item", {
      p_user_id: userId,
      p_category: category,
      p_list_type: listType,
      p_external_id: externalId,
      p_external_source: externalSource,
      p_metadata: body.metadata || {}
    });

    if (error) return jsonResponse(res, 500, { success: false, message: error.message });
    return jsonResponse(res, 200, { success: true, result: data });
  } catch (err) {
    return jsonResponse(res, 500, { success: false, message: String(err.message || err) });
  }
}

// ============================================================================
// GET /api/lists/status?category=X&external_id=Y
// Returns which lists an item is in
// ============================================================================

async function handleGetItemStatus(req, res) {
  const userId = await resolveUserId(req);
  if (!userId) return jsonResponse(res, 401, { success: false, message: "Unauthorized" });

  let category = String(req.query?.category || "").toLowerCase().trim();
  if (category === "sports") category = "sport";
  const externalId = String(req.query?.external_id || "").trim();

  if (!category || !VALID_CATEGORIES.has(category)) {
    return jsonResponse(res, 400, { success: false, message: "Invalid category" });
  }
  if (!externalId) {
    return jsonResponse(res, 400, { success: false, message: "external_id required" });
  }

  const admin = await getAuthenticatedClient(req);
  try {
    const { data, error } = await admin.rpc("get_item_list_status", {
      p_user_id: userId,
      p_category: category,
      p_external_id: externalId
    });

    if (error) return jsonResponse(res, 500, { success: false, message: error.message });

    const statusMap = { favorites: false, completed: false, watchlist: false };
    const customLists = [];
    (data || []).forEach((entry) => {
      if (entry.list_type === "favorites" || entry.list_type === "completed" || entry.list_type === "watchlist") {
        statusMap[entry.list_type] = true;
      } else {
        customLists.push({ list_id: entry.list_id, list_name: entry.list_name });
      }
    });

    return jsonResponse(res, 200, { success: true, status: statusMap, custom_lists: customLists });
  } catch (err) {
    return jsonResponse(res, 500, { success: false, message: String(err.message || err) });
  }
}

// ============================================================================
// POST /api/lists/defaults
// Create default lists for a user in a category
// Body: { category }
// ============================================================================

async function handleCreateDefaults(req, res) {
  const userId = await resolveUserId(req);
  if (!userId) return jsonResponse(res, 401, { success: false, message: "Unauthorized" });

  const body = req.body || {};
  let category = String(body.category || "").toLowerCase().trim();
  if (category === "sports") category = "sport";

  if (!category || !VALID_CATEGORIES.has(category)) {
    return jsonResponse(res, 400, { success: false, message: "Invalid category" });
  }

  const admin = await getAuthenticatedClient(req);
  try {
    const { error } = await admin.rpc("create_default_user_lists", {
      p_user_id: userId,
      p_category: category
    });

    if (error) return jsonResponse(res, 500, { success: false, message: error.message });
    return jsonResponse(res, 200, { success: true, message: "Default lists created" });
  } catch (err) {
    return jsonResponse(res, 500, { success: false, message: String(err.message || err) });
  }
}

// ============================================================================
// ROUTING
// ============================================================================

export default async function handler(req, res) {
  try {
    const pathParts = parsePath(req.query);
    const section = String(pathParts[0] || "").toLowerCase().trim();
    const method = String(req.method || "GET").toUpperCase();

    // /api/lists routes
    if (!section || section === "lists") {
      const sub = String(pathParts[1] || "").toLowerCase();

      // /api/lists/toggle (POST)
      if (sub === "toggle" && method === "POST") return handleToggleItem(req, res);
      // /api/lists/status (GET)
      if (sub === "status" && method === "GET") return handleGetItemStatus(req, res);
      // /api/lists/defaults (POST)
      if (sub === "defaults" && method === "POST") return handleCreateDefaults(req, res);

      // /api/lists/:id/items
      if (pathParts[2] === "items") {
        if (method === "GET") return handleGetListItems(req, res);
        if (method === "POST") return handleAddItemToList(req, res);
        // /api/lists/:id/items/:externalId (DELETE)
        if (pathParts[3] && method === "DELETE") return handleRemoveItemFromList(req, res);
        return jsonResponse(res, 405, { success: false, message: "Method not allowed" });
      }

      // /api/lists/:id (PUT/DELETE)
      if (sub && sub !== "toggle" && sub !== "status" && sub !== "defaults") {
        if (method === "PUT") return handleUpdateList(req, res);
        if (method === "DELETE") return handleDeleteList(req, res);
        return jsonResponse(res, 405, { success: false, message: "Method not allowed" });
      }

      // /api/lists (GET/POST)
      if (method === "GET") return handleGetLists(req, res);
      if (method === "POST") return handleCreateList(req, res);

      return jsonResponse(res, 405, { success: false, message: "Method not allowed" });
    }

    return jsonResponse(res, 404, { success: false, message: "Not found" });
  } catch (err) {
    return jsonResponse(res, 500, { success: false, message: String(err.message || err) });
  }
}
