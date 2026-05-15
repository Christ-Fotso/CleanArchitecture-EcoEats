import { InvalidOrderTransitionError } from "../errors/OrderErrors.js";

export type OrderStatusValue =
  | "created"
  | "confirmed"
  | "prepared"
  | "delivering"
  | "delivered"
  | "cancelled";

const ALLOWED_TRANSITIONS: Record<OrderStatusValue, OrderStatusValue[]> = {
  created:    ["confirmed", "cancelled"],
  confirmed:  ["prepared", "cancelled"],
  prepared:   ["delivering"],
  delivering: ["delivered"],
  delivered:  [],
  cancelled:  [],
};

export class OrderStatus {
  private constructor(readonly value: OrderStatusValue) {}

  static initial(): OrderStatus {
    return new OrderStatus("created");
  }

  static from(value: OrderStatusValue): OrderStatus {
    return new OrderStatus(value);
  }

  transitionTo(next: OrderStatusValue): OrderStatus {
    if (!ALLOWED_TRANSITIONS[this.value].includes(next)) {
      throw new InvalidOrderTransitionError(this.value, next);
    }
    return new OrderStatus(next);
  }

  canTransitionTo(next: OrderStatusValue): boolean {
    return ALLOWED_TRANSITIONS[this.value].includes(next);
  }

  equals(other: OrderStatus): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
