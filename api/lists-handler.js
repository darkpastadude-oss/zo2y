import { getSupabaseAdminClient } from "../backend/lib/supabase-admin.js";

const VALID_MEDIA_TYPES = new Set([
  "movie", "tv", "anime", "game", "book", "music",
  "fashion", "food", "travel", "car", "restaurant"
]);

const VALID_DEFAULT_LIST_TYPES = new Set(["favorites", "watchlist", "watched", "owned", "wishlist", "tried", "want_to_try", "visited", "bucketlist"]);

function parsePath(query) {
  const raw = String(query?.path || "").split("/").filter(Boolean);
  return raw;
}

function jsonResponse(res, status, body) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.setHeader("Pragma", "no-cache");
  return res.status(status).json(body);
}

async function getSupabase(req) {
  const admin = getSupabaseAdminClient();
  // For user-scoped queries we need the authenticated user context.
  // We use the service-role client and filter by user_id for RPC calls.
  return admin;
}

async function resolveUserId(req) {
  // Extract from auth header or session
  const authHeader = String(req.headers["authorization"] || "").trim();
  if (!authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  try {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data?.user?.id) return null;
    return data.user.id;
  } catch {
    return null;
  }
}

/**
 * GET /api/lists
 * Query params: media_type (required), type (optional filter)
 * Returns all lists for a user in a given media type
 */
async function handleGetLists(req, res) {
  const userId = await resolveUserId(req);
  if (!userId) return jsonResponse(res, 401, { success: false, message: "Unauthorized" });

  const mediaType = String(req.query?.media_type || req.query?.category || "").toLowerCase().trim();
  if (!mediaType || !VALID_MEDIA_TYPES.has(mediaType)) {
    return jsonResponse(res, 400, { success: false, message: "Invalid or missing media_type" });
  }

  const listType = String(req.query?.type || "").toLowerCase().trim();
  const admin = await getSupabase(req);

  try {
    const { data, error } = await admin
      .from("user_lists")
      .select("*")
      .eq("user_id", userId)
      .eq("media_type", mediaType)
      .order("created_at", { ascending: false });

    if (error) {
      return jsonResponse(res, 500, { success: false, message: error.message });
    }

    let lists = data || [];
    if (listType && VALID_DEFAULT_LIST_TYPES.has(listType)) {
      // For default list types, we need to query user_default_lists
      const { data: defaultLists } = await admin
        .from("user_default_lists")
        .select("*")
        .eq("user_id", userId)
        .eq("media_type", mediaType)
        .eq("list_type", listType);
      lists = defaultLists || [];
    }

    return jsonResponse(res, 200, { success: true, lists });
  } catch (err) {
    return jsonResponse(res, 500, { success: false, message: String(err.message || err) });
  }
}

/**
 * POST /api/lists
 * Body: { media_type, title, icon?, description? }
 * Creates a new custom list
 */
async function handleCreateList(req, res) {
  const userId = await resolveUserId(req);
  if (!userId) return jsonResponse(res, 401, { success: false, message: "Unauthorized" });

  const body = req.body || {};
  const mediaType = String(body.media_type || body.category || "").toLowerCase().trim();
  const title = String(body.title || body.name || "").trim();

  if (!mediaType || !VALID_MEDIA_TYPES.has(mediaType)) {
    return jsonResponse(res, 400, { success: false, message: "Invalid media_type" });
  }
  if (!title || title.length < 1 || title.length > 100) {
    return jsonResponse(res, 400, { success: false, message: "List title must be 1-100 characters" });
  }

  const admin = await getSupabase(req);
  try {
    const { data, error } = await admin
      .from("user_lists")
      .insert({
        user_id: userId,
        title,
        media_type: mediaType,
        icon: body.icon || "fas fa-list",
        description: body.description || "",
        is_public: body.is_public || false
      })
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505") {
        return jsonResponse(res, 409, { success: false, message: "A list with that title already exists for this media type" });
      }
      return jsonResponse(res, 500, { success: false, message: error.message });
    }

    return jsonResponse(res, 201, { success: true, list: data });
  } catch (err) {
    return jsonResponse(res, 500, { success: false, message: String(err.message || err) });
  }
}

