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
  const distance = R * c;
  
  // Sécurité : si la distance est > 500km, c'est probablement un bug de coordonnées (0,0)
  if (distance > 500) return 0;
  
  return distance;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Calcule le prix de livraison dynamique basé sur la distance.
 * Formule granulaire pour éviter les prix "trop ronds" :
 * - Base fixe : 1.18 €
 * - Coût au km : 0.67 €
 * - Frais de service (estimés) : 0.05 €
 */
/**
 * Calcule les frais de service de la plateforme.
 * Basé sur 10% du sous-total, avec un minimum de 0.50€ et un maximum de 3.00€.
 */
export function calculateServiceFee(subtotal: number): number {
  const percentage = 0.10;
  const rawFee = subtotal * percentage;
  return Math.min(Math.max(rawFee, 0.50), 3.00);
}

export function calculateDeliveryFee(distanceKm: number): number {
  const BASE_FEE = 1.50;
  const PER_KM_FEE = 0.50;
  const MAX_FEE = 45.00;

  const fee = BASE_FEE + distanceKm * PER_KM_FEE;
  return Math.min(fee, MAX_FEE);
}

/**
 * Estime le temps de livraison en minutes.
 * - Préparation du restaurant
 * - Trajet (estimé à 4 min par km en ville/vélo)
 * - Marge de sécurité : 3 min
 */
export function estimateDeliveryTime(distanceKm: number, prepTimeMin: number): number {
  const minPerKm = 4.2; 
  const safetyBuffer = 3;
  
  const travelTime = distanceKm * minPerKm;
  const total = prepTimeMin + travelTime + safetyBuffer;
  
  return Math.ceil(total);
}

