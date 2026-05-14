/**
 * Calcule la distance en kilomètres entre deux points GPS (formule de Haversine)
 */
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Calcule le prix de livraison dynamique basé sur la distance.
 * - Base : 1.50 € (frais fixes)
 * - Par km : 0.80 €/km
 * - Minimum : 1.50 €
 * - Maximum : 8.00 €
 *
 * Exemples :
 *  - 1 km  → 1.50 + 0.80 = 2.30 €
 *  - 3 km  → 1.50 + 2.40 = 3.90 €
 *  - 5 km  → 1.50 + 4.00 = 5.50 €
 *  - 10 km → plafonné à  8.00 €
 */
export function calculateDeliveryFee(distanceKm: number): number {
  const base    = 1.50;
  const perKm   = 0.80;
  const min     = 1.50;
  const max     = 8.00;
  const fee = base + distanceKm * perKm;
  return Math.min(max, Math.max(min, Math.round(fee * 100) / 100));
}

/**
 * Estime le temps de livraison en minutes.
 * - Vitesse moyenne livreur vélo : 20 km/h
 * - Temps minimum : 10 min (préparation incluse)
 */
export function estimateDeliveryTime(distanceKm: number, prepTimeMin: number): number {
  const speedKmh    = 20;
  const travelMin   = Math.ceil((distanceKm / speedKmh) * 60);
  const totalMin    = prepTimeMin + travelMin;
  return Math.max(10, totalMin);
}
