"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { buildImageUrl } from "../../auth/services/http";
import { IconFood, IconStar, IconBicycle, IconMapPin } from "../../components/Icons";
import { getActiveRestaurants } from "../../auth/services/restaurantService";
import type { RestaurantDto } from "../../auth/services/restaurantService";

// Composant volontairement simplifié : les restaurants s'affichent toujours.
// Le calcul de livraison dynamique se fait en arrière-plan si possible.
export function ClientDashboard({ userName }: { userName: string }) {
  const [restaurants, setRestaurants] = useState<RestaurantDto[]>([]);
  const [loading, setLoading]         = useState(true);
  const [deliveryInfo, setDeliveryInfo] = useState<string>("calcul en cours…");

  useEffect(() => {
    // Étape 1 : charger les restaurants SANS coordonnées (rapide, garanti)
    getActiveRestaurants()
      .then((res) => {
        if (res.ok && res.data) setRestaurants(res.data);
      })
      .catch(() => {/* silencieux */})
      .finally(() => setLoading(false));

    // Étape 2 : tenter GPS en arrière-plan pour recalculer les frais
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setDeliveryInfo("basé sur votre position");
          getActiveRestaurants(coords).then((res) => {
            if (res.ok && res.data) setRestaurants(res.data);
          });
        },
        () => {
          setDeliveryInfo("frais indicatifs");
        },
        { timeout: 4000, maximumAge: 60000 }
      );
    } else {
      setDeliveryInfo("frais indicatifs");
    }
  }, []);

  return (
    <div className="max-w-2xl space-y-6 mx-auto">
      {/* En-tête */}
      <div>
        <p className="text-2xl font-black text-slate-900">
          Bonjour, {userName.split(" ")[0]}
        </p>
        <p className="text-slate-500 text-sm mt-1 flex items-center gap-1">
          <IconMapPin className="h-3.5 w-3.5 text-orange-400" />
          Que voulez-vous manger aujourd&apos;hui ? &mdash;{" "}
          <span className="italic text-slate-400">{deliveryInfo}</span>
        </p>
      </div>

      {/* Grille restaurants */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="rounded-2xl bg-slate-100 animate-pulse h-52" />
          ))}
        </div>
      ) : restaurants.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 p-16 text-center">
          <div className="flex justify-center mb-4 text-slate-200">
            <IconFood className="h-12 w-12" />
          </div>
          <p className="text-slate-500 font-medium">
            Aucun restaurant disponible pour le moment.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {restaurants.map((r, idx) => {
            const cover = r.logoUrl ? buildImageUrl(r.logoUrl) : null;
            return (
              <Link
                key={r.id}
                href={`/restaurants/${r.id}`}
                className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group"
              >
                {/* Couverture */}
                <div className="relative h-36 bg-slate-50 overflow-hidden">
                  {cover ? (
                    <Image
                      src={cover}
                      alt={r.name}
                      fill
                      sizes="(max-width: 640px) 50vw, 300px"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      priority={idx < 2}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100 text-orange-200">
                      <IconFood className="h-10 w-10" />
                    </div>
                  )}
                  {r.distanceKm !== undefined && (
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg bg-white/90 backdrop-blur-sm text-[10px] font-bold text-slate-700">
                      {r.distanceKm.toFixed(1)} km
                    </span>
                  )}
                </div>

                {/* Infos */}
                <div className="p-3">
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-sm font-bold text-slate-900 truncate">{r.name}</p>
                    {r.ratingAvg != null && (
                      <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-500 shrink-0">
                        <IconStar className="h-3 w-3" filled /> {r.ratingAvg.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">{r.cuisineType}</p>
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-50 text-[11px]">
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <IconBicycle className="h-3 w-3 text-orange-400" />
                      {r.deliveryFee.toFixed(2)} €
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-500">{r.prepTimeMin} min</span>
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
