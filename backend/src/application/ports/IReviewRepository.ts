export type CreateReviewInput = {
  orderId:          string;
  userId:           string;
  restaurantId:     string;
  driverId?:        string;
  restaurantRating:  number;
  driverRating?:     number;
  restaurantComment?: string;
  driverComment?:     string;
};

export interface IReviewRepository {
  create(input: CreateReviewInput): Promise<void>;
  updateRestaurantRating(restaurantId: string): Promise<void>;
  updateDriverRating(driverId: string): Promise<void>;
}
