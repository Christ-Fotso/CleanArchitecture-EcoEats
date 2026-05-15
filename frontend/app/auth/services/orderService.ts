import { callAuthJson } from "./http";

export type OrderItemPayload = {
  menuItemId:      string;
  name:            string;
  unitPrice:       number;
  quantity:        number;
  notes?:          string;
  optionValueIds?: string[];
};

export type CreateOrderPayload = {
  restaurantId:       string;
  deliveryStreet:     string;
  deliveryPostalCode: string;
  deliveryCity:       string;
  clientLat?:         number;
  clientLng?:         number;
  items:              OrderItemPayload[];
  tipAmount?:         number;
  paymentMethodId?:   string;
};

export type OrderSummary = {
  id:          string;
  status:      string;
  subtotal:    number;
  deliveryFee: number;
  total:       number;
  estimatedAt: string;
};

export type OrderItemDetail = {
  id:          string;
  name:        string;
  description: string | null;
  photoUrl:    string | null;
  unitPrice:   number;
  quantity:    number;
  notes:       string | null;
};

export type OrderDetail = {
  id:                string;
  restaurantId:      string;
  restaurantName:    string;
  restaurantLogoUrl: string | null;
  status:            string;
  hasDriver:         boolean;
  items:             OrderItemDetail[];
  deliveryStreet:    string;
  deliveryCity:      string;
  subtotal:          number;
  deliveryFee:       number;
  total:             number;
  estimatedAt:       string;
  createdAt:         string;
};

export type RestaurantOrderItem = {
  id:        string;
  name:      string;
  photoUrl:  string | null;
  quantity:  number;
  unitPrice: number;
  notes:     string | null;
};

export type RestaurantOrder = {
  id:             string;
  restaurantId:   string;
  clientName:     string;
  status:         string;
  hasDriver:      boolean;
  items:          RestaurantOrderItem[];
  deliveryStreet: string;
  deliveryCity:   string;
  subtotal:       number;
  deliveryFee:    number;
  total:          number;
  createdAt:      string;
  estimatedAt:    string;
};

export const getRestaurantOrders = (accessToken: string) =>
  callAuthJson<RestaurantOrder[]>("/orders/restaurant", accessToken);

export const updateOrderStatus = (orderId: string, status: string, accessToken: string) =>
  callAuthJson<{ message: string }>(`/orders/${orderId}/status`, accessToken, {
    method:  "PATCH",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ status }),
  });

export const placeOrder = (payload: CreateOrderPayload, accessToken: string) =>
  callAuthJson<OrderSummary>("/orders", accessToken, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload),
  });

export const getOrders = (accessToken: string) =>
  callAuthJson<OrderDetail[]>("/orders", accessToken);

export const rateOrder = (
  orderId:          string,
  restaurantRating: number,
  driverRating?:    number,
  comment?:         string,
  accessToken?:     string,
) =>
  callAuthJson<{ message: string }>(`/orders/${orderId}/review`, accessToken!, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ restaurantRating, driverRating, comment }),
  });
