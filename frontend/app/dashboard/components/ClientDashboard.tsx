"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { buildImageUrl } from "../../auth/services/http";
import { IconFood, IconStar, IconBicycle, IconLocation } from "../../components/Icons";
import { getActiveRestaurants } from "../../auth/services/restaurantService";
import { getUserAddresses } from "../../auth/services/addressService";
import type { RestaurantDto } from "../../auth/services/restaurantService";
import type { UserAddressDto } from "../../auth/services/addressService";
import { useAuth } from "../../auth/context/AuthContext";

export function ClientDashboard({ userName }: { userName: string }) {
  const { accessToken } = useAuth();
  const [restaurants, setRestaurants] = useState<RestaurantDto[]>([]);
  const [addresses, setAddresses] = useState<UserAddressDto[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<UserAddressDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUsingGPS, setIsUsingGPS] = useState(false);

  // 1. Charger les adresses et les restaurants au montage
  useEffect(() => {
    if (!accessToken) return;

    // Charger les restaurants IMMÉDIATEMENT (sans attendre le GPS)
    getActiveRestaurants().then(res => {
      if (res.ok) setRestaurants(res.data ?? []);
      setLoading(false);
    });

    const loadUserData = async () => {
      try {
        // Charger les adresses en arrière-plan
        const addrRes = await getUserAddresses(accessToken);
        if (addrRes.ok && addrRes.data && addrRes.data.length > 0) {
          setAddresses(addrRes.data);
          const def = addrRes.data.find(a => a.is_default) || addrRes.data[0];
          setSelectedAddress(def);
          
          // Si on trouve une adresse, on RE-calcule les restaurants avec ces coordonnées
          if (def.lat && def.lng) {
            const restRes = await getActiveRestaurants({ lat: def.lat, lng: def.lng });
            if (restRes.ok) setRestaurants(restRes.data ?? []);
          }
        } else if (navigator.geolocation) {
          // Sinon tenter GPS en arrière-plan
          navigator.geolocation.getCurrentPosition(async (pos) => {
            setIsUsingGPS(true);
            const restRes = await getActiveRestaurants({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            if (restRes.ok) setRestaurants(restRes.data ?? []);
          }, undefined, { timeout: 5000 });
        }
      } catch (err) {
        console.error("Dashboard data error", err);
      }
    };

    loadUserData();
  }, [accessToken]);


  // 2. Recalculer quand l'adresse change
  const handleAddressChange = async (addrId: string) => {
    const addr = addresses.find(a => a.id === addrId);
    if (!addr) return;
    
    setLoading(true);
    setSelectedAddress(addr);
    setIsUsingGPS(false);
    
    const coords = (addr.lat && addr.lng) ? { lat: addr.lat, lng: addr.lng } : undefined;
    const res = await getActiveRestaurants(coords);
    if (res.ok) setRestaurants(res.data ?? []);
    setLoading(false);
  };

  return (
    <div className="max-w-2xl space-y-6 mx-auto">
      {/* Header avec sélecteur d'adresse */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-2xl font-black text-slate-900">Bonjour, {userName.split(" ")[0]}</p>
          <p className="text-slate-500 text-sm mt-0.5 flex items-center gap-1.5">
            <IconLocation className="h-3.5 w-3.5 text-orange-500" />
            Livraison à : 
            {addresses.length > 0 ? (
              <select 
                value={selectedAddress?.id} 
                onChange={(e) => handleAddressChange(e.target.value)}
                className="bg-transparent font-bold text-slate-900 border-none p-0 focus:ring-0 cursor-pointer hover:text-orange-600 transition"
              >
                {addresses.map(a => (
                  <option key={a.id} value={a.id}>{a.label} ({a.city})</option>
                ))}
              </select>
            ) : (
              <span className="font-bold text-slate-900">
                {isUsingGPS ? "Ma position actuelle" : "Adresse non définie"}
              </span>
            )}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((slot) => (
            <div key={slot} className="rounded-2xl bg-slate-50 animate-pulse h-52 border border-slate-100" />
          ))}
        </div>
      ) : restaurants.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-16 text-center">
          <div className="flex justify-center mb-4 text-slate-200"><IconFood className="h-12 w-12" /></div>
          <p className="text-slate-500 font-medium">Aucun restaurant ne livre à cette adresse.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {restaurants.map((restaurant, idx) => {
            const coverUrl = restaurant.logoUrl ? buildImageUrl(restaurant.logoUrl) : null;
            return (
              <Link key={restaurant.id} href={`/restaurants/${restaurant.id}`}
                className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-xs hover:shadow-lg hover:-translate-y-1 transition duration-300 group">
                <div className="relative h-36 bg-slate-100 overflow-hidden">
                  {coverUrl ? (
                    <Image src={coverUrl} alt={restaurant.name} fill
                      sizes="(max-width: 640px) 50vw, 300px"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      priority={idx < 2} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-orange-50 to-amber-100 text-orange-200"><IconFood className="h-10 w-10" /></div>
                  )}
                  {restaurant.distanceKm !== undefined && (
                    <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg bg-white/90 backdrop-blur-sm text-[10px] font-bold text-slate-700 shadow-xs">
                      {restaurant.distanceKm.toFixed(1)} km
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-bold text-slate-900 truncate flex-1">{restaurant.name}</p>
                    {restaurant.ratingAvg && (
                      <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-500 ml-1">
                        <IconStar className="h-3 w-3" filled /> {restaurant.ratingAvg.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">{restaurant.cuisineType}</p>
                  
                  <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-50">
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600">
                      <IconBicycle className="h-3 w-3 text-orange-400" />
                      {restaurant.deliveryFee.toFixed(2)} €
                    </div>
                    <span className="text-slate-200 text-xs">|</span>
                    <div className="text-[11px] font-medium text-slate-500">
                      {restaurant.prepTimeMin} min
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
