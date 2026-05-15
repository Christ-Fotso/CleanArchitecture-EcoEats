export type MenuOptionValueDto = {
  id:         string;
  label:      string;
  extraPrice: number;
};

export type MenuItemOptionDto = {
  id:         string;
  name:       string;
  type:       "single" | "multiple";
  isRequired: boolean;
  values:     MenuOptionValueDto[];
};

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
  availability: "always" | "lunch" | "dinner" | "weekend";
  items:        MenuItemDto[];
};
