export type DriverProfile = {
  id:            string;
  userId:        string;
  name:          string;
  transportType: "bike" | "scooter" | "car";
  isOnline:      boolean;
  isVerified:    boolean;
  /** Statut Expert : peut cumuler 2 livraisons du même restaurant simultanément. */
  isExpert:      boolean;
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

export type EarningRecord = {
  id:         string;
  orderId:    string;
  baseAmount: number;
  bonus:      number;
  tip:        number;
  total:      number;
  status:     string;
  createdAt:  string;
};

export type DriverWallet = {
  balance:      number;
  totalEarned:  number;
  earnings:     EarningRecord[];
};
