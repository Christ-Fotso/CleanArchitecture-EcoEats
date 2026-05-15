-- ============================================================
-- SEED SCRIPT - Restaurants réels Paris pour test livraison
-- Usage: docker exec -i ecoeats-db psql -U ecoEats -d EcoEats < seed-restaurants.sql
-- ============================================================

-- Créer un utilisateur admin/owner pour les restaurants
INSERT INTO "User" (id, name, email, phone, password_hash, role, is_verified, created_at)
VALUES
  ('owner-resto-1', 'Jean-Pierre Martin', 'jp.martin@ecoeats.fr', '+33145678901', '$2b$10$dummyhashforseeding111111111111111111111111111', 'restaurant_owner', true, NOW()),
  ('owner-resto-2', 'Marie Dubois', 'marie.dubois@ecoeats.fr', '+33145678902', '$2b$10$dummyhashforseeding222222222222222222222222222', 'restaurant_owner', true, NOW()),
  ('owner-resto-3', 'Ahmed Benali', 'ahmed.benali@ecoeats.fr', '+33145678903', '$2b$10$dummyhashforseeding333333333333333333333333333', 'restaurant_owner', true, NOW()),
  ('owner-resto-4', 'Sofia Rossi', 'sofia.rossi@ecoeats.fr', '+33145678904', '$2b$10$dummyhashforseeding444444444444444444444444444', 'restaurant_owner', true, NOW()),
  ('owner-resto-5', 'Kenji Tanaka', 'kenji.tanaka@ecoeats.fr', '+33145678905', '$2b$10$dummyhashforseeding555555555555555555555555555', 'restaurant_owner', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- RESTAURANTS (avec vraies coordonnées GPS Paris)
-- ============================================================
INSERT INTO "Restaurant" (id, owner_id, name, description, address, lat, lng, opening_hours, is_active, rating_avg, cuisine_type, prep_time_min, delivery_fee)
VALUES
  (
    'resto-1',
    'owner-resto-1',
    'Le Bistrot Parisien',
    'Cuisine française traditionnelle au cœur de Montmartre. Spécialités maison : bœuf bourguignon et tarte tatin.',
    '12 Rue Lepic, 75018 Paris',
    48.8865, 2.3360,
    '{"monday":{"open":"11:30","close":"22:00"},"tuesday":{"open":"11:30","close":"22:00"},"wednesday":{"open":"11:30","close":"22:00"},"thursday":{"open":"11:30","close":"22:00"},"friday":{"open":"11:30","close":"23:00"},"saturday":{"open":"12:00","close":"23:00"},"sunday":{"open":"12:00","close":"21:00"}}',
    true, 4.5, 'Française', 25, 2.50
  ),
  (
    'resto-2',
    'owner-resto-2',
    'Sushi Sakura',
    'Authentique cuisine japonaise près de l''Opéra. Sushis préparés à la minute avec du poisson frais.',
    '8 Rue de la Paix, 75002 Paris',
    48.8698, 2.3310,
    '{"monday":{"open":"12:00","close":"14:30","dinner_open":"19:00","dinner_close":"22:30"},"tuesday":{"open":"12:00","close":"14:30","dinner_open":"19:00","dinner_close":"22:30"},"wednesday":{"open":"12:00","close":"14:30","dinner_open":"19:00","dinner_close":"22:30"},"thursday":{"open":"12:00","close":"14:30","dinner_open":"19:00","dinner_close":"22:30"},"friday":{"open":"12:00","close":"14:30","dinner_open":"19:00","dinner_close":"23:00"},"saturday":{"open":"12:00","close":"23:00"},"sunday":{"open":"12:00","close":"21:00"}}',
    true, 4.7, 'Japonaise', 20, 3.00
  ),
  (
    'resto-3',
    'owner-resto-3',
    'Chez Mahmoud',
    'Cuisine libanaise généreuse dans le Marais. Mezze, shawarma et falafel faits maison.',
    '45 Rue de Bretagne, 75003 Paris',
    48.8623, 2.3601,
    '{"monday":{"open":"11:00","close":"23:00"},"tuesday":{"open":"11:00","close":"23:00"},"wednesday":{"open":"11:00","close":"23:00"},"thursday":{"open":"11:00","close":"23:00"},"friday":{"open":"11:00","close":"00:00"},"saturday":{"open":"11:00","close":"00:00"},"sunday":{"open":"12:00","close":"22:00"}}',
    true, 4.3, 'Libanaise', 15, 2.00
  ),
  (
    'resto-4',
    'owner-resto-4',
    'La Pizzeria Roma',
    'Pizzas napolitaines cuites au feu de bois dans le 5ème arrondissement. Pâte à la farine italienne importée.',
    '22 Rue Mouffetard, 75005 Paris',
    48.8428, 2.3507,
    '{"monday":{"open":"12:00","close":"14:30","dinner_open":"18:30","dinner_close":"23:00"},"tuesday":{"open":"12:00","close":"14:30","dinner_open":"18:30","dinner_close":"23:00"},"wednesday":{"open":"12:00","close":"14:30","dinner_open":"18:30","dinner_close":"23:00"},"thursday":{"open":"12:00","close":"14:30","dinner_open":"18:30","dinner_close":"23:00"},"friday":{"open":"12:00","close":"14:30","dinner_open":"18:30","dinner_close":"23:30"},"saturday":{"open":"12:00","close":"23:30"},"sunday":{"open":"12:00","close":"22:30"}}',
    true, 4.6, 'Italienne', 20, 2.50
  ),
  (
    'resto-5',
    'owner-resto-5',
    'Tokyo Ramen House',
    'Ramens authentiques et gyozas croustillants près de la Tour Eiffel. Bouillons mijotés 12h.',
    '3 Avenue de Suffren, 75007 Paris',
    48.8507, 2.3000,
    '{"monday":{"open":"11:30","close":"22:30"},"tuesday":{"open":"11:30","close":"22:30"},"wednesday":{"open":"11:30","close":"22:30"},"thursday":{"open":"11:30","close":"22:30"},"friday":{"open":"11:30","close":"23:00"},"saturday":{"open":"11:30","close":"23:00"},"sunday":{"open":"12:00","close":"22:00"}}',
    true, 4.8, 'Japonaise', 18, 2.80
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- CATÉGORIES DE MENU
-- ============================================================
INSERT INTO "MenuCategory" (id, restaurant_id, name, position, availability)
VALUES
  -- Le Bistrot Parisien
  ('cat-1-1', 'resto-1', 'Entrées', 1, 'always'),
  ('cat-1-2', 'resto-1', 'Plats', 2, 'always'),
  ('cat-1-3', 'resto-1', 'Desserts', 3, 'always'),
  -- Sushi Sakura
  ('cat-2-1', 'resto-2', 'Sushis & Makis', 1, 'always'),
  ('cat-2-2', 'resto-2', 'Plats chauds', 2, 'always'),
  ('cat-2-3', 'resto-2', 'Desserts japonais', 3, 'always'),
  -- Chez Mahmoud
  ('cat-3-1', 'resto-3', 'Mezze', 1, 'always'),
  ('cat-3-2', 'resto-3', 'Grillades', 2, 'always'),
  ('cat-3-3', 'resto-3', 'Sandwichs', 3, 'always'),
  -- La Pizzeria Roma
  ('cat-4-1', 'resto-4', 'Pizzas', 1, 'always'),
  ('cat-4-2', 'resto-4', 'Pâtes', 2, 'always'),
  ('cat-4-3', 'resto-4', 'Antipasti', 3, 'always'),
  -- Tokyo Ramen House
  ('cat-5-1', 'resto-5', 'Ramens', 1, 'always'),
  ('cat-5-2', 'resto-5', 'Gyozas & Entrées', 2, 'always'),
  ('cat-5-3', 'resto-5', 'Boissons', 3, 'always')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- ARTICLES DU MENU
-- ============================================================
INSERT INTO "MenuItem" (id, category_id, restaurant_id, name, description, price, is_available, stock)
VALUES
  -- Le Bistrot Parisien - Entrées
  ('item-1-1', 'cat-1-1', 'resto-1', 'Soupe à l''oignon gratinée', 'Soupe à l''oignon traditionnelle avec croûton et fromage fondu', 8.50, true, 50),
  ('item-1-2', 'cat-1-1', 'resto-1', 'Escargots de Bourgogne', '6 escargots au beurre persillé aillé', 12.00, true, 30),
  -- Le Bistrot Parisien - Plats
  ('item-1-3', 'cat-1-2', 'resto-1', 'Bœuf Bourguignon', 'Mijoté 3h, servi avec pommes de terre vapeur', 18.50, true, 20),
  ('item-1-4', 'cat-1-2', 'resto-1', 'Confit de Canard', 'Cuisse confite, pommes sarladaises et salade verte', 19.00, true, 15),
  ('item-1-5', 'cat-1-2', 'resto-1', 'Croque Monsieur Deluxe', 'Pain brioché, jambon de Paris, béchamel maison, emmental', 11.00, true, 40),
  -- Le Bistrot Parisien - Desserts
  ('item-1-6', 'cat-1-3', 'resto-1', 'Tarte Tatin', 'Tarte aux pommes caramélisées avec crème fraîche', 7.50, true, 20),
  ('item-1-7', 'cat-1-3', 'resto-1', 'Crème Brûlée', 'Crème vanillée avec caramel craquant', 6.50, true, 25),

  -- Sushi Sakura - Sushis
  ('item-2-1', 'cat-2-1', 'resto-2', 'Plateau Sushi 12 pièces', 'Sélection de saumon, thon, crevette et daurade', 22.00, true, 30),
  ('item-2-2', 'cat-2-1', 'resto-2', 'California Rolls (8 pcs)', 'Avocat, crabe, concombre, sésame', 11.50, true, 40),
  ('item-2-3', 'cat-2-1', 'resto-2', 'Salmon Maki (6 pcs)', 'Saumon frais et riz vinaigré', 9.00, true, 50),
  -- Sushi Sakura - Plats chauds
  ('item-2-4', 'cat-2-2', 'resto-2', 'Ramen Miso', 'Bouillon miso, porc, œuf mollet, nori', 16.00, true, 25),
  ('item-2-5', 'cat-2-2', 'resto-2', 'Katsu Curry', 'Escalope de poulet panée, riz et sauce curry japonaise', 17.50, true, 20),
  -- Sushi Sakura - Desserts
  ('item-2-6', 'cat-2-3', 'resto-2', 'Mochi Glacé', '3 mochis (matcha, fraise, vanille)', 7.00, true, 30),

  -- Chez Mahmoud - Mezze
  ('item-3-1', 'cat-3-1', 'resto-3', 'Houmous maison', 'Pois chiches, tahini, citron, huile d''olive', 6.50, true, 60),
  ('item-3-2', 'cat-3-1', 'resto-3', 'Assiette Mezze', 'Houmous, taboulé, fattoush, labneh, pain pita', 14.00, true, 25),
  ('item-3-3', 'cat-3-1', 'resto-3', 'Falafel (6 pcs)', 'Falafels aux pois chiches et herbes fraîches', 8.00, true, 50),
  -- Chez Mahmoud - Grillades
  ('item-3-4', 'cat-3-2', 'resto-3', 'Chawarma Poulet', 'Poulet mariné aux épices, légumes grillés, sauce ail', 14.50, true, 30),
  ('item-3-5', 'cat-3-2', 'resto-3', 'Kafta Grillée', '3 brochettes de viande hachée aux herbes', 15.00, true, 25),
  -- Chez Mahmoud - Sandwichs
  ('item-3-6', 'cat-3-3', 'resto-3', 'Sandwich Falafel', 'Pain pita, falafel, crudités, tahini', 8.50, true, 40),
  ('item-3-7', 'cat-3-3', 'resto-3', 'Sandwich Chawarma', 'Pain pita, poulet mariné, tomates, sauce blanche', 10.00, true, 35),

  -- La Pizzeria Roma - Pizzas
  ('item-4-1', 'cat-4-1', 'resto-4', 'Margherita', 'Tomate San Marzano, mozzarella di bufala, basilic frais', 13.00, true, 40),
  ('item-4-2', 'cat-4-1', 'resto-4', 'Quatre Fromages', 'Mozzarella, gorgonzola, parmesan, chèvre', 15.50, true, 35),
  ('item-4-3', 'cat-4-1', 'resto-4', 'Diavola', 'Salami piquant, tomate, mozzarella, piment', 14.50, true, 30),
  ('item-4-4', 'cat-4-1', 'resto-4', 'Pizza Saumon', 'Crème fraîche, saumon fumé, câpres, roquette', 16.00, true, 25),
  -- La Pizzeria Roma - Pâtes
  ('item-4-5', 'cat-4-2', 'resto-4', 'Spaghetti Carbonara', 'Guanciale, œuf, pecorino, poivre noir', 14.00, true, 30),
  ('item-4-6', 'cat-4-2', 'resto-4', 'Penne Arrabiata', 'Tomate, ail, piment, basilic', 12.00, true, 35),
  -- La Pizzeria Roma - Antipasti
  ('item-4-7', 'cat-4-3', 'resto-4', 'Burrata & Tomates', 'Burrata crémeuse, tomates cerises, basilic, huile d''olive', 11.00, true, 20),

  -- Tokyo Ramen House - Ramens
  ('item-5-1', 'cat-5-1', 'resto-5', 'Tonkotsu Ramen', 'Bouillon de porc 12h, chashu, œuf mollet, maïs, nori', 17.00, true, 30),
  ('item-5-2', 'cat-5-1', 'resto-5', 'Shoyu Ramen', 'Bouillon soja, poulet, bambou, champignons shiitake', 15.50, true, 30),
  ('item-5-3', 'cat-5-1', 'resto-5', 'Ramen Végétarien', 'Bouillon légumes, tofu, champignons, épinards', 14.00, true, 25),
  -- Tokyo Ramen House - Gyozas
  ('item-5-4', 'cat-5-2', 'resto-5', 'Gyozas Porc (6 pcs)', 'Raviolis japonais porc et chou, sauce ponzu', 9.50, true, 50),
  ('item-5-5', 'cat-5-2', 'resto-5', 'Gyozas Crevettes (6 pcs)', 'Raviolis crevettes et gingembre', 10.50, true, 40),
  ('item-5-6', 'cat-5-2', 'resto-5', 'Edamame', 'Fèves de soja vapeur, fleur de sel', 5.50, true, 60),
  -- Tokyo Ramen House - Boissons
  ('item-5-7', 'cat-5-3', 'resto-5', 'Thé Matcha Glacé', 'Thé vert matcha premium, sucre de canne', 4.50, true, 80),
  ('item-5-8', 'cat-5-3', 'resto-5', 'Ramune', 'Limonade japonaise à la bille (citron, fraise, melon)', 3.50, true, 100)
ON CONFLICT (id) DO NOTHING;

-- Confirmation
SELECT r.name, r.address, r.lat, r.lng, r.cuisine_type, COUNT(mi.id) as nb_articles
FROM "Restaurant" r
JOIN "MenuCategory" mc ON mc.restaurant_id = r.id
JOIN "MenuItem" mi ON mi.category_id = mc.id
WHERE r.id IN ('resto-1','resto-2','resto-3','resto-4','resto-5')
GROUP BY r.id, r.name, r.address, r.lat, r.lng, r.cuisine_type
ORDER BY r.name;
