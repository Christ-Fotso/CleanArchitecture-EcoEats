import { Money } from "./Money.js";

/** Distance à vol d'oiseau entre deux coordonnées GPS (formule Haversine). */
export class Distance {
  private constructor(readonly meters: number) {}

  static fromCoordinates(
    lat1: number, lng1: number,
    lat2: number, lng2: number,
  ): Distance {
    const EARTH_RADIUS_METERS = 6_371_000;
    const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
    const latitudeDelta  = toRadians(lat2 - lat1);
    const longitudeDelta = toRadians(lng2 - lng1);
    const haversineFactor =
      Math.sin(latitudeDelta / 2) ** 2 +
      Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
      Math.sin(longitudeDelta / 2) ** 2;
    return new Distance(EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(haversineFactor), Math.sqrt(1 - haversineFactor)));
  }

  static fromMeters(meters: number): Distance {
    return new Distance(meters);
  }

  static fromKm(km: number): Distance {
    return new Distance(km * 1000);
  }

  get kilometers(): number {
    return this.meters / 1000;
  }

  toKm(): number {
    return this.meters / 1000;
  }

  /** Frais de livraison = frais fixe + (prix au km × distance). */
  deliveryFee(pricePerKm: Money, baseFee: Money): Money {
    return baseFee.add(pricePerKm.multiply(this.kilometers));
  }
}
