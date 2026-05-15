export type MenuAvailability = "always" | "lunch" | "dinner" | "weekend";
export type MenuOptionType   = "single" | "multiple";

export type MenuOptionValue = {
  id:         string;
  optionId:   string;
  label:      string;
  extraPrice: number;
};

export type MenuItemOption = {
  id:         string;
  itemId:     string;
  name:       string;
  type:       MenuOptionType;
  isRequired: boolean;
  values:     MenuOptionValue[];
};

export type MenuItem = {
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
  options:     MenuItemOption[];
};

export type MenuCategory = {
  id:           string;
  restaurantId: string;
  name:         string;
  position:     number;
  availability: MenuAvailability;
  items:        MenuItem[];
};

// ── Inputs ────────────────────────────────────────────────────────────────────

export type CreateMenuCategoryInput = {
  restaurantId: string;
  name:         string;
  availability: MenuAvailability;
};

export type UpdateMenuCategoryInput = {
  name?:         string;
  availability?: MenuAvailability;
  position?:     number;
};

export type CreateMenuItemInput = {
  categoryId:  string;
  name:        string;
  description?: string;
  price:       number;
  isAvailable: boolean;
  isPopular:   boolean;
  dailyStock?: number;
  allergens?:  string[];
};

export type UpdateMenuItemInput = {
  name?:        string;
  description?: string;
  price?:       number;
  isAvailable?: boolean;
  isPopular?:   boolean;
  dailyStock?:  number | null;
  allergens?:   string[];
};

export type CreateMenuItemOptionInput = {
  itemId:     string;
  name:       string;
  type:       MenuOptionType;
  isRequired: boolean;
  values:     { label: string; extraPrice: number }[];
};
