"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../auth/context/AuthContext";
import { getDriverWallet, DriverWallet } from "../../auth/services/driverService";

export default function EarningsPage() {
  const { accessToken } = useAuth();
  const [wallet, setWallet] = useState<DriverWallet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    getDriverWallet(accessToken)
      .then(setWallet)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [accessToken]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
        <p className="text-slate-500">Impossible de charger vos gains.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-900">Mes Gains</h1>
        <div className="text-xs font-bold bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Mise à jour en temps réel
        </div>
      </div>

      {/* ── Balance Card ── */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Solde disponible</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-5xl font-black">{wallet.balance.toFixed(2)}</span>
            <span className="text-2xl font-bold opacity-60">€</span>
          </div>
          <div className="mt-8 flex gap-4">
            <button className="flex-1 bg-white text-slate-900 py-3.5 rounded-2xl font-black text-sm hover:bg-slate-100 transition shadow-lg shadow-white/5">
              Transférer vers banque
            </button>
            <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-4 flex flex-col justify-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Total cumulé</p>
              <p className="text-lg font-black">{wallet.totalEarned.toFixed(2)} €</p>
            </div>
          </div>
        </div>
        {/* Abstract background element */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl" />
      </div>

      {/* ── Historique ── */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <h2 className="font-black text-slate-900">Historique des courses</h2>
          <span className="text-xs font-bold text-slate-400">{wallet.earnings.length} livraisons</span>
        </div>

        {wallet.earnings.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🛵</span>
            </div>
            <p className="text-slate-500 font-medium">Vous n&apos;avez pas encore effectué de livraison.</p>
            <p className="text-slate-400 text-xs mt-1">Acceptez une course pour commencer à gagner de l&apos;argent !</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {wallet.earnings.map((earning) => (
              <div key={earning.id} className="p-6 hover:bg-slate-50 transition flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-xl shrink-0 transition group-hover:scale-110">
                    📦
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Commande #{earning.orderId.slice(0, 8).toUpperCase()}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <p className="text-xs text-slate-400 font-medium">{new Date(earning.createdAt).toLocaleDateString()}</p>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <p className="text-xs text-emerald-600 font-bold uppercase tracking-tight">Livrée</p>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-lg font-black text-slate-900">+{earning.total.toFixed(2)} €</p>
                  <div className="flex items-center justify-end gap-2 mt-0.5">
                    {earning.tip > 0 && (
                      <span className="text-[10px] font-black bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-md">
                        + Pourboire {earning.tip.toFixed(2)}€
                      </span>
                    )}
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Base {earning.baseAmount.toFixed(2)}€</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
