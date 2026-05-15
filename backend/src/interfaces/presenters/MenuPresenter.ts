import type { MenuCategory, MenuItem, MenuItemOption } from "../../application/menu/types.js";
import type { MenuCategoryDto, MenuItemDto, MenuItemOptionDto } from "../dtos/menu/MenuResponseDto.js";

export class MenuPresenter {
  static toCategoryDto(category: MenuCategory): MenuCategoryDto {
    return {
      id:           category.id,
      restaurantId: category.restaurantId,
      name:         category.name,
      position:     category.position,
      availability: category.availability,
      items:        category.items.map((item) => MenuPresenter.toItemDto(item)),
    };
  }

  static toCategoryDtoList(categories: MenuCategory[]): MenuCategoryDto[] {
    return categories.map((category) => MenuPresenter.toCategoryDto(category));
  }

  static toItemDto(item: MenuItem): MenuItemDto {
    return {
      id:          item.id,
      categoryId:  item.categoryId,
      name:        item.name,
      description: item.description,
      photoUrl:    item.photoUrl,
      price:       item.price,
      isAvailable: item.isAvailable,
      isPopular:   item.isPopular,
      dailyStock:  item.dailyStock,
      allergens:   item.allergens,
      options:     item.options.map((option) => MenuPresenter.toOptionDto(option)),
    };
  }

  static toOptionDto(option: MenuItemOption): MenuItemOptionDto {
    return {
      id:         option.id,
      name:       option.name,
      type:       option.type,
      isRequired: option.isRequired,
      values:     option.values.map((value) => ({
        id:         value.id,
        label:      value.label,
        extraPrice: value.extraPrice,
      })),
    };
  }
}
