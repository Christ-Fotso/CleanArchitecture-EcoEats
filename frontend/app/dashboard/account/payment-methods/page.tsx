"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../../auth/context/AuthContext";
import { getStoredAccessToken } from "../../../auth/services/tokenHelper";
import { refreshService } from "../../../auth/services/refreshService";
import type { ApiResult } from "../../../auth/types";
import {
  getSavedPaymentMethods,
  removePaymentMethod,
} from "../../../auth/services/payment/savedPaymentMethodService";
import type { SavedPaymentMethod } from "../../../auth/services/payment/savedPaymentMethodService";

const CARD_BRAND_ICONS: Record<string, string> = {
  visa:       "VISA",
  mastercard: "MC",
  amex:       "AMEX",
};

export default function PaymentMethodsPage() {
  const { tokens } = useAuth();

  const [paymentMethods, setPaymentMethods] = useState<SavedPaymentMethod[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [pageError,      setPageError]      = useState<string | null>(null);
  const [removingId,     setRemovingId]     = useState<string | null>(null);

  const stripeKeyConfigured = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  const executeWithRefresh = useCallback(async <T,>(
    request: (accessToken: string) => Promise<ApiResult<T>>,
  ): Promise<ApiResult<T> | null> => {
    const currentAccessToken = tokens?.accessToken ?? getStoredAccessToken();
    if (!currentAccessToken) return null;

    let result = await request(currentAccessToken);
    if (!result.ok && result.status === 401) {
      const storedRefreshToken = typeof window !== "undefined"
        ? localStorage.getItem("refreshToken")
        : null;
      if (!storedRefreshToken) return result;

      const refreshed = await refreshService(storedRefreshToken);
      if (!refreshed) return result;

      const refreshedAccessToken = getStoredAccessToken();
      if (!refreshedAccessToken) return result;
      result = await request(refreshedAccessToken);
    }

    return result;
  }, [tokens]);

  useEffect(() => {
    let isMounted = true;

    const loadPaymentMethods = async () => {
      if (!tokens?.accessToken) {
        if (isMounted) setLoading(false);
        return;
      }

      const result = await executeWithRefresh((accessToken) => getSavedPaymentMethods(accessToken));
      if (!isMounted) return;

      if (result?.ok) {
        setPaymentMethods(result.data ?? []);
      } else if (result) {
        setPageError(result.message ?? "Erreur de chargement");
      }
      setLoading(false);
    };

    void loadPaymentMethods();
    return () => { isMounted = false; };
  }, [tokens, executeWithRefresh]);

  const handleRemove = async (paymentMethodId: string) => {
    setRemovingId(paymentMethodId);
    const result = await executeWithRefresh((accessToken) => removePaymentMethod(paymentMethodId, accessToken));

    if (result?.ok) {
      setPaymentMethods((previous) => previous.filter((method) => method.id !== paymentMethodId));
    } else {
      setPageError(result?.message ?? "Erreur lors de la suppression");
    }
    setRemovingId(null);
  };

  if (loading) return <p className="text-slate-400 text-sm">Chargement…</p>;

  return (
    <div className="max-w-lg mx-auto space-y-6">

      {/* Liste des cartes */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-100">
        {paymentMethods.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-slate-400">
            Aucune carte enregistrée.
          </p>
        ) : (
          paymentMethods.map((method) => (
            <div key={method.id} className="flex items-center gap-4 px-6 py-4">
              <span className="w-10 h-7 flex items-center justify-center rounded bg-slate-100 text-xs font-bold text-slate-600 shrink-0">
                {CARD_BRAND_ICONS[method.brand] ?? "💳"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900">
                  •••• •••• •••• {method.last4}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Expire {String(method.expiryMonth).padStart(2, "0")}/{method.expiryYear}
                </p>
                {method.isDefault && (
                  <span className="inline-block mt-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                    Par défaut
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleRemove(method.id)}
                disabled={removingId === method.id}
                className="text-xs text-red-500 hover:text-red-700 font-medium transition disabled:opacity-50 shrink-0"
              >
                {removingId === method.id ? "…" : "Supprimer"}
              </button>
            </div>
          ))
        )}
      </section>

      {pageError && <p className="text-sm text-red-600 font-medium">{pageError}</p>}

      {/* Ajouter une carte — uniquement si Stripe est configuré */}
      {!stripeKeyConfigured ? (
        <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50 px-6 py-5 text-center">
          <p className="text-sm font-semibold text-amber-700">Paiement non disponible</p>
          <p className="text-xs text-amber-600 mt-1">
            La clé Stripe n&apos;est pas configurée sur ce serveur.
            Contactez l&apos;administrateur.
          </p>
        </div>
      ) : (
        paymentMethods.length < 5 && (
          <StripeAddCard onSuccess={(m) => setPaymentMethods((prev) => [...prev, m])} />
        )
      )}

    </div>
  );
}

/* ── Formulaire Stripe chargé dynamiquement ── */
function StripeAddCard({ onSuccess }: { onSuccess: (m: SavedPaymentMethod) => void }) {
  const { tokens } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [ready,   setReady]   = useState(false);
  const [StripeElements, setStripeElements]       = useState<typeof import("@stripe/react-stripe-js") | null>(null);
  const [stripeInstance, setStripeInstance]       = useState<unknown>(null);
  const [clientSecret,   setClientSecret]         = useState<string | null>(null);

  useEffect(() => {
    // Chargement dynamique de Stripe pour éviter le crash si non configuré
    Promise.all([
      import("@stripe/react-stripe-js"),
      import("../../../auth/services/payment/stripeClient").then((m) => m.getStripe()),
    ]).then(([stripeLib, stripe]) => {
      setStripeElements(stripeLib);
      setStripeInstance(stripe);
    }).catch(() => setError("Impossible de charger Stripe"));
  }, []);

  const handleStart = async () => {
    if (!tokens?.accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const { createSetupIntent } = await import("../../../auth/services/payment/paymentIntentService");
      const result = await createSetupIntent(tokens.accessToken);
      if (!result.ok || !result.data) {
        setError("Impossible d'initialiser le paiement");
        return;
      }
      setClientSecret(result.data.clientSecret);
      setReady(true);
    } catch {
      setError("Erreur lors de la connexion au service de paiement");
    } finally {
      setLoading(false);
    }
  };

  if (!ready || !clientSecret || !StripeElements || !stripeInstance) {
    return (
      <div className="space-y-3">
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="button"
          onClick={handleStart}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 px-6 py-4 text-sm font-semibold text-slate-500 hover:border-orange-300 hover:text-orange-600 transition w-full disabled:opacity-50"
        >
          <span className="text-lg">+</span>
          {loading ? "Initialisation…" : "Ajouter une carte"}
        </button>
      </div>
    );
  }

  const { Elements, CardElement, useStripe, useElements } = StripeElements;

  function InnerForm() {
    const stripe   = useStripe();
    const elements = useElements();
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!stripe || !elements || !tokens?.accessToken || !clientSecret) return;
      setSaving(true);
      setFormError(null);

      const cardEl = elements.getElement(CardElement);
      if (!cardEl) return;

      const { setupIntent, error: stripeErr } = await stripe.confirmCardSetup(
        clientSecret, { payment_method: { card: cardEl } }
      );

      if (stripeErr) { setFormError(stripeErr.message ?? "Erreur Stripe"); setSaving(false); return; }
      if (!setupIntent?.payment_method) { setFormError("Méthode de paiement introuvable"); setSaving(false); return; }

      const { confirmAndSavePaymentMethod } = await import("../../../auth/services/payment/savedPaymentMethodService");
      const result = await confirmAndSavePaymentMethod(String(setupIntent.payment_method), tokens.accessToken);
      if (result.ok && result.data) {
        onSuccess(result.data);
        setReady(false);
        setClientSecret(null);
      } else {
        setFormError(result.message ?? "Erreur lors de l'enregistrement");
      }
      setSaving(false);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl border border-slate-200 px-4 py-3 bg-white">
          <CardElement options={{ style: { base: { fontSize: "14px", color: "#0f172a" } } }} />
        </div>
        {formError && <p className="text-xs text-red-600">{formError}</p>}
        <button type="submit" disabled={!stripe || saving}
          className="w-full rounded-xl bg-orange-600 py-2.5 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-50 transition">
          {saving ? "Enregistrement…" : "Enregistrer la carte"}
        </button>
        <button type="button" onClick={() => { setReady(false); setClientSecret(null); }}
          className="w-full rounded-xl border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
          Annuler
        </button>
      </form>
    );
  }

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Nouvelle carte</h3>
      <Elements stripe={stripeInstance as never} options={{ clientSecret }}>
        <InnerForm />
      </Elements>
    </section>
  );
}