/**
 * PUT /api/lists/:id
 * Body: { title?, icon?, description?, is_public? }
 * Updates a custom list
 */
async function handleUpdateList(req, res) {
  const userId = await resolveUserId(req);
  if (!userId) return jsonResponse(res, 401, { success: false, message: "Unauthorized" });

  const pathParts = parsePath(req.query);
  const listId = pathParts[1]; // /api/lists/:id

  if (!listId) {
    return jsonResponse(res, 400, { success: false, message: "List ID required" });
  }

  const body = req.body || {};
  const updates = {};
  if (body.title !== undefined) updates.title = String(body.title).trim();
  if (body.name !== undefined) updates.title = String(body.name).trim(); // backward compat
  if (body.icon !== undefined) updates.icon = String(body.icon).trim();
  if (body.description !== undefined) updates.description = String(body.description).trim();
  if (body.is_public !== undefined) updates.is_public = Boolean(body.is_public);

  const admin = await getSupabase(req);
  try {
    const { data, error } = await admin
      .from("user_lists")
      .update(updates)
      .eq("id", listId)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return jsonResponse(res, 404, { success: false, message: "List not found" });
      }
      return jsonResponse(res, 500, { success: false, message: error.message });
    }

    return jsonResponse(res, 200, { success: true, list: data });
  } catch (err) {
    return jsonResponse(res, 500, { success: false, message: String(err.message || err) });
  }
}

/**
 * DELETE /api/lists/:id
 * Deletes a list and all its items
 */
async function handleDeleteList(req, res) {
  const userId = await resolveUserId(req);
  if (!userId) return jsonResponse(res, 401, { success: false, message: "Unauthorized" });

  const pathParts = parsePath(req.query);
  const listId = pathParts[1];

  if (!listId) {
    return jsonResponse(res, 400, { success: false, message: "List ID required" });
  }

  const admin = await getSupabase(req);
  try {
    // Delete items first (CASCADE should handle this but being explicit)
    await admin.from("user_list_items").delete().eq("list_id", listId);
    const { error } = await admin
      .from("user_lists")
      .delete()
      .eq("id", listId)
      .eq("user_id", userId);

    if (error) {
      return jsonResponse(res, 500, { success: false, message: error.message });
    }

    return jsonResponse(res, 200, { success: true, message: "List deleted" });
  } catch (err) {
    return jsonResponse(res, 500, { success: false, message: String(err.message || err) });
  }
}

/**
 * GET /api/lists/:id/items
 * Returns items in a specific list
 */
async function handleGetListItems(req, res) {
  const userId = await resolveUserId(req);
  if (!userId) return jsonResponse(res, 401, { success: false, message: "Unauthorized" });

  const pathParts = parsePath(req.query);
  const listId = pathParts[1];

  if (!listId) {
    return jsonResponse(res, 400, { success: false, message: "List ID required" });
  }

  const admin = await getSupabase(req);
  try {
    const { data, error } = await admin
      .from("user_list_items")
      .select("*")
      .eq("list_id", listId)
      .eq("user_id", userId)
      .order("sort_order", { ascending: true });

    if (error) {
      return jsonResponse(res, 500, { success: false, message: error.message });
    }

    return jsonResponse(res, 200, { success: true, items: data || [] });
  } catch (err) {
    return jsonResponse(res, 500, { success: false, message: String(err.message || err) });
  }
}

/**
 * POST /api/lists/:id/items
 * Body: { external_id, external_source, metadata? }
 * Adds an item to a list
 */
