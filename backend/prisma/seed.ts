import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL || "",
  }),
});

async function main() {
  console.log("🌱 Seeding EcoEats (NETTOYAGE RADICAL par noms)...");

  const seedNames = [
    "Le Bistrot Parisien", "Sushi Sakura", "Chez Mahmoud", 
    "La Pizzeria Roma", "Tokyo Ramen House"
  ];

  // On supprime TOUT ce qui porte ces noms (même les vieux IDs)
  await prisma.menuItem.deleteMany({ where: { category: { restaurant: { name: { in: seedNames } } } } });
  await prisma.menuCategory.deleteMany({ where: { restaurant: { name: { in: seedNames } } } });
  await prisma.restaurant.deleteMany({ where: { name: { in: seedNames } } });

  const passwordHash = await bcrypt.hash("Password123!", 10);

  // ─────────────────────────────────────────────
  // Helper : upsert utilisateur (sans doublon)
  // ─────────────────────────────────────────────
  const upsertUser = async (email: string, name: string, role: any, phone: string) => {
    const user = await prisma.user.upsert({
      where:  { email },
      update: {},
      create: { email, name, role, phone, phone_verified: true },
    });
    await prisma.authIdentity.upsert({
      where:  { provider_provider_user_id: { provider: "password", provider_user_id: email } },
      update: {},
      create: {
        user_id:          user.id,
        provider:         "password",
        provider_user_id: email,
        password_hash:    passwordHash,
      },
    });
    return user;
  };

  // ─────────────────────────────────────────────
  // Helper : seed menu uniquement si vide
  // ─────────────────────────────────────────────
  const seedMenuIfEmpty = async (restaurantId: string, restaurantName: string, seedFn: () => Promise<void>) => {
    const existing = await prisma.menuCategory.count({ where: { restaurant_id: restaurantId } });
    if (existing === 0) {
      console.log(`   🌱 Insertion du menu pour : ${restaurantName}...`);
      await seedFn();
    } else {
      console.log(`   ✅ Menu déjà présent pour ${restaurantName} (${existing} catégories).`);
    }
  };


  // ─────────────────────────────────────────────
  // Utilisateurs
  // ─────────────────────────────────────────────
  const clientU = await upsertUser("client@ecoeats.fr",      "Jean Client",       "CLIENT",           "0601010101");
  const driverU = await upsertUser("driver@fast.fr",         "Vite Livreur",      "DRIVER",           "0603030303");
  await           upsertUser("admin@ecoeats.fr",             "Admin EcoEats",     "ADMIN",            "0604040404");
  const owner1  = await upsertUser("jp.martin@ecoeats.fr",   "Jean-Pierre Martin","RESTAURANT_OWNER", "0145678901");
  const owner2  = await upsertUser("marie.dubois@ecoeats.fr","Marie Dubois",      "RESTAURANT_OWNER", "0145678902");
  const owner3  = await upsertUser("ahmed.benali@ecoeats.fr","Ahmed Benali",      "RESTAURANT_OWNER", "0145678903");
  const owner4  = await upsertUser("sofia.rossi@ecoeats.fr", "Sofia Rossi",       "RESTAURANT_OWNER", "0145678904");
  const owner5  = await upsertUser("kenji.tanaka@ecoeats.fr","Kenji Tanaka",      "RESTAURANT_OWNER", "0145678905");

  // ─────────────────────────────────────────────
  // Helper : trouve ou crée un restaurant par ID fixe
  // ─────────────────────────────────────────────
  const upsertRestaurant = async (id: string, name: string, createData: any) => {
    return prisma.restaurant.upsert({
      where:  { id },
      update: { name, ...createData },
      create: { id, name, ...createData },
    });
  };

  const hours = {
    monday: { open: "11:30", close: "22:30" }, tuesday:   { open: "11:30", close: "22:30" },
    wednesday: { open: "11:30", close: "22:30" }, thursday: { open: "11:30", close: "22:30" },
    friday: { open: "11:30", close: "23:00" }, saturday:  { open: "12:00", close: "23:00" },
    sunday: { open: "12:00", close: "21:30" },
  };

  // ─────────────────────────────────────────────
  // Restaurant 1 - Le Bistrot Parisien (Montmartre)
  // ─────────────────────────────────────────────
  const resto1 = await upsertRestaurant("seed-resto-bistrot", "Le Bistrot Parisien", {
    owner_id: owner1.id, description: "Cuisine française traditionnelle au cœur de Montmartre.",
    address: "12 Rue Lepic, 75018 Paris", lat: 48.8865, lng: 2.3360,
    is_active: true, cuisine_type: "Française", prep_time_min: 25, delivery_fee: 2.50, opening_hours: hours,
  });
  await seedMenuIfEmpty(resto1.id, "Le Bistrot Parisien", async () => {
    const e = await prisma.menuCategory.create({ data: { restaurant_id: resto1.id, name: "Entrées",  position: 1, availability: "always" } });
    const p = await prisma.menuCategory.create({ data: { restaurant_id: resto1.id, name: "Plats",    position: 2, availability: "always" } });
    const d = await prisma.menuCategory.create({ data: { restaurant_id: resto1.id, name: "Desserts", position: 3, availability: "always" } });
    await prisma.menuItem.createMany({ data: [
      { category_id: e.id, name: "Soupe à l'oignon gratinée", description: "Soupe traditionnelle, croûton et fromage fondu",      price: 8.50,  is_available: true, is_popular: false, daily_stock: 50 },
      { category_id: e.id, name: "Escargots de Bourgogne",    description: "6 escargots au beurre persillé aillé",                price: 12.00, is_available: true, is_popular: false, daily_stock: 30 },
      { category_id: p.id, name: "Bœuf Bourguignon",          description: "Mijoté 3h, servi avec pommes de terre vapeur",        price: 18.50, is_available: true, is_popular: true,  daily_stock: 20 },
      { category_id: p.id, name: "Confit de Canard",          description: "Cuisse confite, pommes sarladaises et salade verte",  price: 19.00, is_available: true, is_popular: false, daily_stock: 15 },
      { category_id: p.id, name: "Croque Monsieur Deluxe",    description: "Pain brioché, jambon de Paris, béchamel maison",      price: 11.00, is_available: true, is_popular: false, daily_stock: 40 },
      { category_id: d.id, name: "Tarte Tatin",               description: "Tarte aux pommes caramélisées, crème fraîche",        price: 7.50,  is_available: true, is_popular: false, daily_stock: 20 },
      { category_id: d.id, name: "Crème Brûlée",              description: "Crème vanillée avec caramel craquant",               price: 6.50,  is_available: true, is_popular: false, daily_stock: 25 },
    ]});
  });
  console.log("✅ Le Bistrot Parisien - Montmartre (48.8865, 2.3360)");

  // ─────────────────────────────────────────────
  // Restaurant 2 - Sushi Sakura (Opéra)
  // ─────────────────────────────────────────────
  const resto2 = await upsertRestaurant("seed-resto-sushi", "Sushi Sakura", {
    owner_id: owner2.id, description: "Authentique cuisine japonaise près de l'Opéra. Sushis préparés à la minute.",
    address: "8 Rue de la Paix, 75002 Paris", lat: 48.8698, lng: 2.3310,
    is_active: true, cuisine_type: "Japonaise", prep_time_min: 20, delivery_fee: 3.00, opening_hours: hours,
  });
  await seedMenuIfEmpty(resto2.id, "Sushi Sakura", async () => {
    const s = await prisma.menuCategory.create({ data: { restaurant_id: resto2.id, name: "Sushis & Makis", position: 1, availability: "always" } });
    const c = await prisma.menuCategory.create({ data: { restaurant_id: resto2.id, name: "Plats chauds",   position: 2, availability: "always" } });
    const d = await prisma.menuCategory.create({ data: { restaurant_id: resto2.id, name: "Desserts",       position: 3, availability: "always" } });
    await prisma.menuItem.createMany({ data: [
      { category_id: s.id, name: "Plateau Sushi 12 pièces",  description: "Saumon, thon, crevette, daurade",          price: 22.00, is_available: true, is_popular: true,  daily_stock: 30 },
      { category_id: s.id, name: "California Rolls (8 pcs)", description: "Avocat, crabe, concombre, sésame",          price: 11.50, is_available: true, is_popular: false, daily_stock: 40 },
      { category_id: s.id, name: "Salmon Maki (6 pcs)",      description: "Saumon frais et riz vinaigré",              price: 9.00,  is_available: true, is_popular: false, daily_stock: 50 },
      { category_id: c.id, name: "Ramen Miso",               description: "Bouillon miso, porc, œuf mollet, nori",    price: 16.00, is_available: true, is_popular: true,  daily_stock: 25 },
      { category_id: c.id, name: "Katsu Curry",              description: "Poulet pané, riz et sauce curry japonaise", price: 17.50, is_available: true, is_popular: false, daily_stock: 20 },
      { category_id: d.id, name: "Mochi Glacé (3 pcs)",      description: "Matcha, fraise, vanille",                  price: 7.00,  is_available: true, is_popular: false, daily_stock: 30 },
    ]});
  });
  console.log("✅ Sushi Sakura - Opéra (48.8698, 2.3310)");

  // ─────────────────────────────────────────────
  // Restaurant 3 - Chez Mahmoud (Le Marais)
  // ─────────────────────────────────────────────
  const resto3 = await upsertRestaurant("seed-resto-mahmoud", "Chez Mahmoud", {
    owner_id: owner3.id, description: "Cuisine libanaise généreuse dans le Marais. Mezze, shawarma et falafel faits maison.",
    address: "45 Rue de Bretagne, 75003 Paris", lat: 48.8623, lng: 2.3601,
    is_active: true, cuisine_type: "Libanaise", prep_time_min: 15, delivery_fee: 2.00, opening_hours: hours,
  });
  await seedMenuIfEmpty(resto3.id, "Chez Mahmoud", async () => {
    const m = await prisma.menuCategory.create({ data: { restaurant_id: resto3.id, name: "Mezze",     position: 1, availability: "always" } });
    const g = await prisma.menuCategory.create({ data: { restaurant_id: resto3.id, name: "Grillades", position: 2, availability: "always" } });
    const s = await prisma.menuCategory.create({ data: { restaurant_id: resto3.id, name: "Sandwichs", position: 3, availability: "always" } });
    await prisma.menuItem.createMany({ data: [
      { category_id: m.id, name: "Houmous maison",    description: "Pois chiches, tahini, citron, huile d'olive",        price: 6.50,  is_available: true, is_popular: false, daily_stock: 60 },
      { category_id: m.id, name: "Assiette Mezze",    description: "Houmous, taboulé, fattoush, labneh, pain pita",      price: 14.00, is_available: true, is_popular: true,  daily_stock: 25 },
      { category_id: m.id, name: "Falafel (6 pcs)",   description: "Falafels aux pois chiches et herbes fraîches",       price: 8.00,  is_available: true, is_popular: false, daily_stock: 50 },
      { category_id: g.id, name: "Chawarma Poulet",   description: "Poulet mariné aux épices, légumes grillés, sauce ail",price: 14.50, is_available: true, is_popular: true,  daily_stock: 30 },
      { category_id: g.id, name: "Kafta Grillée",     description: "3 brochettes de viande hachée aux herbes",           price: 15.00, is_available: true, is_popular: false, daily_stock: 25 },
      { category_id: s.id, name: "Sandwich Falafel",  description: "Pain pita, falafel, crudités, tahini",               price: 8.50,  is_available: true, is_popular: false, daily_stock: 40 },
      { category_id: s.id, name: "Sandwich Chawarma", description: "Pain pita, poulet mariné, tomates, sauce blanche",   price: 10.00, is_available: true, is_popular: false, daily_stock: 35 },
    ]});
  });
  console.log("✅ Chez Mahmoud - Le Marais (48.8623, 2.3601)");

  // ─────────────────────────────────────────────
  // Restaurant 4 - La Pizzeria Roma (Mouffetard)
  // ─────────────────────────────────────────────
  const resto4 = await upsertRestaurant("seed-resto-pizza", "La Pizzeria Roma", {
    owner_id: owner4.id, description: "Pizzas napolitaines cuites au feu de bois. Pâte à la farine italienne importée.",
    address: "22 Rue Mouffetard, 75005 Paris", lat: 48.8428, lng: 2.3507,
    is_active: true, cuisine_type: "Italienne", prep_time_min: 20, delivery_fee: 2.50, opening_hours: hours,
  });
  await seedMenuIfEmpty(resto4.id, "La Pizzeria Roma", async () => {
    const p = await prisma.menuCategory.create({ data: { restaurant_id: resto4.id, name: "Pizzas",    position: 1, availability: "always" } });
    const a = await prisma.menuCategory.create({ data: { restaurant_id: resto4.id, name: "Pâtes",     position: 2, availability: "always" } });
    const t = await prisma.menuCategory.create({ data: { restaurant_id: resto4.id, name: "Antipasti", position: 3, availability: "always" } });
    await prisma.menuItem.createMany({ data: [
      { category_id: p.id, name: "Margherita",          description: "Tomate San Marzano, mozzarella di bufala, basilic",  price: 13.00, is_available: true, is_popular: false, daily_stock: 40 },
      { category_id: p.id, name: "Quatre Fromages",     description: "Mozzarella, gorgonzola, parmesan, chèvre",           price: 15.50, is_available: true, is_popular: true,  daily_stock: 35 },
      { category_id: p.id, name: "Diavola",             description: "Salami piquant, tomate, mozzarella, piment",         price: 14.50, is_available: true, is_popular: false, daily_stock: 30 },
      { category_id: p.id, name: "Pizza Saumon",        description: "Crème fraîche, saumon fumé, câpres, roquette",       price: 16.00, is_available: true, is_popular: false, daily_stock: 25 },
      { category_id: a.id, name: "Spaghetti Carbonara", description: "Guanciale, œuf, pecorino, poivre noir",              price: 14.00, is_available: true, is_popular: true,  daily_stock: 30 },
      { category_id: a.id, name: "Penne Arrabiata",     description: "Tomate, ail, piment, basilic",                       price: 12.00, is_available: true, is_popular: false, daily_stock: 35 },
      { category_id: t.id, name: "Burrata & Tomates",   description: "Burrata crémeuse, tomates cerises, basilic, huile d'olive", price: 11.00, is_available: true, is_popular: false, daily_stock: 20 },
    ]});
  });
  console.log("✅ La Pizzeria Roma - Mouffetard (48.8428, 2.3507)");

  // ─────────────────────────────────────────────
  // Restaurant 5 - Tokyo Ramen House (Tour Eiffel)
  // ─────────────────────────────────────────────
  const resto5 = await upsertRestaurant("seed-resto-ramen", "Tokyo Ramen House", {
    owner_id: owner5.id, description: "Ramens authentiques et gyozas croustillants près de la Tour Eiffel. Bouillons mijotés 12h.",
    address: "3 Avenue de Suffren, 75007 Paris", lat: 48.8507, lng: 2.3000,
    is_active: true, cuisine_type: "Japonaise", prep_time_min: 18, delivery_fee: 2.80, opening_hours: hours,
  });
  await seedMenuIfEmpty(resto5.id, "Tokyo Ramen House", async () => {
    const r = await prisma.menuCategory.create({ data: { restaurant_id: resto5.id, name: "Ramens",           position: 1, availability: "always" } });
    const g = await prisma.menuCategory.create({ data: { restaurant_id: resto5.id, name: "Gyozas & Entrées", position: 2, availability: "always" } });
    const b = await prisma.menuCategory.create({ data: { restaurant_id: resto5.id, name: "Boissons",          position: 3, availability: "always" } });
    await prisma.menuItem.createMany({ data: [
      { category_id: r.id, name: "Tonkotsu Ramen",           description: "Bouillon porc 12h, chashu, œuf mollet, maïs, nori",  price: 17.00, is_available: true, is_popular: true,  daily_stock: 30 },
      { category_id: r.id, name: "Shoyu Ramen",              description: "Bouillon soja, poulet, bambou, champignons shiitake", price: 15.50, is_available: true, is_popular: false, daily_stock: 30 },
      { category_id: r.id, name: "Ramen Végétarien",         description: "Bouillon légumes, tofu, champignons, épinards",       price: 14.00, is_available: true, is_popular: false, daily_stock: 25 },
      { category_id: g.id, name: "Gyozas Porc (6 pcs)",      description: "Raviolis japonais porc et chou, sauce ponzu",        price: 9.50,  is_available: true, is_popular: true,  daily_stock: 50 },
      { category_id: g.id, name: "Gyozas Crevettes (6 pcs)", description: "Raviolis crevettes et gingembre",                   price: 10.50, is_available: true, is_popular: false, daily_stock: 40 },
      { category_id: g.id, name: "Edamame",                  description: "Fèves de soja vapeur, fleur de sel",                 price: 5.50,  is_available: true, is_popular: false, daily_stock: 60 },
      { category_id: b.id, name: "Thé Matcha Glacé",         description: "Thé vert matcha premium, sucre de canne",            price: 4.50,  is_available: true, is_popular: false, daily_stock: 80 },
      { category_id: b.id, name: "Ramune",                   description: "Limonade japonaise à la bille",                      price: 3.50,  is_available: true, is_popular: false, daily_stock: 100 },
    ]});
  });
  console.log("✅ Tokyo Ramen House - Tour Eiffel (48.8507, 2.3000)");

  // ─────────────────────────────────────────────
  // Driver & Méthode de paiement client
  // ─────────────────────────────────────────────
  const existingDriver = await prisma.driver.findUnique({ where: { user_id: driverU.id } });
  if (!existingDriver) {
    await prisma.driver.create({
      data: {
        name: "Vite Livreur", email: "driver@fast.fr", phone: "0603030303",
        transport_type: "bike", is_online: true, is_verified: true, is_expert: true,
        lat: 48.8600, lng: 2.3400, user: { connect: { id: driverU.id } },
      },
    });
  }

  const existingPm = await prisma.paymentMethod.findFirst({ where: { user_id: clientU.id } });
  if (!existingPm) {
    await prisma.paymentMethod.create({
      data: { user_id: clientU.id, stripe_token: "pm_card_visa", type: "cb", label: "Visa •••• 4242", is_default: true },
    });
  }

  console.log("");
  console.log("══════════════════════════════════════════════════");
  console.log("🎉 Seeding terminé ! (idempotent - 0 doublon)");
  console.log("══════════════════════════════════════════════════");
  console.log("👑 COMPTE ADMIN (accès tableau de bord complet) :");
  console.log("   Email    : admin@ecoeats.fr");
  console.log("   Password : Password123!");
  console.log("──────────────────────────────────────────────────");
  console.log("📧 Autres comptes de test (Password123!) :");
  console.log("   Client  : client@ecoeats.fr");
  console.log("   Driver  : driver@fast.fr");
  console.log("──────────────────────────────────────────────────");
  console.log("🗺️  5 restaurants parisiens (avec menus) :");
  console.log("   1. Le Bistrot Parisien  - 12 Rue Lepic, 75018       (7 plats)");
  console.log("   2. Sushi Sakura         - 8 Rue de la Paix, 75002   (6 plats)");
  console.log("   3. Chez Mahmoud         - 45 Rue de Bretagne, 75003 (7 plats)");
  console.log("   4. La Pizzeria Roma     - 22 Rue Mouffetard, 75005  (7 plats)");
  console.log("   5. Tokyo Ramen House    - 3 Av. de Suffren, 75007   (8 plats)");
  console.log("══════════════════════════════════════════════════");
}

main()
  .catch((e) => { console.error("❌ Erreur seed:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
