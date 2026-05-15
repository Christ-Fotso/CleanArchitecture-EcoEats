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
export function calculateDeliveryFee(distanceKm: number): number {
  const base = 1.50;  // Base fixe
  const perKm = 0.50; // Prix au km
  
  const rawFee = base + (distanceKm * perKm);
  
  // On plafonne à 45.00€ pour les distances extrêmes (ex: 80km+)
  const finalFee = Math.min(45.00, Math.max(1.85, rawFee));
  
  return Math.round(finalFee * 100) / 100;
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

