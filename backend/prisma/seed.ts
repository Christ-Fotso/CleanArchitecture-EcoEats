import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL || "",
  }),
});

async function main() {
  console.log("🌱 Début du seeding EcoEats...");

  // --- Nettoyage dans l'ordre des dépendances ---
  await prisma.orderStatusHistory.deleteMany();
  await prisma.orderItemSelection.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.driverEarning.deleteMany();
  await prisma.supportMessage.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.review.deleteMany();
  await prisma.loyaltyPoint.deleteMany();
  await prisma.order.deleteMany();
  await prisma.userAddress.deleteMany();
  await prisma.paymentMethod.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.referral.deleteMany();
  await prisma.document.deleteMany();
  await prisma.menuItemOptionValue.deleteMany();
  await prisma.menuItemOption.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.menuCategory.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.authIdentity.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("Password123!", 10);

  const createUser = async (email: string, name: string, role: any, phone: string) => {
    const user = await prisma.user.create({
      data: { email, name, role, phone, phone_verified: true },
    });
    await prisma.authIdentity.create({
      data: {
        user_id: user.id,
        provider: "password",
        provider_user_id: email,
        password_hash: passwordHash,
      },
    });
    return user;
  };

  // --- Utilisateurs de base ---
  const clientU  = await createUser("client@ecoeats.fr", "Jean Client", "CLIENT", "0601010101");
  const driverU  = await createUser("driver@fast.fr", "Vite Livreur", "DRIVER", "0603030303");
  await createUser("admin@ecoeats.fr", "Admin EcoEats", "ADMIN", "0604040404");

  // --- Propriétaires des restaurants ---
  const owner1 = await createUser("jp.martin@ecoeats.fr", "Jean-Pierre Martin", "RESTAURANT_OWNER", "0145678901");
  const owner2 = await createUser("marie.dubois@ecoeats.fr", "Marie Dubois", "RESTAURANT_OWNER", "0145678902");
  const owner3 = await createUser("ahmed.benali@ecoeats.fr", "Ahmed Benali", "RESTAURANT_OWNER", "0145678903");
  const owner4 = await createUser("sofia.rossi@ecoeats.fr", "Sofia Rossi", "RESTAURANT_OWNER", "0145678904");
  const owner5 = await createUser("kenji.tanaka@ecoeats.fr", "Kenji Tanaka", "RESTAURANT_OWNER", "0145678905");

  const openingHours = {
    monday:    { open: "11:30", close: "22:30" },
    tuesday:   { open: "11:30", close: "22:30" },
    wednesday: { open: "11:30", close: "22:30" },
    thursday:  { open: "11:30", close: "22:30" },
    friday:    { open: "11:30", close: "23:00" },
    saturday:  { open: "12:00", close: "23:00" },
    sunday:    { open: "12:00", close: "21:30" },
  };

  // ============================================================
  // RESTAURANT 1 - Le Bistrot Parisien (Montmartre)
  // ============================================================
  const resto1 = await prisma.restaurant.create({
    data: {
      owner_id:      owner1.id,
      name:          "Le Bistrot Parisien",
      description:   "Cuisine française traditionnelle au cœur de Montmartre. Spécialités maison : bœuf bourguignon et tarte tatin.",
      address:       "12 Rue Lepic, 75018 Paris",
      lat:           48.8865,
      lng:           2.3360,
      is_active:     true,
      cuisine_type:  "Française",
      prep_time_min: 25,
      delivery_fee:  2.50,
      opening_hours: openingHours,
    },
  });

  const cat1Entrees = await prisma.menuCategory.create({ data: { restaurant_id: resto1.id, name: "Entrées", position: 1, availability: "always" } });
  const cat1Plats   = await prisma.menuCategory.create({ data: { restaurant_id: resto1.id, name: "Plats",   position: 2, availability: "always" } });
  const cat1Dessert = await prisma.menuCategory.create({ data: { restaurant_id: resto1.id, name: "Desserts", position: 3, availability: "always" } });

  await prisma.menuItem.createMany({ data: [
    { category_id: cat1Entrees.id, name: "Soupe à l'oignon gratinée", description: "Soupe traditionnelle, croûton et fromage fondu", price: 8.50, is_available: true, daily_stock: 50 },
    { category_id: cat1Entrees.id, name: "Escargots de Bourgogne", description: "6 escargots au beurre persillé aillé", price: 12.00, is_available: true, daily_stock: 30 },
    { category_id: cat1Plats.id, name: "Bœuf Bourguignon", description: "Mijoté 3h, servi avec pommes de terre vapeur", price: 18.50, is_available: true, is_popular: true, daily_stock: 20 },
    { category_id: cat1Plats.id, name: "Confit de Canard", description: "Cuisse confite, pommes sarladaises et salade verte", price: 19.00, is_available: true, daily_stock: 15 },
    { category_id: cat1Plats.id, name: "Croque Monsieur Deluxe", description: "Pain brioché, jambon de Paris, béchamel maison", price: 11.00, is_available: true, daily_stock: 40 },
    { category_id: cat1Dessert.id, name: "Tarte Tatin", description: "Tarte aux pommes caramélisées, crème fraîche", price: 7.50, is_available: true, daily_stock: 20 },
    { category_id: cat1Dessert.id, name: "Crème Brûlée", description: "Crème vanillée avec caramel craquant", price: 6.50, is_available: true, daily_stock: 25 },
  ]});

  console.log("✅ Restaurant 1 créé : Le Bistrot Parisien (Montmartre)");

  // ============================================================
  // RESTAURANT 2 - Sushi Sakura (Opéra)
  // ============================================================
  const resto2 = await prisma.restaurant.create({
    data: {
      owner_id:      owner2.id,
      name:          "Sushi Sakura",
      description:   "Authentique cuisine japonaise près de l'Opéra. Sushis préparés à la minute avec du poisson frais.",
      address:       "8 Rue de la Paix, 75002 Paris",
      lat:           48.8698,
      lng:           2.3310,
      is_active:     true,
      cuisine_type:  "Japonaise",
      prep_time_min: 20,
      delivery_fee:  3.00,
      opening_hours: openingHours,
    },
  });

  const cat2Sushi  = await prisma.menuCategory.create({ data: { restaurant_id: resto2.id, name: "Sushis & Makis", position: 1, availability: "always" } });
  const cat2Chaud  = await prisma.menuCategory.create({ data: { restaurant_id: resto2.id, name: "Plats chauds",   position: 2, availability: "always" } });
  const cat2Dessert = await prisma.menuCategory.create({ data: { restaurant_id: resto2.id, name: "Desserts",      position: 3, availability: "always" } });

  await prisma.menuItem.createMany({ data: [
    { category_id: cat2Sushi.id, name: "Plateau Sushi 12 pièces", description: "Saumon, thon, crevette, daurade", price: 22.00, is_available: true, is_popular: true, daily_stock: 30 },
    { category_id: cat2Sushi.id, name: "California Rolls (8 pcs)", description: "Avocat, crabe, concombre, sésame", price: 11.50, is_available: true, daily_stock: 40 },
    { category_id: cat2Sushi.id, name: "Salmon Maki (6 pcs)", description: "Saumon frais et riz vinaigré", price: 9.00, is_available: true, daily_stock: 50 },
    { category_id: cat2Chaud.id, name: "Ramen Miso", description: "Bouillon miso, porc, œuf mollet, nori", price: 16.00, is_available: true, is_popular: true, daily_stock: 25 },
    { category_id: cat2Chaud.id, name: "Katsu Curry", description: "Poulet pané, riz et sauce curry japonaise", price: 17.50, is_available: true, daily_stock: 20 },
    { category_id: cat2Dessert.id, name: "Mochi Glacé (3 pcs)", description: "Matcha, fraise, vanille", price: 7.00, is_available: true, daily_stock: 30 },
  ]});

  console.log("✅ Restaurant 2 créé : Sushi Sakura (Opéra)");

  // ============================================================
  // RESTAURANT 3 - Chez Mahmoud (Le Marais)
  // ============================================================
  const resto3 = await prisma.restaurant.create({
    data: {
      owner_id:      owner3.id,
      name:          "Chez Mahmoud",
      description:   "Cuisine libanaise généreuse dans le Marais. Mezze, shawarma et falafel faits maison.",
      address:       "45 Rue de Bretagne, 75003 Paris",
      lat:           48.8623,
      lng:           2.3601,
      is_active:     true,
      cuisine_type:  "Libanaise",
      prep_time_min: 15,
      delivery_fee:  2.00,
      opening_hours: openingHours,
    },
  });

  const cat3Mezze    = await prisma.menuCategory.create({ data: { restaurant_id: resto3.id, name: "Mezze",     position: 1, availability: "always" } });
  const cat3Grillades = await prisma.menuCategory.create({ data: { restaurant_id: resto3.id, name: "Grillades", position: 2, availability: "always" } });
  const cat3Sand     = await prisma.menuCategory.create({ data: { restaurant_id: resto3.id, name: "Sandwichs", position: 3, availability: "always" } });

  await prisma.menuItem.createMany({ data: [
    { category_id: cat3Mezze.id, name: "Houmous maison", description: "Pois chiches, tahini, citron, huile d'olive", price: 6.50, is_available: true, daily_stock: 60 },
    { category_id: cat3Mezze.id, name: "Assiette Mezze", description: "Houmous, taboulé, fattoush, labneh, pain pita", price: 14.00, is_available: true, is_popular: true, daily_stock: 25 },
    { category_id: cat3Mezze.id, name: "Falafel (6 pcs)", description: "Falafels aux pois chiches et herbes fraîches", price: 8.00, is_available: true, daily_stock: 50 },
    { category_id: cat3Grillades.id, name: "Chawarma Poulet", description: "Poulet mariné aux épices, légumes grillés, sauce ail", price: 14.50, is_available: true, is_popular: true, daily_stock: 30 },
    { category_id: cat3Grillades.id, name: "Kafta Grillée", description: "3 brochettes de viande hachée aux herbes", price: 15.00, is_available: true, daily_stock: 25 },
    { category_id: cat3Sand.id, name: "Sandwich Falafel", description: "Pain pita, falafel, crudités, tahini", price: 8.50, is_available: true, daily_stock: 40 },
    { category_id: cat3Sand.id, name: "Sandwich Chawarma", description: "Pain pita, poulet mariné, tomates, sauce blanche", price: 10.00, is_available: true, daily_stock: 35 },
  ]});

  console.log("✅ Restaurant 3 créé : Chez Mahmoud (Marais)");

  // ============================================================
  // RESTAURANT 4 - La Pizzeria Roma (Mouffetard)
  // ============================================================
  const resto4 = await prisma.restaurant.create({
    data: {
      owner_id:      owner4.id,
      name:          "La Pizzeria Roma",
      description:   "Pizzas napolitaines cuites au feu de bois. Pâte à la farine italienne importée.",
      address:       "22 Rue Mouffetard, 75005 Paris",
      lat:           48.8428,
      lng:           2.3507,
      is_active:     true,
      cuisine_type:  "Italienne",
      prep_time_min: 20,
      delivery_fee:  2.50,
      opening_hours: openingHours,
    },
  });

  const cat4Pizza    = await prisma.menuCategory.create({ data: { restaurant_id: resto4.id, name: "Pizzas",     position: 1, availability: "always" } });
  const cat4Pates    = await prisma.menuCategory.create({ data: { restaurant_id: resto4.id, name: "Pâtes",      position: 2, availability: "always" } });
  const cat4Anti     = await prisma.menuCategory.create({ data: { restaurant_id: resto4.id, name: "Antipasti",  position: 3, availability: "always" } });

  await prisma.menuItem.createMany({ data: [
    { category_id: cat4Pizza.id, name: "Margherita", description: "Tomate San Marzano, mozzarella di bufala, basilic", price: 13.00, is_available: true, daily_stock: 40 },
    { category_id: cat4Pizza.id, name: "Quatre Fromages", description: "Mozzarella, gorgonzola, parmesan, chèvre", price: 15.50, is_available: true, is_popular: true, daily_stock: 35 },
    { category_id: cat4Pizza.id, name: "Diavola", description: "Salami piquant, tomate, mozzarella, piment", price: 14.50, is_available: true, daily_stock: 30 },
    { category_id: cat4Pizza.id, name: "Pizza Saumon", description: "Crème fraîche, saumon fumé, câpres, roquette", price: 16.00, is_available: true, daily_stock: 25 },
    { category_id: cat4Pates.id, name: "Spaghetti Carbonara", description: "Guanciale, œuf, pecorino, poivre noir", price: 14.00, is_available: true, is_popular: true, daily_stock: 30 },
    { category_id: cat4Pates.id, name: "Penne Arrabiata", description: "Tomate, ail, piment, basilic", price: 12.00, is_available: true, daily_stock: 35 },
    { category_id: cat4Anti.id, name: "Burrata & Tomates", description: "Burrata crémeuse, tomates cerises, basilic, huile d'olive", price: 11.00, is_available: true, daily_stock: 20 },
  ]});

  console.log("✅ Restaurant 4 créé : La Pizzeria Roma (Mouffetard)");

  // ============================================================
  // RESTAURANT 5 - Tokyo Ramen House (Tour Eiffel)
  // ============================================================
  const resto5 = await prisma.restaurant.create({
    data: {
      owner_id:      owner5.id,
      name:          "Tokyo Ramen House",
      description:   "Ramens authentiques et gyozas croustillants près de la Tour Eiffel. Bouillons mijotés 12h.",
      address:       "3 Avenue de Suffren, 75007 Paris",
      lat:           48.8507,
      lng:           2.3000,
      is_active:     true,
      cuisine_type:  "Japonaise",
      prep_time_min: 18,
      delivery_fee:  2.80,
      opening_hours: openingHours,
    },
  });

  const cat5Ramen  = await prisma.menuCategory.create({ data: { restaurant_id: resto5.id, name: "Ramens",          position: 1, availability: "always" } });
  const cat5Gyoza  = await prisma.menuCategory.create({ data: { restaurant_id: resto5.id, name: "Gyozas & Entrées", position: 2, availability: "always" } });
  const cat5Drink  = await prisma.menuCategory.create({ data: { restaurant_id: resto5.id, name: "Boissons",         position: 3, availability: "always" } });

  await prisma.menuItem.createMany({ data: [
    { category_id: cat5Ramen.id, name: "Tonkotsu Ramen", description: "Bouillon porc 12h, chashu, œuf mollet, maïs, nori", price: 17.00, is_available: true, is_popular: true, daily_stock: 30 },
    { category_id: cat5Ramen.id, name: "Shoyu Ramen", description: "Bouillon soja, poulet, bambou, champignons shiitake", price: 15.50, is_available: true, daily_stock: 30 },
    { category_id: cat5Ramen.id, name: "Ramen Végétarien", description: "Bouillon légumes, tofu, champignons, épinards", price: 14.00, is_available: true, daily_stock: 25 },
    { category_id: cat5Gyoza.id, name: "Gyozas Porc (6 pcs)", description: "Raviolis japonais porc et chou, sauce ponzu", price: 9.50, is_available: true, is_popular: true, daily_stock: 50 },
    { category_id: cat5Gyoza.id, name: "Gyozas Crevettes (6 pcs)", description: "Raviolis crevettes et gingembre", price: 10.50, is_available: true, daily_stock: 40 },
    { category_id: cat5Gyoza.id, name: "Edamame", description: "Fèves de soja vapeur, fleur de sel", price: 5.50, is_available: true, daily_stock: 60 },
    { category_id: cat5Drink.id, name: "Thé Matcha Glacé", description: "Thé vert matcha premium, sucre de canne", price: 4.50, is_available: true, daily_stock: 80 },
    { category_id: cat5Drink.id, name: "Ramune", description: "Limonade japonaise à la bille", price: 3.50, is_available: true, daily_stock: 100 },
  ]});

  console.log("✅ Restaurant 5 créé : Tokyo Ramen House (Tour Eiffel)");

  // ============================================================
  // DRIVER & CLIENT de test
  // ============================================================
  await prisma.driver.create({
    data: {
      name:           "Vite Livreur",
      email:          "driver@fast.fr",
      phone:          "0603030303",
      transport_type: "bike",
      is_online:      true,
      is_verified:    true,
      is_expert:      true,
      lat:            48.8600,
      lng:            2.3400,
      user:           { connect: { id: driverU.id } },
    },
  });

  await prisma.paymentMethod.create({
    data: {
      user_id:      clientU.id,
      stripe_token: "pm_card_visa",
      type:         "cb",
      label:        "Visa •••• 4242",
      is_default:   true,
    },
  });

  console.log("✅ Driver et client de test créés");
  console.log("");
  console.log("========================================");
  console.log("🎉 Seeding terminé avec succès !");
  console.log("========================================");
  console.log("📧 Comptes de test :");
  console.log("   Client  : client@ecoeats.fr / Password123!");
  console.log("   Admin   : admin@ecoeats.fr  / Password123!");
  console.log("   Driver  : driver@fast.fr    / Password123!");
  console.log("   Resto 1 : jp.martin@ecoeats.fr / Password123!");
  console.log("========================================");
  console.log("🗺️  5 restaurants insérés à Paris :");
  console.log("   1. Le Bistrot Parisien - Montmartre (7 plats)");
  console.log("   2. Sushi Sakura - Opéra (6 plats)");
  console.log("   3. Chez Mahmoud - Marais (7 plats)");
  console.log("   4. La Pizzeria Roma - Mouffetard (7 plats)");
  console.log("   5. Tokyo Ramen House - Tour Eiffel (8 plats)");
  console.log("========================================");
}

main()
  .catch((e) => {
    console.error("❌ Erreur de seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