async function handleAddItemToList(req, res) {
  const userId = await resolveUserId(req);
  if (!userId) return jsonResponse(res, 401, { success: false, message: "Unauthorized" });

  const pathParts = parsePath(req.query);
  const listId = pathParts[1];

  if (!listId) {
    return jsonResponse(res, 400, { success: false, message: "List ID required" });
  }

  const body = req.body || {};
  const externalId = String(body.external_id || "").trim();
  const externalSource = String(body.external_source || "local_db").trim();

  if (!externalId) {
    return jsonResponse(res, 400, { success: false, message: "external_id is required" });
  }

  const admin = await getSupabase(req);
  try {
    const { data, error } = await admin.rpc("add_item_to_list", {
      p_list_id: listId,
      p_user_id: userId,
      p_external_id: externalId,
      p_external_source: externalSource,
      p_metadata: body.metadata || {}
    });

    if (error) {
      if (error.code === "P0002") {
        return jsonResponse(res, 404, { success: false, message: "List not found or access denied" });
      }
      return jsonResponse(res, 500, { success: false, message: error.message });
    }

    return jsonResponse(res, 201, { success: true, item: data });
  } catch (err) {
    return jsonResponse(res, 500, { success: false, message: String(err.message || err) });
  }
}

/**
 * DELETE /api/lists/:id/items/:externalId
 * Removes an item from a list
 */
async function handleRemoveItemFromList(req, res) {
  const userId = await resolveUserId(req);
  if (!userId) return jsonResponse(res, 401, { success: false, message: "Unauthorized" });

  const pathParts = parsePath(req.query);
  const listId = pathParts[1];
  const externalId = pathParts[3]; // /api/lists/:id/items/:externalId

  if (!listId || !externalId) {
    return jsonResponse(res, 400, { success: false, message: "List ID and item external_id required" });
  }

  const admin = await getSupabase(req);
  try {
    const { data, error } = await admin.rpc("remove_item_from_list", {
      p_list_id: listId,
      p_user_id: userId,
      p_external_id: externalId
    });

    if (error) {
      if (error.code === "P0002") {
        return jsonResponse(res, 404, { success: false, message: "List not found or access denied" });
      }
      return jsonResponse(res, 500, { success: false, message: error.message });
    }

    return jsonResponse(res, 200, { success: true, removed: data });
  } catch (err) {
    return jsonResponse(res, 500, { success: false, message: String(err.message || err) });
  }
}

/**
 * POST /api/lists/toggle
 * Body: { category, type, external_id, external_source?, metadata? }
 * Toggles an item in a default list (favorites/completed/watchlist)
 */
async function handleToggleItem(req, res) {
  const userId = await resolveUserId(req);
  if (!userId) return jsonResponse(res, 401, { success: false, message: "Unauthorized" });

  const body = req.body || {};
  const category = String(body.category || "").toLowerCase().trim();
  const listType = String(body.type || "").toLowerCase().trim();
  const externalId = String(body.external_id || "").trim();

  if (!category || !VALID_CATEGORIES.has(category)) {
    return jsonResponse(res, 400, { success: false, message: "Invalid category" });
  }
  if (!listType || !VALID_LIST_TYPES.has(listType) || listType === "custom") {
    return jsonResponse(res, 400, { success: false, message: "Invalid list type (must be favorites, watchlist, or completed)" });
  }
  if (!externalId) {
    return jsonResponse(res, 400, { success: false, message: "external_id is required" });
  }

  const admin = await getSupabase(req);
  try {
    const { data, error } = await admin.rpc("toggle_list_item", {
      p_user_id: userId,
      p_category: category,
      p_list_type: listType,
      p_external_id: externalId,
      p_external_source: body.external_source || "local_db",
      p_metadata: body.metadata || {}
    });

    if (error) {
      return jsonResponse(res, 500, { success: false, message: error.message });
    }

    return jsonResponse(res, 200, { success: true, result: data });
  } catch (err) {
    return jsonResponse(res, 500, { success: false, message: String(err.message || err) });
  }
}

