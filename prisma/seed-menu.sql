INSERT INTO "Restaurant" ("id", "name", "description", "image", "address", "createdAt")
VALUES
  (
    'rest-burger-house',
    'Stack House Grill',
    'Premium burgers, crispy sides, and fast delivery combos.',
    '/home-crops/combo-clean-v2.png',
    'Peace Avenue 99',
    NOW()
  ),
  (
    'rest-fire-crust',
    'Fire Crust Pizza',
    'Stone-baked pizza slices with bold sauce and melty cheese.',
    '/home-crops/combo-clean-v2.png',
    'Olympic Street 14',
    NOW()
  ),
  (
    'rest-green-bowl',
    'Green Bowl Kitchen',
    'Fresh salads, light bowls, and balanced everyday bites.',
    '/home-crops/combo-clean-v2.png',
    'Seoul Street 21',
    NOW()
  )
ON CONFLICT ("id") DO UPDATE
SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "image" = EXCLUDED."image",
  "address" = EXCLUDED."address";

INSERT INTO "Food" ("id", "name", "description", "price", "image", "category", "restaurantId", "createdAt")
VALUES
  (
    'food-double-burger',
    'Classic Smash Burger',
    'Two smashed beef patties, cheddar, pickles, and smoky house sauce.',
    16500,
    '/home-crops/burger1-clean-v2.png',
    'Burger',
    'rest-burger-house',
    NOW()
  ),
  (
    'food-big-cheese',
    'Big Cheese Burger',
    'Double beef, melted cheese, lettuce, tomato, and signature sauce.',
    18900,
    '/home-crops/burger1-clean-v2.png',
    'Burger',
    'rest-burger-house',
    NOW()
  ),
  (
    'food-spicy-chicken',
    'Spicy Chicken Burger',
    'Crispy chicken, cool slaw, pickles, and a hot glaze.',
    16900,
    '/home-crops/burger2-clean-v2.png',
    'Chicken',
    'rest-burger-house',
    NOW()
  ),
  (
    'food-bacon-deluxe',
    'Bacon Deluxe Burger',
    'Beef, bacon, cheddar, egg, and stacked fresh greens.',
    20900,
    '/home-crops/burger3-clean-v2.png',
    'Burger',
    'rest-burger-house',
    NOW()
  ),
  (
    'food-cheesy-fries',
    'Cheesy Fries',
    'Golden fries served with creamy cheese dip on the side.',
    9900,
    '/home-crops/fries-clean-v2.png',
    'Fries',
    'rest-burger-house',
    NOW()
  ),
  (
    'food-chicken-nuggets',
    'Chicken Nuggets',
    'Juicy chicken nuggets with a crisp golden finish.',
    8900,
    '/home-crops/nuggets-clean-v2.png',
    'Chicken',
    'rest-burger-house',
    NOW()
  ),
  (
    'food-coca-cola',
    'Coca Cola',
    'Classic Coca Cola served ice-cold in a 330 ml bottle.',
    3000,
    '/home-crops/cola-clean-v2.png',
    'Drink',
    'rest-burger-house',
    NOW()
  ),
  (
    'food-garlic-aioli',
    'Garlic Aioli Dip',
    'Creamy roasted garlic sauce that pairs with fries and nuggets.',
    2500,
    '/home-crops/fries-clean-v2.png',
    'Sauce',
    'rest-burger-house',
    NOW()
  ),
  (
    'food-margherita-pizza',
    'Margherita Pizza',
    'Tomato sauce, mozzarella, basil, and a clean oven finish.',
    14900,
    '/home-crops/combo-clean-v2.png',
    'Pizza',
    'rest-fire-crust',
    NOW()
  ),
  (
    'food-caesar-salad',
    'Caesar Crunch Salad',
    'Romaine, parmesan, croutons, and creamy Caesar dressing.',
    12900,
    '/home-crops/combo-clean-v2.png',
    'Salad',
    'rest-green-bowl',
    NOW()
  ),
  (
    'food-truffle-smash',
    'Truffle Smash Burger',
    'Smashed beef, melted cheddar, truffle mayo, and caramelized onions.',
    19800,
    '/home-crops/burger1-clean-v2.png',
    'Burger',
    'rest-burger-house',
    NOW()
  ),
  (
    'food-volcano-chicken',
    'Volcano Chicken Burger',
    'Crispy chicken, spicy pepper glaze, slaw, and creamy ranch.',
    17600,
    '/home-crops/burger2-clean-v2.png',
    'Chicken',
    'rest-burger-house',
    NOW()
  ),
  (
    'food-black-pepper-bacon',
    'Black Pepper Bacon Burger',
    'Beef, pepper bacon, sharp cheddar, and roasted garlic mayo.',
    21800,
    '/home-crops/burger3-clean-v2.png',
    'Burger',
    'rest-burger-house',
    NOW()
  ),
  (
    'food-midnight-umami-combo',
    'Midnight Umami Combo',
    'Signature burger, golden fries, and a chilled cola for late-night cravings.',
    24900,
    '/home-crops/combo-clean-v2.png',
    'Combo',
    'rest-burger-house',
    NOW()
  ),
  (
    'food-firehouse-combo',
    'Firehouse Feast Combo',
    'Double burger combo with seasoned fries and a refreshing soft drink.',
    26900,
    '/home-crops/combo-clean-v2.png',
    'Combo',
    'rest-burger-house',
    NOW()
  ),
  (
    'food-loaded-fries',
    'Loaded House Fries',
    'Crispy fries topped with cheese sauce, herbs, and a smoky spice blend.',
    11900,
    '/home-crops/fries-clean-v2.png',
    'Fries',
    'rest-burger-house',
    NOW()
  ),
  (
    'food-popcorn-chicken',
    'Popcorn Chicken Bites',
    'Crunchy bite-sized chicken pieces with a juicy center and pepper dust.',
    10900,
    '/home-crops/nuggets-clean-v2.png',
    'Chicken',
    'rest-burger-house',
    NOW()
  ),
  (
    'food-cherry-cola-float',
    'Cherry Cola Float',
    'Cold cherry cola with a creamy vanilla finish and extra fizz.',
    4900,
    '/home-crops/cola-clean-v2.png',
    'Drink',
    'rest-burger-house',
    NOW()
  )
ON CONFLICT ("id") DO UPDATE
SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "price" = EXCLUDED."price",
  "image" = EXCLUDED."image",
  "category" = EXCLUDED."category",
  "restaurantId" = EXCLUDED."restaurantId";

UPDATE "Food"
SET
  "category" = 'Burger',
  "description" = 'Two smashed beef patties, cheddar, pickles, and smoky house sauce.',
  "image" = '/home-crops/burger1-clean-v2.png'
WHERE "name" = 'Double Burger';
