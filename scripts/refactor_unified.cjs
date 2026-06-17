const fs = require('fs');
const path = require('path');

function refactorListUtils(filepath) {
    let content = fs.readFileSync(filepath, 'utf8');

    // Change LIST_CONFIG itemsTable and itemIdField
    content = content.replace(/itemsTable: 'user_list_items'/g, "itemsTable: 'list_items'");
    content = content.replace(/itemIdField: 'media_id'/g, "itemIdField: 'item_id'");

    // Replace user_list_items with list_items
    content = content.replace(/'user_list_items'/g, "'list_items'");

    // Replace media_type with external_type in list-utils inserts/queries
    content = content.replace(/media_type: getCategoryName\(type\)/g, "external_type: getCategoryName(type)");
    content = content.replace(/media_id: normalizedItemId/g, "item_id: normalizedItemId");
    content = content.replace(/\.eq\('media_id',/g, ".eq('item_id',");

    fs.writeFileSync(filepath, content, 'utf8');
}

function refactorProfileJs(filepath) {
    let content = fs.readFileSync(filepath, 'utf8');

    // 1. Update CUSTOM_LIST_TABLES
    content = content.replace(/movie:\s*'movie_lists'/g, "movie: 'user_lists'");
    content = content.replace(/tv:\s*'tv_lists'/g, "tv: 'user_lists'");
    content = content.replace(/anime:\s*'anime_lists'/g, "anime: 'user_lists'");
    content = content.replace(/game:\s*'game_lists'/g, "game: 'user_lists'");
    content = content.replace(/book:\s*'book_lists'/g, "book: 'user_lists'");
    content = content.replace(/music:\s*'music_lists'/g, "music: 'user_lists'");
    content = content.replace(/travel:\s*'travel_lists'/g, "travel: 'user_lists'");
    content = content.replace(/fashion:\s*'fashion_lists'/g, "fashion: 'user_lists'");
    content = content.replace(/food:\s*'food_lists'/g, "food: 'user_lists'");
    content = content.replace(/car:\s*'car_lists'/g, "car: 'user_lists'");

    // 2. Update MEDIA_ITEM_TABLES
    content = content.replace(/movie:\s*'movie_list_items'/g, "movie: 'list_items'");
    content = content.replace(/tv:\s*'tv_list_items'/g, "tv: 'list_items'");
    content = content.replace(/anime:\s*'anime_list_items'/g, "anime: 'list_items'");
    content = content.replace(/game:\s*'game_list_items'/g, "game: 'list_items'");
    content = content.replace(/book:\s*'book_list_items'/g, "book: 'list_items'");
    content = content.replace(/music:\s*'music_list_items'/g, "music: 'list_items'");
    content = content.replace(/travel:\s*'travel_list_items'/g, "travel: 'list_items'");
    content = content.replace(/fashion:\s*'fashion_list_items'/g, "fashion: 'list_items'");
    content = content.replace(/food:\s*'food_list_items'/g, "food: 'list_items'");
    content = content.replace(/car:\s*'car_list_items'/g, "car: 'list_items'");

    // 3. Update MEDIA_ITEM_FIELDS
    content = content.replace(/movie:\s*'movie_id'/g, "movie: 'item_id'");
    content = content.replace(/tv:\s*'tv_id'/g, "tv: 'item_id'");
    content = content.replace(/anime:\s*'anime_id'/g, "anime: 'item_id'");
    content = content.replace(/game:\s*'game_id'/g, "game: 'item_id'");
    content = content.replace(/book:\s*'book_id'/g, "book: 'item_id'");
    content = content.replace(/music:\s*'track_id'/g, "music: 'item_id'");
    content = content.replace(/travel:\s*'country_code'/g, "travel: 'item_id'");
    content = content.replace(/fashion:\s*'brand_id'/g, "fashion: 'item_id'");
    content = content.replace(/food:\s*'brand_id'/g, "food: 'item_id'");
    content = content.replace(/car:\s*'brand_id'/g, "car: 'item_id'");

    // 4. Update safeCountByUser calls for list_items
    content = content.replace(
        /safeCountByUser\('list_items',\s*targetId,\s*\{\s*external_type:\s*'([^']+)'\s*\}\)/g,
        "safeCountByUser('list_items', targetId, { extraFilter: q => q.eq('external_type', '$1') })"
    );
    
    // Update safeCountByUser calls for user_lists
    content = content.replace(
        /safeCountByUser\('user_lists',\s*targetId,\s*\{\s*category:\s*'([^']+)'\s*\}\)/g,
        "safeCountByUser('user_lists', targetId, { extraFilter: q => q.eq('category', '$1') })"
    );

    // 5. Add external_type filter to loadMediaListItems
    content = content.replace(
        /\.eq\('user_id', safeOwnerId\);/g,
        ".eq('user_id', safeOwnerId).eq('external_type', contentType);"
    );
    content = content.replace(
        /\.in\('list_id', safeCustomIds\);/g,
        ".in('list_id', safeCustomIds).eq('external_type', contentType);"
    );

    // 6. Add external_type filter to fetchMediaCollectionItemIds
    content = content.replace(
        /\.eq\(filterField, safeListId\);/g,
        ".eq(filterField, safeListId).eq('external_type', contentType);"
    );

    // 7. Update addToCollection payload to include external_type
    content = content.replace(
        /\{ user_id: userId, \[itemField\]: itemId, list_type: collectionId \}/g,
        "{ user_id: userId, [itemField]: itemId, list_type: collectionId, external_type: type }"
    );
    content = content.replace(
        /\{ \[itemField\]: itemId, list_id: collectionId \}/g,
        "{ [itemField]: itemId, list_id: collectionId, external_type: type }"
    );

    // 8. Hardcoded movie queries fixes
    content = content.replace(/movie_id, list_type, list_id/g, "item_id, list_type, list_id");
    content = content.replace(/item\.movie_id/g, "item.item_id");
    content = content.replace(/\.eq\('movie_id', movieId\)/g, ".eq('item_id', movieId)");

    // 9. Render mapping fixes (e.g. i.movie_id -> i.item_id)
    content = content.replace(/i\.movie_id/g, "i.item_id");
    content = content.replace(/i\.tv_id/g, "i.item_id");
    content = content.replace(/i\.anime_id/g, "i.item_id");
    content = content.replace(/i\.game_id/g, "i.item_id");
    content = content.replace(/i\.book_id/g, "i.item_id");
    content = content.replace(/i\.track_id/g, "i.item_id");
    content = content.replace(/row\.country_code/g, "row.item_id");
    content = content.replace(/row\.brand_id/g, "row.item_id");

    // 10. Fix user_lists query in loadTasteIdentity
    content = content.replace(
        /\.eq\('user_id', safeOwnerId\)/g,
        ".eq('user_id', safeOwnerId).eq('category', contentType)"
    );

    // 11. Activity feed fallbacks
    content = content.replace(/itemField: 'movie_id'/g, "itemField: 'item_id'");
    content = content.replace(/itemField: 'tv_id'/g, "itemField: 'item_id'");
    content = content.replace(/itemField: 'anime_id'/g, "itemField: 'item_id'");
    content = content.replace(/itemField: 'game_id'/g, "itemField: 'item_id'");
    content = content.replace(/itemField: 'book_id'/g, "itemField: 'item_id'");
    content = content.replace(/itemField: 'track_id'/g, "itemField: 'item_id'");

    fs.writeFileSync(filepath, content, 'utf8');
}

const baseDir = "c:\\Users\\sigma\\OneDrive\\Desktop\\zo2ys";

const listUtilsPath = path.join(baseDir, "js", "list-utils.js");
if (fs.existsSync(listUtilsPath)) {
    refactorListUtils(listUtilsPath);
    console.log("Refactored list-utils.js");
}

const profilePath = path.join(baseDir, "js", "pages", "profile.js");
if (fs.existsSync(profilePath)) {
    refactorProfileJs(profilePath);
    console.log("Refactored profile.js");
}
