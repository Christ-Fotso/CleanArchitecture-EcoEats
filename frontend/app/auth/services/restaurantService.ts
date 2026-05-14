import { callAuthJson, callJson } from "./http";
import type { OpeningHoursMap } from "../../types/restaurant";

export type RestaurantDto = {
  id:           string;
  name:         string;
  description:  string | null;
  logoUrl:      string | null;
  address:      string;
  lat?:         number;
  lng?:         number;
  cuisineType:  string;
  prepTimeMin:  number;
  deliveryFee:  number;
  distanceKm?:  number;
  isActive:     boolean;
  ratingAvg:    number | null;
  openingHours: OpeningHoursMap;
};

export type CreateRestaurantInput = {
  name:        string;
  description?: string;
  address:     string;
  lat:         number;
  lng:         number;
  cuisineType: string;
  prepTimeMin: number;
  deliveryFee: number;
};

export type UpdateRestaurantProfileInput = {
  name?:        string;
  description?: string;
  address?:     string;
  cuisineType?: string;
  prepTimeMin?: number;
  deliveryFee?: number;
};

export const getActiveRestaurants = (coords?: { lat: number; lng: number }) => {
  const params = coords ? `?lat=${coords.lat}&lng=${coords.lng}` : "";
  return callJson<RestaurantDto[]>(`/restaurants/active${params}`);
};

export const getMyRestaurants = (accessToken: string) =>
  callAuthJson<RestaurantDto[]>("/restaurants", accessToken);

export const uploadRestaurantLogo = (restaurantId: string, file: File, accessToken: string) => {
  const body = new FormData();
  body.append("logo", file);
  return callAuthJson<RestaurantDto>(`/restaurants/${restaurantId}/logo`, accessToken, { method: "POST", body });
};

export const createRestaurant = (input: CreateRestaurantInput, accessToken: string) =>
  callAuthJson<RestaurantDto>("/restaurants", accessToken, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(input),
  });

export const updateRestaurantProfile = (
  restaurantId: string,
  input: UpdateRestaurantProfileInput,
  accessToken: string,
) =>
  callAuthJson<RestaurantDto>(`/restaurants/${restaurantId}`, accessToken, {
    method:  "PATCH",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(input),
  });

export const updateOpeningHours = (
  restaurantId: string,
  openingHours: OpeningHoursMap,
  accessToken: string,
) =>
  callAuthJson<RestaurantDto>(`/restaurants/${restaurantId}/opening-hours`, accessToken, {
    method:  "PATCH",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ openingHours }),
  });

export const toggleRestaurantStatus = (
  restaurantId: string,
  isActive: boolean,
  accessToken: string,
) =>
  callAuthJson<RestaurantDto>(`/restaurants/${restaurantId}/status`, accessToken, {
    method:  "PATCH",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ isActive }),
  });
