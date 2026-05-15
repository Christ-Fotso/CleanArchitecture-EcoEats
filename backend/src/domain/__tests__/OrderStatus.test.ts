import { describe, it, expect } from "vitest";
import { OrderStatus } from "../value-objects/OrderStatus.js";
import { InvalidOrderTransitionError } from "../errors/OrderErrors.js";

describe("OrderStatus", () => {
  it("démarre à created", () => {
    expect(OrderStatus.initial().value).toBe("created");
  });

  it("autorise created → confirmed", () => {
    const status = OrderStatus.initial().transitionTo("confirmed");
    expect(status.value).toBe("confirmed");
  });

  it("autorise confirmed → prepared", () => {
    const status = OrderStatus.from("confirmed").transitionTo("prepared");
    expect(status.value).toBe("prepared");
  });

  it("autorise confirmed → cancelled", () => {
    const status = OrderStatus.from("confirmed").transitionTo("cancelled");
    expect(status.value).toBe("cancelled");
  });

  it("refuse created → delivered (transition invalide)", () => {
    expect(() => OrderStatus.initial().transitionTo("delivered"))
      .toThrow(InvalidOrderTransitionError);
  });

  it("refuse toute transition depuis delivered (état terminal)", () => {
    expect(() => OrderStatus.from("delivered").transitionTo("cancelled"))
      .toThrow(InvalidOrderTransitionError);
  });

  it("canTransitionTo retourne false sans lever d'exception", () => {
    expect(OrderStatus.from("delivered").canTransitionTo("cancelled")).toBe(false);
  });
});
