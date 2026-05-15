"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../auth/context/AuthContext";
import { useNotifications, NOTIFICATION_STYLES } from "../auth/context/NotificationContext";
import { IconBell, IconInfo } from "./Icons";
import { useCart } from "../auth/context/CartContext";
import { getAvatarUrl } from "../auth/services/userService";

/* ── Titres de pages ── */
const PAGE_TITLES: Record<string, string> = {
  "/dashboard":                             "Tableau de bord",
  "/dashboard/orders":                      "Mes commandes",
  "/dashboard/favorites":                   "Mes favoris",
  "/dashboard/restaurants":                 "Restaurants",
  "/dashboard/restaurants/menu":            "Menu du restaurant",
  "/dashboard/deliveries":                  "Mes livraisons",
  "/dashboard/earnings":                    "Mes gains",
  "/dashboard/profile":                     "Mon profil",
  "/dashboard/profile/documents":           "Documents",
  "/dashboard/account":                     "Mon compte",
  "/dashboard/account/profile":             "Informations personnelles",
  "/dashboard/account/preferences":         "Préférences alimentaires",
  "/dashboard/account/payment-methods":     "Moyens de paiement",
  "/dashboard/account/security":            "Connexion et sécurité",
  "/dashboard/account/privacy":             "Confidentialité et données",
};

/* ── Route parente (détermine si un bouton retour doit s'afficher) ── */
const PARENT_ROUTES: Record<string, string> = {
  "/dashboard/orders":                      "/dashboard",
  "/dashboard/favorites":                   "/dashboard",
  "/dashboard/restaurants":                 "/dashboard",
  "/dashboard/restaurants/menu":            "/dashboard/restaurants",
  "/dashboard/deliveries":                  "/dashboard",
  "/dashboard/earnings":                    "/dashboard",
  "/dashboard/profile":                     "/dashboard",
  "/dashboard/profile/documents":           "/dashboard/profile",
  "/dashboard/account":                     "/dashboard",
  "/dashboard/account/profile":             "/dashboard/account",
  "/dashboard/account/preferences":         "/dashboard/account",
  "/dashboard/account/payment-methods":     "/dashboard/account",
  "/dashboard/account/security":            "/dashboard/account",
  "/dashboard/account/privacy":             "/dashboard/account",
};

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout, loading } = useAuth();
  const { history, unreadCount, markAllRead } = useNotifications();
  const { cartCount, setShowCart } = useCart();
  const router   = useRouter();
  const pathname = usePathname();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const title      = PAGE_TITLES[pathname] ?? "EcoEats";
  const parentHref = PARENT_ROUTES[pathname] ?? null;
  const initiale   = user?.name?.charAt(0).toUpperCase() ?? "?";
  const avatarUrl  = getAvatarUrl(user?.photo_url);

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
  };

  const handleBellClick = () => {
    setDropdownOpen((previous) => !previous);
    if (!dropdownOpen) markAllRead();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0">

      {/* ── Gauche : menu + (retour) + titre ── */}
      <div className="flex items-center gap-2">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition"
          aria-label="Menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {parentHref && (
          <Link
            href={parentHref}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
            aria-label="Retour"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Retour</span>
          </Link>
        )}

        {title === "EcoEats" ? (
          <Link href="/dashboard" className="text-lg font-black text-slate-900 hover:text-orange-600 transition">
            {title}
          </Link>
        ) : (
          <h1 className="text-lg font-black text-slate-900">{title}</h1>
        )}
      </div>

      {/* ── Droite : panier + cloche + avatar + déconnexion ── */}
      <div className="flex items-center gap-3">

        {/* ── Icône panier ── */}
        <button
          type="button"
          onClick={() => setShowCart(true)}
          className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition"
          aria-label="Panier"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m13-9l2 9m-9-4h4" />
          </svg>
          {cartCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-orange-500 text-white text-[10px] font-black flex items-center justify-center">
              {cartCount > 9 ? "9+" : cartCount}
            </span>
          )}
        </button>

        {/* ── Cloche notifications ── */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={handleBellClick}
            className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition"
            aria-label="Notifications"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && (
              <span suppressHydrationWarning className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* ── Dropdown notifications ── */}
          {dropdownOpen && (
            <div className="absolute right-0 top-10 z-50 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <p className="text-sm font-bold text-slate-900">Notifications</p>
                {history.length > 0 && (
                  <button type="button" onClick={() => setDropdownOpen(false)}
                    className="text-xs text-slate-400 hover:text-slate-600">Fermer</button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                {history.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <div className="flex justify-center mb-2 text-slate-200"><IconBell className="h-8 w-8" /></div>
                    <p className="text-sm text-slate-400">Aucune notification pour le moment.</p>
                  </div>
                ) : (
                  history.map((notification) => {
                    const style = NOTIFICATION_STYLES[notification.type] ?? { badge: "bg-slate-100 text-slate-600", icon: <IconInfo className="h-3.5 w-3.5" /> };
                    return (
                      <div key={notification.id} className={`px-4 py-3 flex items-start gap-3 ${!notification.read ? "bg-orange-50" : ""}`}>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full shrink-0 ${style.badge}`}>
                          {style.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900">{notification.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5 leading-snug">{notification.message}</p>
                          <p className="text-xs text-slate-300 mt-1">
                            {notification.receivedAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        {!notification.read && (
                          <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0 mt-1" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Nom utilisateur ── */}
        {!loading && (
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-900 leading-tight">{user?.name}</p>
            <p className="text-xs text-slate-400">{user?.email}</p>
          </div>
        )}

        {/* ── Avatar ── */}
        <div className="w-9 h-9 rounded-full overflow-hidden bg-orange-100 flex items-center justify-center shrink-0">
          {!loading && avatarUrl ? (
            <Image src={avatarUrl} alt={user?.name ?? ""} width={36} height={36} loading="eager" className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-black text-orange-600">{loading ? "" : initiale}</span>
          )}
        </div>

        {/* ── Déconnexion ── */}
        <button onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="hidden sm:inline">Déconnexion</span>
        </button>
      </div>
    </header>
  );
}
