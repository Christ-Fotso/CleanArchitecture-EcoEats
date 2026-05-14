import type { IRoutingService, RouteInfo } from "../../application/ports/IRoutingService.js";

/**
 * Implémentation utilisant l'API publique d'OSRM (Open Source Routing Machine).
 * Note : Pour une production réelle, il est recommandé d'héberger sa propre instance OSRM.
 */
export class OsrmRoutingService implements IRoutingService {
  private readonly baseUrl = "http://router.project-osrm.org/route/v1/driving";

  async calculateRoute(fromLat: number, fromLng: number, toLat: number, toLng: number): Promise<RouteInfo> {
    try {
      // OSRM utilise le format {lng},{lat};{lng},{lat}
      const url = `${this.baseUrl}/${fromLng},${fromLat};${toLng},${toLat}?overview=false`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error(`OSRM Error: ${response.statusText}`);
      
      const data = await response.json();
      
      if (!data.routes || data.routes.length === 0) {
        return this.fallback(fromLat, fromLng, toLat, toLng);
      }

      const route = data.routes[0];
      return {
        distanceKm:  route.distance / 1000,
        durationMin: Math.ceil(route.duration / 60),
      };
    } catch (error) {
      console.warn("[OsrmRoutingService]: Échec de l'appel OSRM, utilisation du fallback Haversine.", error);
      return this.fallback(fromLat, fromLng, toLat, toLng);
    }
  }

  private fallback(fromLat: number, fromLng: number, toLat: number, toLng: number): RouteInfo {
    // Calcul de base (Haversine)
    const R = 6371;
    const dLat = (toLat - fromLat) * Math.PI / 180;
    const dLng = (toLng - fromLng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(fromLat * Math.PI / 180) * Math.cos(toLat * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return {
      distanceKm:  distance,
      durationMin: Math.ceil(distance * 5), // 5 min par km par défaut
    };
  }
}
