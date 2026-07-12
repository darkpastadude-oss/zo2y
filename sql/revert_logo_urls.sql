-- ============================================================
-- REVERT: Restore original logo_url values for all brands
-- The previous seed_brand_images.sql overwrote logos with Pexels
-- stock photos. This script restores the original sources.
-- ============================================================

-- ── FASHION BRANDS: Wikimedia Commons logos ───────────────────
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Abercrombie_%26_Fitch_logo.svg/330px-Abercrombie_%26_Fitch_logo.svg.png' WHERE slug = 'abercrombie';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Adidas_2022_logo.svg/330px-Adidas_2022_logo.svg.png' WHERE slug = 'adidas';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/American_Eagle_Outfitters_wordmark.svg/330px-American_Eagle_Outfitters_wordmark.svg.png' WHERE slug = 'ae';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Allbirds_logo.svg/330px-Allbirds_logo.svg.png' WHERE slug = 'allbirds';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Asics_Logo.svg/330px-Asics_Logo.svg.png' WHERE slug = 'asics';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Balenciaga_Logo.svg/330px-Balenciaga_Logo.svg.png' WHERE slug = 'balenciaga';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Birkenstock_logo.svg/330px-Birkenstock_logo.svg.png' WHERE slug = 'birkenstock';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/BoohooLogo.png/330px-BoohooLogo.png' WHERE slug = 'boohoo';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Canada_Goose_2023_logo.svg/330px-Canada_Goose_2023_logo.svg.png' WHERE slug = 'canadagoose';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Champion_USA_logo.svg/330px-Champion_USA_logo.svg.png' WHERE slug = 'champion';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/C_%26_J_Clarks_International_company_logo.svg/330px-C_%26_J_Clarks_International_company_logo.svg.png' WHERE slug = 'clarks';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Cole_Haan_Logo.svg/330px-Cole_Haan_Logo.svg.png' WHERE slug = 'colehaan';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Converse_logo.svg/330px-Converse_logo.svg.png' WHERE slug = 'converse';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/COS_logo.png/330px-COS_logo.png' WHERE slug = 'cos';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Dr._Martens_Logo.svg/330px-Dr._Martens_Logo.svg.png' WHERE slug = 'drmartens';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Express_Clothing_Logo.SVG/330px-Express_Clothing_Logo.SVG.png' WHERE slug = 'express';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Forever_21_logo.svg/330px-Forever_21_logo.svg.png' WHERE slug = 'forever21';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Gap_logo.svg/330px-Gap_logo.svg.png' WHERE slug = 'gap';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Givenchy_-_logo_%28France%2C_2003%29.svg/330px-Givenchy_-_logo_%28France%2C_2003%29.svg.png' WHERE slug = 'givenchy';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/H%26M-Logo.svg/330px-H%26M-Logo.svg.png' WHERE slug = 'hm';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Guess_logo.svg/330px-Guess_logo.svg.png' WHERE slug = 'guess';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Hugo_Boss_orange_logo.svg/330px-Hugo_Boss_orange_logo.svg.png' WHERE slug = 'hugoboss';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/JCrew_logo.svg/330px-JCrew_logo.svg.png' WHERE slug = 'jcrew';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Kith_brand_logo.svg/330px-Kith_brand_logo.svg.png' WHERE slug = 'kith';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Lacoste_wordmark_2011.svg/330px-Lacoste_wordmark_2011.svg.png' WHERE slug = 'lacoste';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Levi%27s_logo.svg/330px-Levi%27s_logo.svg.png' WHERE slug = 'levi';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Longchamp_logo.svg/330px-Longchamp_logo.svg.png' WHERE slug = 'longchamp';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Louis_Vuitton_logo.svg/330px-Louis_Vuitton_logo.svg.png' WHERE slug = 'louis-vuitton';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Logo_of_Mango_%28new%29.svg/330px-Logo_of_Mango_%28new%29.svg.png' WHERE slug = 'mango';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Merrell-Logo.svg/330px-Merrell-Logo.svg.png' WHERE slug = 'merrell';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Michael_Kors_Logo.svg/330px-Michael_Kors_Logo.svg.png' WHERE slug = 'michaelkors';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Logo_Moncler_Group.svg/330px-Logo_Moncler_Group.svg.png' WHERE slug = 'moncler';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/New_Balance_logo.svg/330px-New_Balance_logo.svg.png' WHERE slug = 'newbalance';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Logo_NIKE.svg/330px-Logo_NIKE.svg.png' WHERE slug = 'nike';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Oakley_logo.svg/330px-Oakley_logo.svg.png' WHERE slug = 'oakley';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Off-White_Logo.svg/330px-Off-White_Logo.svg.png' WHERE slug = 'off-white';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Prada-Logo.svg/330px-Prada-Logo.svg.png' WHERE slug = 'prada';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Puma-logo-%28text%29.svg/330px-Puma-logo-%28text%29.svg.png' WHERE slug = 'puma';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Ralph_Lauren_logo.svg/330px-Ralph_Lauren_logo.svg.png' WHERE slug = 'ralphlauren';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Reebok_International_logo.svg/330px-Reebok_International_logo.svg.png' WHERE slug = 'reebok';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Reiss_Marke.jpg/330px-Reiss_Marke.jpg' WHERE slug = 'reiss';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Rolex_wordmark_logo.svg/330px-Rolex_wordmark_logo.svg.png' WHERE slug = 'rolex';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Logo_Saucony.svg/330px-Logo_Saucony.svg.png' WHERE slug = 'saucony';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Stone-Island-Logo.svg/330px-Stone-Island-Logo.svg.png' WHERE slug = 'stone-island';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Supreme_Logo.svg/330px-Supreme_Logo.svg.png' WHERE slug = 'supreme';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Timberland-logo.png/330px-Timberland-logo.png' WHERE slug = 'timberland';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Tory_Burch_logo.svg/330px-Tory_Burch_logo.svg.png' WHERE slug = 'toryburch';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Tommy_Hilfiger_logo.svg/330px-Tommy_Hilfiger_logo.svg.png' WHERE slug = 'tommy';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Tudor_%28Uhrenmarke%29_logo.svg/330px-Tudor_%28Uhrenmarke%29_logo.svg.png' WHERE slug = 'tudorwatch';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/UGG_logo.svg/330px-UGG_logo.svg.png' WHERE slug = 'ugg';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Umbro_logo_%28current%29.svg/330px-Umbro_logo_%28current%29.svg.png' WHERE slug = 'umbro';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Under_armour_logo.svg/330px-Under_armour_logo.svg.png' WHERE slug = 'underarmour';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/UNIQLO_logo_%28Japanese%29.svg/330px-UNIQLO_logo_%28Japanese%29.svg.png' WHERE slug = 'uniqlo';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Urban_Outfitters_logo.svg/330px-Urban_Outfitters_logo.svg.png' WHERE slug = 'urbanoutfitters';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Vacheron_logo.svg/330px-Vacheron_logo.svg.png' WHERE slug = 'vacheron-constantin';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Valentino_logo.svg/330px-Valentino_logo.svg.png' WHERE slug = 'valentino';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Vans-logo.svg/330px-Vans-logo.svg.png' WHERE slug = 'vans';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Versace_old_logo.svg/330px-Versace_old_logo.svg.png' WHERE slug = 'versace';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Victoria%27s_Secret_logo.svg/330px-Victoria%27s_Secret_logo.svg.png' WHERE slug = 'victoriassecret';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/f/f4/Weekday_Logo.jpg' WHERE slug = 'weekday';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Wrangler_%28Jeans%29_logo.svg/330px-Wrangler_%28Jeans%29_logo.svg.png' WHERE slug = 'wrangler';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/4/4b/YSL_logo.jpg' WHERE slug = 'ysl';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Zara_Logo.svg/330px-Zara_Logo.svg.png' WHERE slug = 'zara';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Zegna_wordmark.svg/330px-Zegna_wordmark.svg.png' WHERE slug = 'zegna';
UPDATE fashion_brands SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Zalando_logo.svg/330px-Zalando_logo.svg.png' WHERE slug = 'zalando';

-- Clear Pexels from brands with no real logo (let /api/logo fallback handle)
UPDATE fashion_brands SET logo_url = NULL WHERE slug IN ('bape', 'vuoriclothing', 'zenith-watches');

-- ── FOOD BRANDS ───────────────────────────────────────────────
-- Clearbit is dead (shut down 2023). Clear all food brand URLs.
-- The /api/logo endpoint resolves logos from Wikipedia/Wikidata.
UPDATE food_brands SET logo_url = NULL WHERE logo_url IS NOT NULL AND logo_url != '';

-- ── CAR BRANDS ────────────────────────────────────────────────
-- Clear ALL car brand Pexels URLs (let /api/logo fallback handle)
UPDATE car_brands SET logo_url = NULL WHERE logo_url LIKE '%pexels.com%';
