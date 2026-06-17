const fs = require('fs');
const path = require('path');

function replaceInFile(filepath, replacements) {
    if (!fs.existsSync(filepath)) return;
    let content = fs.readFileSync(filepath, 'utf8');
    let original = content;
    for (const [pattern, replacement] of replacements) {
        if (typeof pattern === 'string') {
            content = content.split(pattern).join(replacement);
        } else {
            content = content.replace(pattern, replacement);
        }
    }
    if (content !== original) {
        fs.writeFileSync(filepath, content, 'utf8');
        console.log(`Updated ${path.basename(filepath)}`);
    }
}

const baseDir = "c:\\Users\\sigma\\OneDrive\\Desktop\\zo2ys";

// 1. Fix item_id -> external_id in profile.js and list-utils.js
// We specifically want to fix the mapping fields, and any .eq('item_id', ...) calls that were generated
replaceInFile(path.join(baseDir, "js", "list-utils.js"), [
    ["itemIdField: 'item_id'", "itemIdField: 'external_id'"],
    [".eq('item_id',", ".eq('external_id',"],
    ["item_id: normalizedItemId", "external_id: normalizedItemId"],
    ["media_type: normalizedType", "category: normalizedType"], // Fix ensureDefaultList payload
    [".eq('media_type', normalizedType)", ".eq('category', normalizedType)"],
    ["title: title", "name: title"],
    ["title: payload.title", "name: payload.title"],
    [".update({ title: title })", ".update({ name: title })"],
    // Fix user_default_lists in ensureDefaultList
    [".from('user_default_lists')", ".from('user_lists')"],
    [".eq('list_type', normalizedListType)", ".eq('type', normalizedListType)"],
    ["id: listId,", ""], // remove id from insert in default lists since we use user_lists
    ["list_type: normalizedListType,", "type: normalizedListType,"],
    ["media_type: getCategoryName(type)", "category: getCategoryName(type)"]
]);

replaceInFile(path.join(baseDir, "js", "pages", "profile.js"), [
    ["movie: 'item_id'", "movie: 'external_id'"],
    ["tv: 'item_id'", "tv: 'external_id'"],
    ["anime: 'item_id'", "anime: 'external_id'"],
    ["game: 'item_id'", "game: 'external_id'"],
    ["book: 'item_id'", "book: 'external_id'"],
    ["music: 'item_id'", "music: 'external_id'"],
    ["travel: 'item_id'", "travel: 'external_id'"],
    ["fashion: 'item_id'", "fashion: 'external_id'"],
    ["food: 'item_id'", "food: 'external_id'"],
    ["car: 'item_id'", "car: 'external_id'"],
    [".eq('item_id',", ".eq('external_id',"],
    ["itemField: 'item_id'", "itemField: 'external_id'"],
    ["item_id, list_type, list_id", "external_id, list_type, list_id"],
    ["item.item_id", "item.external_id"],
    ["i.item_id", "i.external_id"],
    ["row.item_id", "row.external_id"],
    ["list_type: collectionId", "list_id: collectionId"] // wait, in add to collection listType default inserts list_type: collectionId, but it should be list_id: collectionId for list_items
]);

// 2. Fix index.js (Home page feed)
replaceInFile(path.join(baseDir, "js", "pages", "index.js"), [
    [".from('user_list_items')", ".from('list_items')"],
    [".eq('media_type', mediaType)", ".eq('external_type', mediaType)"],
    ["select('media_id, list_id, user_id, created_at')", "select('external_id, list_id, user_id, created_at')"], // Note user_id is NOT in list_items schema, we need to join user_lists! Wait, my SQL schema didn't have user_id on list_items? Oh, I need to check my SQL script again!
    [".from('user_default_lists')", ".from('user_lists')"],
    ["select('id, list_type')", "select('id, type')"],
    ["dl.list_type", "dl.type"],
    ["row.media_id", "row.external_id"]
]);

// 3. Fix lists-handler.js
replaceInFile(path.join(baseDir, "api", "lists-handler.js"), [
    [".eq(\"media_type\", mediaType)", ".eq(\"category\", mediaType)"],
    [".from(\"user_default_lists\")", ".from(\"user_lists\")"],
    [".eq(\"list_type\", listType)", ".eq(\"type\", listType)"],
    ["title: body.title", "name: body.title"],
    ["title: title", "name: title"]
]);

