"use client";

import { useState } from "react";

export default function AccountPrivacyPage() {
  const [confirm, setConfirm] = useState(false);

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Utilisation des données */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
          Vos données personnelles
        </h3>
        <div className="space-y-3 text-sm text-slate-600">
          <p>
            EcoEats collecte uniquement les données nécessaires au bon fonctionnement du service :
            nom, adresse e-mail, numéro de téléphone et historique de commandes.
          </p>
          <p>
            Vos données ne sont jamais revendues à des tiers. Elles sont utilisées exclusivement pour
            gérer votre compte, traiter vos commandes et améliorer notre service.
          </p>
          <p>
            Conformément au RGPD, vous pouvez demander l&apos;accès, la rectification ou la suppression
            de vos données à tout moment.
          </p>
        </div>
      </section>

      {/* Télécharger les données */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
          Télécharger mes données
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          Exportez une copie de toutes les données associées à votre compte au format JSON.
        </p>
        <button
          type="button"
          className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          Demander un export
        </button>
      </section>

      {/* Supprimer le compte */}
      <section className="bg-white rounded-2xl shadow-sm border border-red-100 p-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-red-400 mb-4">
          Supprimer mon compte
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          La suppression est définitive. Toutes vos données seront effacées et cette action est
          irréversible.
        </p>

        {!confirm ? (
          <button
            type="button"
            onClick={() => setConfirm(true)}
            className="rounded-xl border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition"
          >
            Supprimer mon compte
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-red-600">
              Êtes-vous sûr(e) ? Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700 transition"
              >
                Oui, supprimer définitivement
              </button>
              <button
                type="button"
                onClick={() => setConfirm(false)}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
