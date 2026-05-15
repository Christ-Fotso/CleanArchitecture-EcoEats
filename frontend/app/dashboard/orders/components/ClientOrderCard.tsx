"use client";

import { useState } from "react";
import Image from "next/image";
import type { OrderDetail } from "../../../auth/services/orderService";
import { rateOrder } from "../../../auth/services/orderService";
import { useAuth } from "../../../auth/context/AuthContext";
import { IconFood, IconMapPin } from "../../../components/Icons";
import { buildImageUrl } from "../../../auth/services/http";
import { STATUS } from "../constants";
import { OrderTimeline } from "./OrderTimeline";

export function ClientOrderCard({ order }: { order: OrderDetail }) {
  const { tokens } = useAuth();
  const [open, setOpen] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [submittedReview, setSubmittedReview] = useState(order.hasReview);
  
  // Rating states
  const [restaurantRating,  setRestaurantRating]  = useState(0);
  const [driverRating,      setDriverRating]      = useState(0);
  const [restaurantComment, setRestaurantComment] = useState("");
  const [driverComment,     setDriverComment]     = useState("");
  const [hoverRestaurant,   setHoverRestaurant]   = useState(0);
  const [hoverDriver,       setHoverDriver]       = useState(0);

  const st      = STATUS[order.status] ?? { label: order.status, color: "bg-slate-100 text-slate-600" };
  const date    = new Date(order.createdAt);
  const logoUrl = order.restaurantLogoUrl ? buildImageUrl(order.restaurantLogoUrl) : null;

  const handleRate = async () => {
    if (!tokens?.accessToken) return;
    if (restaurantRating === 0 || (order.hasDriver && driverRating === 0)) {
      alert("Veuillez sélectionner une note pour continuer.");
      return;
    }
    setRatingLoading(true);
    try {
      await rateOrder(
        order.id,
        restaurantRating,
        order.hasDriver ? driverRating : undefined,
        restaurantComment || undefined,
        driverComment || undefined,
        tokens.accessToken
      );
      setSubmittedReview(true);
    } catch (error) {
      console.error("Erreur notation:", error);
      alert("Une erreur est survenue lors de l'envoi de votre avis.");
    } finally {
      setRatingLoading(false);
    }
  };

  const StarRating = ({
    value,
    onChange,
    hover,
    onHover,
    label,
    icon = "🍴"
  }: {
    value: number;
    onChange: (v: number) => void;
    hover: number;
    onHover: (v: number) => void;
    label: string;
    icon?: string;
  }) => (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider">{label}</p>
      </div>
      <div className="flex gap-1.5" onMouseLeave={() => onHover(0)}>
        {[1, 2, 3, 4, 5].map((s) => {
          const active = s <= (hover || value);
          const isSelected = s <= value;
          return (
            <button
              key={s}
              type="button"
              onClick={() => onChange(s)}
              onMouseEnter={() => onHover(s)}
              className="group relative focus:outline-none transition-transform active:scale-90"
            >
              <span className={`text-2xl transition-all duration-200 ${
                active ? "text-orange-500 scale-110 drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]" : "text-slate-200 grayscale"
              }`}>
                {isSelected || active ? "★" : "☆"}
              </span>
              {isSelected && !hover && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-400 rounded-full animate-ping" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-4">
      <button type="button" onClick={() => setOpen((isOpen) => !isOpen)}
        className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition">
        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center">
          {logoUrl
            ? <Image src={logoUrl} alt={order.restaurantName} width={48} height={48} className="w-full h-full object-cover" />
            : <span className="text-slate-300"><IconFood className="h-6 w-6" /></span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-black text-slate-900 truncate">{order.restaurantName}</p>
            <div className="flex items-center gap-2">
              {submittedReview && <span className="text-[10px] font-black bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-md">NOTÉ</span>}
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${st.color}`}>{st.label}</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            {" · "}
            {date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          </p>
          <div className="flex items-center justify-between mt-0.5">
            <p className="text-xs text-slate-400 font-mono">N° {order.id.slice(0, 8).toUpperCase()}</p>
            <p className="text-sm font-black text-slate-900">{order.total.toFixed(2)} €</p>
          </div>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
          {!["created", "cancelled"].includes(order.status) && (
            <OrderTimeline status={order.status} hasDriver={order.hasDriver} />
          )}
          
          {/* ── Section Notation ── */}
          {order.status === "delivered" && !submittedReview && (
            <div className="mx-5 my-4 p-6 bg-orange-50 rounded-3xl border border-orange-100 space-y-5 shadow-inner">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-2xl">✨</div>
                <div>
                  <p className="text-sm font-black text-slate-900">Comment s&apos;est passée votre commande ?</p>
                  <p className="text-xs text-slate-500 font-medium">Votre avis compte énormément !</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white/60 p-6 rounded-3xl border border-white shadow-sm">
                  <div className="space-y-4">
                    <StarRating
                      label="Le repas (Restaurant)"
                      value={restaurantRating}
                      onChange={setRestaurantRating}
                      hover={hoverRestaurant}
                      onHover={setHoverRestaurant}
                      icon="👨‍🍳"
                    />
                    <textarea
                      value={restaurantComment}
                      onChange={(e) => setRestaurantComment(e.target.value)}
                      placeholder="Comment était le repas ?"
                      className="w-full rounded-2xl border-slate-200 bg-white/80 p-4 text-xs text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition min-h-[80px] shadow-sm outline-none"
                    />
                  </div>

                  {order.hasDriver && (
                    <div className="space-y-4">
                      <StarRating
                        label="La livraison (Livreur)"
                        value={driverRating}
                        onChange={setDriverRating}
                        hover={hoverDriver}
                        onHover={setHoverDriver}
                        icon="🛵"
                      />
                      <textarea
                        value={driverComment}
                        onChange={(e) => setDriverComment(e.target.value)}
                        placeholder="Comment était la livraison ?"
                        className="w-full rounded-2xl border-slate-200 bg-white/80 p-4 text-xs text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition min-h-[80px] shadow-sm outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleRate}
                disabled={ratingLoading}
                className="w-full bg-orange-600 text-white py-4 rounded-2xl font-black text-sm hover:bg-orange-700 transition shadow-xl shadow-orange-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {ratingLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {ratingLoading ? "Envoi en cours..." : "Publier mon avis"}
              </button>
            </div>
          )}

          {submittedReview && order.status === "delivered" && (
            <div className="mx-5 my-4 p-5 bg-emerald-50 rounded-3xl border border-emerald-100 flex items-center gap-4 shadow-inner">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xl shadow-sm">✅</div>
              <div>
                <p className="text-sm font-black text-emerald-900">Merci beaucoup !</p>
                <p className="text-xs font-bold text-emerald-700/70">Votre évaluation a bien été enregistrée.</p>
              </div>
            </div>
          )}

          <div className="border-t border-slate-50 px-5 py-4 space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Détails des articles</p>
            {order.items.map((item) => {
              const photoUrl = item.photoUrl ? buildImageUrl(item.photoUrl) : null;
              return (
                <div key={item.id} className="flex items-start gap-4">
                  {photoUrl ? (
                    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 relative bg-slate-100 border border-slate-50">
                      <Image src={photoUrl} alt={item.name} fill sizes="64px" className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl shrink-0 bg-slate-100 flex items-center justify-center text-slate-300 border border-slate-50"><IconFood className="h-6 w-6" /></div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-slate-900 leading-tight">{item.name}</p>
                        <p className="text-xs text-orange-600 font-black mt-0.5">× {item.quantity}</p>
                      </div>
                      <p className="text-sm font-black text-slate-900 shrink-0">{(item.unitPrice * item.quantity).toFixed(2)} €</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mx-5 mb-4 bg-slate-50 rounded-3xl p-5 space-y-2 shadow-inner">
            <div className="flex justify-between text-xs font-bold"><span className="text-slate-400 uppercase tracking-tighter">Sous-total</span><span className="text-slate-700">{order.subtotal.toFixed(2)} €</span></div>
            <div className="flex justify-between text-xs font-bold"><span className="text-slate-400 uppercase tracking-tighter">Livraison</span><span className="text-slate-700">{order.deliveryFee === 0 ? "Offerte" : `${order.deliveryFee.toFixed(2)} €`}</span></div>
            <div className="flex justify-between text-xs font-bold"><span className="text-slate-400 uppercase tracking-tighter">Frais de service</span><span className="text-slate-700">{order.serviceFee.toFixed(2)} €</span></div>
            <div className="flex justify-between pt-3 mt-1 border-t border-slate-200/60"><span className="text-sm font-black text-slate-900">Total payé</span><span className="text-base font-black text-orange-600">{order.total.toFixed(2)} €</span></div>
          </div>

          <div className="px-5 pb-6 grid grid-cols-2 gap-4">
            <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><IconMapPin className="w-3 h-3" /> Destination</p>
              <p className="text-xs text-slate-900 font-black truncate">{order.deliveryStreet}</p>
              <p className="text-[10px] text-slate-500 font-bold">{order.deliveryCity}</p>
            </div>
            <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">⏱ Livré le</p>
              <p className="text-xs text-slate-900 font-black">{new Date(order.estimatedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</p>
              <p className="text-[10px] text-slate-500 font-bold">{new Date(order.estimatedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
