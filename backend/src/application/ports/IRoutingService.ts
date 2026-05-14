export type RouteInfo = {
  distanceKm: number;
  durationMin: number;
};

export interface IRoutingService {
  /** Calcule la distance et la durée réelle entre deux points via le réseau routier. */
  calculateRoute(
    fromLat: number, fromLng: number,
    toLat:   number, toLng:   number
  ): Promise<RouteInfo>;
}
