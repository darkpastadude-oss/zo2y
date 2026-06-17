import os
import re

def refactor_list_utils(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Change LIST_CONFIG itemsTable and itemIdField
    content = content.replace("itemsTable: 'user_list_items'", "itemsTable: 'list_items'")
    content = content.replace("itemIdField: 'media_id'", "itemIdField: 'item_id'")

    # Replace user_list_items with list_items
    content = content.replace("'user_list_items'", "'list_items'")

    # Replace media_type with external_type in list-utils inserts/queries
    # Only replace specific occurrences to avoid breaking things
    content = content.replace("media_type: getCategoryName(type)", "external_type: getCategoryName(type)")
    content = content.replace("media_id: normalizedItemId", "item_id: normalizedItemId")
    content = content.replace(".eq('media_id',", ".eq('item_id',")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)


def refactor_profile_js(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update CUSTOM_LIST_TABLES
    content = re.sub(r"movie:\s*'movie_lists'", "movie: 'user_lists'", content)
    content = re.sub(r"tv:\s*'tv_lists'", "tv: 'user_lists'", content)
    content = re.sub(r"anime:\s*'anime_lists'", "anime: 'user_lists'", content)
    content = re.sub(r"game:\s*'game_lists'", "game: 'user_lists'", content)
    content = re.sub(r"book:\s*'book_lists'", "book: 'user_lists'", content)
    content = re.sub(r"music:\s*'music_lists'", "music: 'user_lists'", content)
    content = re.sub(r"travel:\s*'travel_lists'", "travel: 'user_lists'", content)
    content = re.sub(r"fashion:\s*'fashion_lists'", "fashion: 'user_lists'", content)
    content = re.sub(r"food:\s*'food_lists'", "food: 'user_lists'", content)
    content = re.sub(r"car:\s*'car_lists'", "car: 'user_lists'", content)

    # 2. Update MEDIA_ITEM_TABLES
    content = re.sub(r"movie:\s*'movie_list_items'", "movie: 'list_items'", content)
    content = re.sub(r"tv:\s*'tv_list_items'", "tv: 'list_items'", content)
    content = re.sub(r"anime:\s*'anime_list_items'", "anime: 'list_items'", content)
    content = re.sub(r"game:\s*'game_list_items'", "game: 'list_items'", content)
    content = re.sub(r"book:\s*'book_list_items'", "book: 'list_items'", content)
    content = re.sub(r"music:\s*'music_list_items'", "music: 'list_items'", content)
    content = re.sub(r"travel:\s*'travel_list_items'", "travel: 'list_items'", content)
    content = re.sub(r"fashion:\s*'fashion_list_items'", "fashion: 'list_items'", content)
    content = re.sub(r"food:\s*'food_list_items'", "food: 'list_items'", content)
    content = re.sub(r"car:\s*'car_list_items'", "car: 'list_items'", content)

    # 3. Update MEDIA_ITEM_FIELDS
    content = re.sub(r"movie:\s*'movie_id'", "movie: 'item_id'", content)
    content = re.sub(r"tv:\s*'tv_id'", "tv: 'item_id'", content)
    content = re.sub(r"anime:\s*'anime_id'", "anime: 'item_id'", content)
    content = re.sub(r"game:\s*'game_id'", "game: 'item_id'", content)
    content = re.sub(r"book:\s*'book_id'", "book: 'item_id'", content)
    content = re.sub(r"music:\s*'track_id'", "music: 'item_id'", content)
    content = re.sub(r"travel:\s*'country_code'", "travel: 'item_id'", content)
    content = re.sub(r"fashion:\s*'brand_id'", "fashion: 'item_id'", content)
    content = re.sub(r"food:\s*'brand_id'", "food: 'item_id'", content)
    content = re.sub(r"car:\s*'brand_id'", "car: 'item_id'", content)

    # 4. Update safeCountByUser calls for list_items
    content = re.sub(
        r"safeCountByUser\('list_items',\s*targetId,\s*\{\s*external_type:\s*'([^']+)'\s*\}\)",
        r"safeCountByUser('list_items', targetId, { extraFilter: q => q.eq('external_type', '\1') })",
        content
    )
    
    # Update safeCountByUser calls for user_lists
    content = re.sub(
        r"safeCountByUser\('user_lists',\s*targetId,\s*\{\s*category:\s*'([^']+)'\s*\}\)",
        r"safeCountByUser('user_lists', targetId, { extraFilter: q => q.eq('category', '\1') })",
        content
    )

    # 5. Add external_type filter to loadMediaListItems
    content = content.replace(
        ".eq('user_id', safeOwnerId);",
        ".eq('user_id', safeOwnerId).eq('external_type', contentType);"
    )
    content = content.replace(
        ".in('list_id', safeCustomIds);",
        ".in('list_id', safeCustomIds).eq('external_type', contentType);"
    )

    # 6. Add external_type filter to fetchMediaCollectionItemIds
    content = content.replace(
        ".eq(filterField, safeListId);",
        ".eq(filterField, safeListId).eq('external_type', contentType);"
    )

    # 7. Update addToCollection payload to include external_type
    content = content.replace(
        "{ user_id: userId, [itemField]: itemId, list_type: collectionId }",
        "{ user_id: userId, [itemField]: itemId, list_type: collectionId, external_type: type }"
    )
    content = content.replace(
        "{ [itemField]: itemId, list_id: collectionId }",
        "{ [itemField]: itemId, list_id: collectionId, external_type: type }"
    )

    # 8. Hardcoded movie queries fixes
    content = content.replace("movie_id, list_type, list_id", "item_id, list_type, list_id")
    content = content.replace("item.movie_id", "item.item_id")
    content = content.replace(".eq('movie_id', movieId)", ".eq('item_id', movieId)")

    # 9. Render mapping fixes (e.g. i.movie_id -> i.item_id)
    content = content.replace("i.movie_id", "i.item_id")
    content = content.replace("i.tv_id", "i.item_id")
    content = content.replace("i.anime_id", "i.item_id")
    content = content.replace("i.game_id", "i.item_id")
    content = content.replace("i.book_id", "i.item_id")
    content = content.replace("i.track_id", "i.item_id")
    content = content.replace("row.country_code", "row.item_id")
    content = content.replace("row.brand_id", "row.item_id")

    # 10. Fix user_lists query in loadTasteIdentity
    content = content.replace(".eq('user_id', safeOwnerId)", ".eq('user_id', safeOwnerId).eq('category', contentType)")

    # 11. Activity feed fallbacks
    content = content.replace("itemField: 'movie_id'", "itemField: 'item_id'")
    content = content.replace("itemField: 'tv_id'", "itemField: 'item_id'")
    content = content.replace("itemField: 'anime_id'", "itemField: 'item_id'")
    content = content.replace("itemField: 'game_id'", "itemField: 'item_id'")
    content = content.replace("itemField: 'book_id'", "itemField: 'item_id'")
    content = content.replace("itemField: 'track_id'", "itemField: 'item_id'")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)


if __name__ == '__main__':
    base_dir = r"c:\Users\sigma\OneDrive\Desktop\zo2ys"
    
    list_utils_path = os.path.join(base_dir, "js", "list-utils.js")
    if os.path.exists(list_utils_path):
        refactor_list_utils(list_utils_path)
        print("Refactored list-utils.js")
        
    profile_path = os.path.join(base_dir, "js", "pages", "profile.js")
    if os.path.exists(profile_path):
        refactor_profile_js(profile_path)
        print("Refactored profile.js")
