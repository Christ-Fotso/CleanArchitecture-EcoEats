"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../auth/context/AuthContext";
import { useAuthenticatedAPI } from "../../../auth/hooks/useAuthenticatedAPI";
import { IconScooter } from "../../../components/Icons";
import { getDriverProfile, createDriverProfile } from "../../../auth/services/driverService";

const TRANSPORT_LABELS: Record<string, string> = {
  bike:    "🚲 Vélo",
  scooter: "🛵 Scooter",
  car:     "🚗 Voiture",
};

export default function VehiclePage() {
  const { user, loading: authLoading } = useAuth();
  const { callWithRefresh } = useAuthenticatedAPI();
  const router = useRouter();

  const [transport,       setTransport]       = useState<"bike" | "scooter" | "car">("bike");
  const [loading,         setLoading]         = useState(true);
  const [saving,          setSaving]          = useState(false);
  const [error,           setError]           = useState<string | null>(null);
  const [success,         setSuccess]         = useState(false);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const result = await callWithRefresh((token) => getDriverProfile(token));
      if (!cancelled && result.ok && result.data) {
        setTransport(result.data.transportType);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [authLoading]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    const result = await callWithRefresh((token) =>
      createDriverProfile(
        { 
          name: user.name, 
          email: user.email, 
          phone: user.phone || "0600000000", 
          transportType: transport 
        },
        token,
      )
    );

    if (result.ok) {
      setSuccess(true);
      // Optionnel: rediriger vers les livraisons après un court délai
      setTimeout(() => router.push("/dashboard/deliveries"), 1500);
    } else {
      setError(result.message ?? "Erreur lors de la mise à jour du profil");
    }
    setSaving(false);
  };

  if (loading || authLoading) return <div className="p-8 text-center text-slate-400 text-sm">Chargement…</div>;

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
        <div className="text-center">
          <div className="flex justify-center text-orange-400">
            <IconScooter className="h-14 w-14" />
          </div>
          <h1 className="text-xl font-black text-slate-900 mt-3">Votre moyen de transport</h1>
          <p className="text-sm text-slate-500 mt-1">
            Configurez votre profil pour commencer ou modifier votre mode de livraison.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Choisissez votre véhicule</p>
          {(["bike", "scooter", "car"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setTransport(type)}
              className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl border-2 transition text-left ${
                transport === type
                  ? "border-orange-500 bg-orange-50"
                  : "border-slate-100 hover:border-slate-200"
              }`}
            >
              <span className="text-2xl">{TRANSPORT_LABELS[type].split(" ")[0]}</span>
              <div className="flex-1">
                <span className="text-sm font-bold text-slate-900">{TRANSPORT_LABELS[type].split(" ")[1]}</span>
                {transport === type && !saving && (
                  <p className="text-[10px] text-orange-600 font-bold uppercase tracking-tighter">Moyen actuel</p>
                )}
              </div>
              <div className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                transport === type ? "border-orange-500 bg-orange-500" : "border-slate-200"
              }`}>
                {transport === type && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
            <span>✓</span> Profil mis à jour avec succès !
          </div>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-orange-600 text-white rounded-2xl py-4 text-sm font-bold hover:bg-orange-700 disabled:opacity-50 transition shadow-lg shadow-orange-200"
        >
          {saving ? "Enregistrement…" : "Enregistrer les modifications"}
        </button>
      </div>
    </div>
  );
}
