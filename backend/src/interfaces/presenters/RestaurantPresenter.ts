import type { Restaurant } from "../../application/restaurant/types.js";
import type { RestaurantResponseDto } from "../dtos/restaurant/RestaurantResponseDto.js";

export class RestaurantPresenter {
  static toDto(restaurant: Restaurant): RestaurantResponseDto {
    return {
      id:           restaurant.id,
      name:         restaurant.name,
      description:  restaurant.description,
      logoUrl:      restaurant.logoUrl,
      address:      restaurant.address,
      lat:          restaurant.lat,
      lng:          restaurant.lng,
      cuisineType:  restaurant.cuisineType,
      prepTimeMin:  restaurant.prepTimeMin,
      deliveryFee:  restaurant.deliveryFee,
      isActive:     restaurant.isActive,
      ratingAvg:    restaurant.ratingAvg,
      openingHours: restaurant.openingHours,
    };
  }

  static toDtoList(restaurants: Restaurant[]): RestaurantResponseDto[] {
    return restaurants.map((restaurant) => RestaurantPresenter.toDto(restaurant));
  }
}
