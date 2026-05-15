import type { PrismaClient } from "@prisma/client";
import type { IReviewRepository, CreateReviewInput } from "../../application/ports/IReviewRepository.js";

export class PrismaReviewRepository implements IReviewRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateReviewInput): Promise<void> {
    await this.prisma.review.create({
      data: {
        order_id:          input.orderId,
        user_id:           input.userId,
        restaurant_id:     input.restaurantId,
        driver_id:         input.driverId,
        restaurant_rating:  input.restaurantRating,
        driver_rating:      input.driverRating,
        restaurant_comment: input.restaurantComment,
        driver_comment:     input.driverComment,
      },
    });
  }

  async updateRestaurantRating(restaurantId: string): Promise<void> {
    const aggregate = await this.prisma.review.aggregate({
      where: { restaurant_id: restaurantId },
      _avg:  { restaurant_rating: true },
    });

    await this.prisma.restaurant.update({
      where: { id: restaurantId },
      data:  { rating_avg: aggregate._avg.restaurant_rating },
    });
  }

  async updateDriverRating(driverId: string): Promise<void> {
    const aggregate = await this.prisma.review.aggregate({
      where: { driver_id: driverId },
      _avg:  { driver_rating: true },
    });

    await this.prisma.driver.update({
      where: { id: driverId },
      data:  { rating_avg: aggregate._avg.driver_rating },
    });
  }
}
