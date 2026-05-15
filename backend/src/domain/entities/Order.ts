import { Money } from "../value-objects/Money.js";
import { Distance } from "../value-objects/Distance.js";
import { OrderStatus, type OrderStatusValue } from "../value-objects/OrderStatus.js";
import type { CartItem } from "./Cart.js";

/** Frais de service de la plateforme (5 %). */
const SERVICE_FEE_RATE = 0.05;
/** Prise en charge fixe livreur (€). */
export const DRIVER_BASE_FEE_EUROS = 1.5;
/** Prix au km livreur (€). */
export const DRIVER_PRICE_PER_KM_EUROS = 0.5;

export type OrderLine = {
  menuItemId: string;
  name: string;
  unitPrice: Money;
  quantity: number;
};

export type OrderProps = {
  id: string;
  clientId: string;
  restaurantId: string;
  items: readonly CartItem[];
  deliveryDistance: Distance;
  prepTimeMin?: number;
  status?: OrderStatusValue;
  createdAt?: Date;
};

/**
 * Entité Order — contient le calcul du prix total et les transitions de statut.
 * Règle : prix = plats + frais livraison (haversine) + 5 % frais service.
 */
export class Order {
  readonly id: string;
  readonly clientId: string;
  readonly restaurantId: string;
  readonly lines: OrderLine[];
  readonly itemsTotal: Money;
  readonly deliveryFee: Money;
  readonly serviceFee: Money;
  readonly total: Money;
  readonly status: OrderStatus;
  readonly createdAt: Date;
  readonly estimatedDeliveryAt: Date;

  constructor(props: OrderProps) {
    this.id           = props.id;
    this.clientId     = props.clientId;
    this.restaurantId = props.restaurantId;
    this.createdAt    = props.createdAt ?? new Date();
    this.status       = OrderStatus.from(props.status ?? "PENDING");

    this.lines = props.items.map((cartItem) => ({
      menuItemId: cartItem.menuItemId,
      name:       cartItem.name,
      unitPrice:  cartItem.unitPrice,
      quantity:   cartItem.quantity,
    }));

    this.itemsTotal  = props.items.reduce((sum, cartItem) => sum.add(cartItem.subtotal), Money.zero());
    this.deliveryFee = props.deliveryDistance.deliveryFee(
      Money.fromEuros(DRIVER_PRICE_PER_KM_EUROS),
      Money.fromEuros(DRIVER_BASE_FEE_EUROS),
    );
    
    // Frais de service : 10% (min 0.50€, max 3.00€)
    const rawServiceFee = this.itemsTotal.multiply(0.10);
    const minFee = Money.fromEuros(0.50);
    const maxFee = Money.fromEuros(3.00);
    
    if (rawServiceFee.isLessThan(minFee)) {
      this.serviceFee = minFee;
    } else if (rawServiceFee.isGreaterThan(maxFee)) {
      this.serviceFee = maxFee;
    } else {
      this.serviceFee = rawServiceFee;
    }

    this.total = this.itemsTotal.add(this.deliveryFee).add(this.serviceFee);

    // Estimation dynamique : Préparation + Trajet (vitesse moyenne 12km/h soit 5min/km)
    const prepTime = props.prepTimeMin ?? 20;
    const travelTime = Math.ceil(props.deliveryDistance.toKm() * 5);
    const totalMinutes = prepTime + travelTime + 5; // +5min tampon
    this.estimatedDeliveryAt = new Date(this.createdAt.getTime() + totalMinutes * 60 * 1000);
  }

  transitionTo(next: OrderStatusValue): Order {
    const newStatus = this.status.transitionTo(next);
    return new Order({
      id:               this.id,
      clientId:         this.clientId,
      restaurantId:     this.restaurantId,
      items:            [],
      deliveryDistance: Distance.fromMeters(0),
      status:           newStatus.value,
      createdAt:        this.createdAt,
    });
  }

  toInvoice(): {
    orderId: string;
    lines: OrderLine[];
    itemsTotal: string;
    deliveryFee: string;
    serviceFee: string;
    total: string;
    createdAt: Date;
  } {
    return {
      orderId:     this.id,
      lines:       this.lines,
      itemsTotal:  this.itemsTotal.toString(),
      deliveryFee: this.deliveryFee.toString(),
      serviceFee:  this.serviceFee.toString(),
      total:       this.total.toString(),
      createdAt:   this.createdAt,
    };
  }
}
