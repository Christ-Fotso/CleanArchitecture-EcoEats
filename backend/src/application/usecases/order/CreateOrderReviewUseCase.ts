import type { Result } from "../../../shared/Result.js";
import { ok, failure } from "../../../shared/Result.js";
import type { UseCase } from "../../../shared/UseCase.js";
import type { IReviewRepository } from "../../ports/IReviewRepository.js";
import type { IOrderRepository } from "../../ports/IOrderRepository.js";

export type CreateOrderReviewInput = {
  orderId:          string;
  userId:           string;
  restaurantRating: number;
  driverRating?:    number;
  comment?:         string;
};

export class OrderNotDeliveredError extends Error {
  constructor() {
    super("La commande doit être livrée pour pouvoir être notée.");
  }
}

export class ReviewAlreadyExistsError extends Error {
  constructor() {
    super("Une évaluation existe déjà pour cette commande.");
  }
}

export class CreateOrderReviewUseCase
  implements UseCase<CreateOrderReviewInput, void, OrderNotDeliveredError | ReviewAlreadyExistsError>
{
  constructor(
    private readonly reviewRepository: IReviewRepository,
    private readonly orderRepository:  IOrderRepository,
  ) {}

  async execute(input: CreateOrderReviewInput): Promise<Result<void, OrderNotDeliveredError | ReviewAlreadyExistsError>> {
    const order = await this.orderRepository.findById(input.orderId);
    if (!order) return failure(new Error("Commande introuvable"));

    if (order.status !== "delivered") {
      return failure(new OrderNotDeliveredError());
    }

    // Vérifier si un avis existe déjà (on peut le faire via le repo ou une erreur d'unicité Prisma)
    try {
      await this.reviewRepository.create({
        orderId:          input.orderId,
        userId:           input.userId,
        restaurantId:     order.restaurantId,
        driverId:         order.driverId as string | undefined, 
        restaurantRating: input.restaurantRating,
        driverRating:     input.driverRating,
        comment:           input.comment,
      });

      // Mettre à jour les moyennes de manière asynchrone (pas besoin d'attendre pour répondre au client)
      this.reviewRepository.updateRestaurantRating(order.restaurantId).catch(console.error);
      if (order.driverId) {
        this.reviewRepository.updateDriverRating(order.driverId).catch(console.error);
      }

      return ok(undefined);
    } catch (error: any) {
      if (error.code === "P2002") {
        return failure(new ReviewAlreadyExistsError());
      }
      throw error;
    }
  }
}
