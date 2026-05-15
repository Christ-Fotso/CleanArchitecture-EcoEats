import { callAuthJson, callJson, API_BASE } from "../http";

export type MenuAvailability = "always" | "lunch" | "dinner" | "weekend";
export type MenuOptionType   = "single" | "multiple";

export type MenuOptionValueDto = { id: string; label: string; extraPrice: number };
export type MenuItemOptionDto  = { id: string; name: string; type: MenuOptionType; isRequired: boolean; values: MenuOptionValueDto[] };

export type MenuItemDto = {
  id:          string;
  categoryId:  string;
  name:        string;
  description: string | null;
  photoUrl:    string | null;
  price:       number;
  isAvailable: boolean;
  isPopular:   boolean;
  dailyStock:  number | null;
  allergens:   string[];
  options:     MenuItemOptionDto[];
};

export type MenuCategoryDto = {
  id:           string;
  restaurantId: string;
  name:         string;
  position:     number;
  availability: MenuAvailability;
  items:        MenuItemDto[];
};

export const AVAILABILITY_LABELS: Record<MenuAvailability, string> = {
  always:  "Toujours disponible",
  lunch:   "Midi uniquement",
  dinner:  "Soir uniquement",
  weekend: "Week-end uniquement",
};

export const getItemPhotoUrl = (photoUrl: string | null | undefined): string | null =>
  photoUrl ? `${API_BASE}/${photoUrl}` : null;

// ── Lecture ───────────────────────────────────────────────────────────────────

export const getRestaurantMenu = (restaurantId: string) =>
  callJson<MenuCategoryDto[]>(`/restaurants/${restaurantId}/menu`);

// ── Catégories ────────────────────────────────────────────────────────────────

export const createMenuCategory = (
  restaurantId: string,
  input: { name: string; availability: MenuAvailability },
  accessToken: string,
) => callAuthJson<MenuCategoryDto>(`/restaurants/${restaurantId}/menu/categories`, accessToken, {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input),
});

export const updateMenuCategory = (
  restaurantId: string,
  categoryId: string,
  input: { name?: string; availability?: MenuAvailability },
  accessToken: string,
) => callAuthJson<MenuCategoryDto>(`/restaurants/${restaurantId}/menu/categories/${categoryId}`, accessToken, {
  method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input),
});

export const deleteMenuCategory = (restaurantId: string, categoryId: string, accessToken: string) =>
  callAuthJson<void>(`/restaurants/${restaurantId}/menu/categories/${categoryId}`, accessToken, { method: "DELETE" });

export const reorderCategories = (restaurantId: string, orderedIds: string[], accessToken: string) =>
  callAuthJson<void>(`/restaurants/${restaurantId}/menu/categories/reorder`, accessToken, {
    method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderedIds }),
  });

// ── Items ─────────────────────────────────────────────────────────────────────

export const createMenuItem = (
  restaurantId: string,
  input: { categoryId: string; name: string; description?: string; price: number; isAvailable: boolean; isPopular: boolean; dailyStock?: number; allergens?: string[] },
  accessToken: string,
) => callAuthJson<MenuItemDto>(`/restaurants/${restaurantId}/menu/items`, accessToken, {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input),
});

export const updateMenuItem = (
  restaurantId: string,
  itemId: string,
  input: { name?: string; description?: string; price?: number; isAvailable?: boolean; isPopular?: boolean; dailyStock?: number | null; allergens?: string[] },
  accessToken: string,
) => callAuthJson<MenuItemDto>(`/restaurants/${restaurantId}/menu/items/${itemId}`, accessToken, {
  method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input),
});

export const deleteMenuItem = (restaurantId: string, itemId: string, accessToken: string) =>
  callAuthJson<void>(`/restaurants/${restaurantId}/menu/items/${itemId}`, accessToken, { method: "DELETE" });

export const toggleItemAvailability = (restaurantId: string, itemId: string, isAvailable: boolean, accessToken: string) =>
  callAuthJson<MenuItemDto>(`/restaurants/${restaurantId}/menu/items/${itemId}/availability`, accessToken, {
    method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isAvailable }),
  });

export const updateItemStock = (restaurantId: string, itemId: string, dailyStock: number | null, accessToken: string) =>
  callAuthJson<MenuItemDto>(`/restaurants/${restaurantId}/menu/items/${itemId}/stock`, accessToken, {
    method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dailyStock }),
  });

export const uploadItemPhoto = (restaurantId: string, itemId: string, file: File, accessToken: string) => {
  const body = new FormData();
  body.append("photo", file);
  return callAuthJson<MenuItemDto>(`/restaurants/${restaurantId}/menu/items/${itemId}/photo`, accessToken, { method: "POST", body });
};

// ── Options ───────────────────────────────────────────────────────────────────

export const createItemOption = (
  restaurantId: string,
  itemId: string,
  input: { name: string; type: MenuOptionType; isRequired: boolean; values: { label: string; extraPrice: number }[] },
  accessToken: string,
) => callAuthJson<MenuItemOptionDto>(`/restaurants/${restaurantId}/menu/items/${itemId}/options`, accessToken, {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input),
});

export const deleteItemOption = (restaurantId: string, optionId: string, accessToken: string) =>
  callAuthJson<void>(`/restaurants/${restaurantId}/menu/options/${optionId}`, accessToken, { method: "DELETE" });

// ── CSV ───────────────────────────────────────────────────────────────────────

export const exportMenuCsv = (restaurantId: string, accessToken: string): string =>
  `${API_BASE}/restaurants/${restaurantId}/menu/export?token=${accessToken}`;

export const importMenuCsv = (restaurantId: string, file: File, accessToken: string) => {
  const body = new FormData();
  body.append("file", file);
  return callAuthJson<{ categoriesCreated: number; itemsCreated: number }>(
    `/restaurants/${restaurantId}/menu/import`, accessToken, { method: "POST", body },
  );
};
