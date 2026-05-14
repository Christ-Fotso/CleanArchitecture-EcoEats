import { callAuthJson } from "./http";

export type UserAddressDto = {
  id:          string;
  label:       string;
  street:      string;
  postalCode:  string;
  city:        string;
  lat:         number | null;
  lng:         number | null;
  is_default:  boolean;
};

export const getUserAddresses = (accessToken: string) =>
  callAuthJson<UserAddressDto[]>("/users/me/addresses", accessToken);

export const createAddress = (input: Omit<UserAddressDto, "id" | "is_primary">, accessToken: string) =>
  callAuthJson<UserAddressDto>("/users/me/addresses", accessToken, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(input),
  });
