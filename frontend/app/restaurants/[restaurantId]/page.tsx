"use client";

import { use, useEffect, useRef, useState, useCallback } from "react";
import { callJson } from "../../auth/services/http";
import { getRestaurantMenu } from "../../auth/services/menu/menuService";
import type { MenuCategoryDto, MenuItemDto } from "../../auth/services/menu/menuService";
import type { RestaurantDto as RestaurantResponseDto } from "../../auth/services/restaurantService";
import { useCart } from "../../auth/context/CartContext";
import { RestaurantHeader } from "./components/RestaurantHeader";
import { CategoryNav } from "./components/CategoryNav";
import { MenuItemCard } from "./components/MenuItemCard";
import { ItemModal } from "./components/ItemModal";
import type { CartEntry } from "./types";

type Props = { params: Promise<{ restaurantId: string }> };

export default function PublicRestaurantMenuPage({ params }: Props) {
  const { restaurantId } = use(params);

  const [restaurant,     setRestaurant]     = useState<RestaurantResponseDto | null>(null);
  const [categories,     setCategories]     = useState<MenuCategoryDto[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [selectedItem,   setSelectedItem]   = useState<MenuItemDto | null>(null);

  const {
    cartTotal, cartCount,
    addToCart, setShowCart,
  } = useCart();

  const categoryRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    // Récupérer les coords GPS stockées par le dashboard (sessionStorage)
    let coordsParam = "";
    try {
      const stored = sessionStorage.getItem("userCoords");
      if (stored) {
        const { lat, lng } = JSON.parse(stored);
        coordsParam = `?lat=${lat}&lng=${lng}`;
      }
    } catch { /* sessionStorage non disponible */ }

    Promise.all([
      callJson<RestaurantResponseDto>(`/restaurants/${restaurantId}/public${coordsParam}`),
      getRestaurantMenu(restaurantId),
    ]).then(([restaurantResult, menuResult]) => {
      if (restaurantResult.ok && restaurantResult.data) setRestaurant(restaurantResult.data);
      if (menuResult.ok && menuResult.data) {
        const visible = menuResult.data.filter((cat) => cat.items.length > 0);
        setCategories(visible);
        if (visible[0]) setActiveCategory(visible[0].id);
      }
      setLoading(false);
    });
  }, [restaurantId]);

  const scrollToCategory = (categoryId: string) => {
    setActiveCategory(categoryId);
    categoryRefs.current[categoryId]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleAddToCart = useCallback((entry: Omit<CartEntry, "cartId">) => {
    if (restaurant) addToCart(entry, restaurant);
    setSelectedItem(null);
  }, [restaurant, addToCart]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-slate-400 text-sm">Chargement…</p>
    </div>
  );

  if (!restaurant) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-red-500 text-sm">Restaurant introuvable.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-white pb-28">
      <RestaurantHeader restaurant={restaurant} />
      <CategoryNav categories={categories} activeCategory={activeCategory} onScroll={scrollToCategory} />

      <div className="max-w-2xl mx-auto px-4 mt-6 space-y-8">
        {categories.map((category) => (
          <section key={category.id} ref={(el) => { categoryRefs.current[category.id] = el; }}>
            <h2 className="text-lg font-black text-slate-900 mb-4">{category.name}</h2>
            <div className="space-y-3">
              {category.items.filter((item) => item.isAvailable).map((item) => (
                <MenuItemCard key={item.id} item={item} onSelect={() => setSelectedItem(item)} />
              ))}
            </div>
          </section>
        ))}
        {categories.length === 0 && (
          <p className="text-center text-slate-400 py-20 text-sm">Menu non disponible.</p>
        )}
      </div>

      {selectedItem && (
        <ItemModal item={selectedItem} onClose={() => setSelectedItem(null)} onAdd={handleAddToCart} />
      )}

      {/* Bouton flottant panier */}
      {cartCount > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm px-4">
          <button type="button" onClick={() => setShowCart(true)}
            className="w-full bg-slate-900 text-white rounded-2xl py-4 flex items-center justify-between px-5 shadow-xl hover:bg-slate-800 transition">
            <span className="bg-white/20 rounded-full w-7 h-7 flex items-center justify-center text-sm font-black">
              {cartCount}
            </span>
            <span className="text-sm font-bold">Voir mon panier</span>
            <span className="text-sm font-black">{cartTotal.toFixed(2)} €</span>
          </button>
        </div>
      )}
    </div>
  );
}