/**
 * GET /api/lists/status
 * Query params: category, external_id
 * Returns which lists an item is in
 */
async function handleGetItemStatus(req, res) {
  const userId = await resolveUserId(req);
  if (!userId) return jsonResponse(res, 401, { success: false, message: "Unauthorized" });

  const category = String(req.query?.category || "").toLowerCase().trim();
  const externalId = String(req.query?.external_id || "").trim();

  if (!category || !VALID_CATEGORIES.has(category)) {
    return jsonResponse(res, 400, { success: false, message: "Invalid category" });
  }
  if (!externalId) {
    return jsonResponse(res, 400, { success: false, message: "external_id is required" });
  }

  const admin = await getSupabase(req);
  try {
    const { data, error } = await admin.rpc("get_item_list_status", {
      p_user_id: userId,
      p_category: category,
      p_external_id: externalId
    });

    if (error) {
      return jsonResponse(res, 500, { success: false, message: error.message });
    }

    // Build a status map indexed by type
    const statusMap = { favorites: false, watchlist: false, completed: false };
    const customLists = [];
    (data || []).forEach((entry) => {
      if (entry.list_type === "favorites" || entry.list_type === "watchlist" || entry.list_type === "completed") {
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

/**
 * GET /api/lists/defaults
 * Creates default lists for all categories for current user
 */
async function handleCreateDefaults(req, res) {
  const userId = await resolveUserId(req);
  if (!userId) return jsonResponse(res, 401, { success: false, message: "Unauthorized" });

  const admin = await getSupabase(req);
  try {
    const { error } = await admin.rpc("create_default_user_lists", {
      p_user_id: userId
    });

    if (error) {
      return jsonResponse(res, 500, { success: false, message: error.message });
    }

    return jsonResponse(res, 200, { success: true, message: "Default lists created" });
  } catch (err) {
    return jsonResponse(res, 500, { success: false, message: String(err.message || err) });
  }
}

const HANDLERS = {
  "GET:default": handleGetLists,
  "POST:default": handleCreateList,
  "toggle": { POST: handleToggleItem },
  "status": { GET: handleGetItemStatus },
  "defaults": { POST: handleCreateDefaults }
};

export default async function handler(req, res) {
  try {
    const query = req.query || {};
    const pathParts = parsePath(query);
    const section = String(pathParts[0] || "").toLowerCase().trim();
    const method = String(req.method || "GET").toUpperCase();

    // Sub-routes without a list ID
    if (!section || section === "lists" || section === "") {
      if (!pathParts[1]) {
        // /api/lists or /api/lists/
        if (method === "GET") return handleGetLists(req, res);
        if (method === "POST") return handleCreateList(req, res);
        return jsonResponse(res, 405, { success: false, message: "Method not allowed" });
      }

      const sub = String(pathParts[1] || "").toLowerCase();
      if (sub === "toggle" && method === "POST") return handleToggleItem(req, res);
      if (sub === "status" && method === "GET") return handleGetItemStatus(req, res);
      if (sub === "defaults" && method === "POST") return handleCreateDefaults(req, res);

      if (pathParts[2] === "items") {
        if (!pathParts[3] && method === "GET") return handleGetListItems(req, res);
        if (!pathParts[3] && method === "POST") return handleAddItemToList(req, res);
        if (pathParts[3] && method === "DELETE") return handleRemoveItemFromList(req, res);
        return jsonResponse(res, 405, { success: false, message: "Method not allowed" });
      }

      // /api/lists/:id
      if (method === "PUT") return handleUpdateList(req, res);
      if (method === "DELETE") return handleDeleteList(req, res);
      return jsonResponse(res, 405, { success: false, message: "Method not allowed" });
    }

    return jsonResponse(res, 404, { success: false, message: "Not found" });
  } catch (err) {
    return jsonResponse(res, 500, { success: false, message: String(err.message || err) });
  }
}
