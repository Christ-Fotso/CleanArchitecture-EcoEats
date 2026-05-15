import { callAuthJson } from "./http";

export type DriverProfile = {
  id:            string;
  name:          string;
  transportType: string;
  isOnline:      boolean;
  isVerified:    boolean;
};

export type AvailableDelivery = {
  orderId:           string;
  restaurantName:    string;
  restaurantAddress: string;
  deliveryAddress:   string;
  itemCount:         number;
  total:             number;
  deliveryFee:       number;
  distanceKm:        number;
  estimatedAt:       string;
  createdAt:         string;
};

export const getDriverProfile = (accessToken: string) =>
  callAuthJson<DriverProfile | null>("/driver/me", accessToken);

export const createDriverProfile = (
  data: { name: string; email: string; phone: string; transportType: "bike" | "scooter" | "car" },
  accessToken: string,
) =>
  callAuthJson<DriverProfile>("/driver/profile", accessToken, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(data),
  });

export const toggleDriverStatus = (isOnline: boolean, accessToken: string) =>
  callAuthJson<DriverProfile>("/driver/status", accessToken, {
    method:  "PATCH",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ isOnline }),
  });

export const getAvailableDeliveries = (accessToken: string) =>
  callAuthJson<AvailableDelivery[]>("/driver/deliveries/available", accessToken);

export const acceptDelivery = (orderId: string, accessToken: string) =>
  callAuthJson<void>(`/driver/deliveries/${orderId}/accept`, accessToken, { method: "POST" });

export type ActiveDelivery = {
  orderId:           string;
  restaurantName:    string;
  restaurantAddress: string;
  clientName:        string;
  deliveryStreet:    string;
  deliveryCity:      string;
  itemCount:         number;
  total:             number;
  deliveryFee:       number;
  distanceKm:        number;
  estimatedAt:       string;
  orderStatus:       string;
};

export const getActiveDelivery = (accessToken: string) =>
  callAuthJson<ActiveDelivery | null>("/driver/deliveries/active", accessToken);

export const pickupDelivery = (orderId: string, accessToken: string) =>
  callAuthJson<{ message: string }>(`/driver/deliveries/${orderId}/pickup`, accessToken, { method: "POST" });

export const completeDelivery = (orderId: string, accessToken: string) =>
  callAuthJson<{ message: string }>(`/driver/deliveries/${orderId}/complete`, accessToken, { method: "POST" });

export type DriverWallet = {
  id:           string;
  balance:      number;
  totalEarned:  number;
  earnings: Array<{
    id:         string;
    orderId:    string;
    baseAmount: number;
    bonus:      number;
    tip:        number;
    total:      number;
    status:     string;
    createdAt:  string;
  }>;
};

export const getDriverWallet = (accessToken: string) =>
  callAuthJson<DriverWallet>("/driver/wallet", accessToken);
