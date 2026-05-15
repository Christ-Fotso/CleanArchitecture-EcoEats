"use client";

import { useAuth } from "../auth/context/AuthContext";
import { ClientDashboard } from "./components/ClientDashboard";
import { RestaurantOwnerDashboard } from "./components/RestaurantOwnerDashboard";
import { DriverDashboard } from "./components/DriverDashboard";

export default function DashboardPage() {
  const { user, loading } = useAuth();

  // Afficher un spinner pendant le chargement de l'auth
  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <p className="text-slate-400 text-sm">Chargement...</p>
    </div>
  );

  // Connecté → dashboard selon le rôle
  if (user?.role === "RESTAURANT_OWNER") return <RestaurantOwnerDashboard userName={user.name} />;
  if (user?.role === "DRIVER")           return <DriverDashboard userName={user.name} />;

  // CLIENT ou non connecté → afficher les restaurants (la commande demandera le login)
  return <ClientDashboard userName={user?.name ?? "visiteur"} />;
}
