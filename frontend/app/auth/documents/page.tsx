"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { useAuthenticatedAPI } from "../hooks/useAuthenticatedAPI";
import { uploadDocument, getMyDocuments } from "../services/documentService";
import { getStoredAccessToken } from "../services/tokenHelper";
import type { DocumentType } from "../services/documentService";
import type { UserRole } from "../types";

type DocConfig = {
  type: DocumentType;
  label: string;
  description: string;
  accept: string;
};

const DOCS_BY_ROLE: Partial<Record<UserRole, DocConfig[]>> = {
  RESTAURANT_OWNER: [
    { type: "kbis",         label: "Extrait Kbis",               description: "Extrait Kbis ou SIRET de moins de 3 mois",        accept: ".pdf,.jpg,.jpeg,.png" },
    { type: "id_card",      label: "Pièce d'identité du gérant", description: "CNI ou passeport en cours de validité",            accept: ".pdf,.jpg,.jpeg,.png" },
    { type: "food_hygiene", label: "Attestation d'hygiène",       description: "Certificat de formation à l'hygiène alimentaire", accept: ".pdf,.jpg,.jpeg,.png" },
  ],
  DRIVER: [
    { type: "id_card",              label: "Pièce d'identité",   description: "CNI ou passeport en cours de validité",           accept: ".pdf,.jpg,.jpeg,.png" },
    { type: "driving_license",      label: "Permis de conduire", description: "Permis de conduire valide",                       accept: ".pdf,.jpg,.jpeg,.png" },
    { type: "vehicle_insurance",    label: "Assurance véhicule", description: "Attestation d'assurance en cours de validité",    accept: ".pdf,.jpg,.jpeg,.png" },
    { type: "vehicle_registration", label: "Carte grise",        description: "Certificat d'immatriculation du véhicule",        accept: ".pdf,.jpg,.jpeg,.png" },
  ],
};

const ROLE_LABEL: Partial<Record<UserRole, string>> = {
  RESTAURANT_OWNER: "Restaurant",
  DRIVER:           "Livreur",
};

type UploadStatus = "idle" | "uploading" | "done" | "error";

export default function DocumentsPage() {
  const { user, tokens } = useAuth();
  const { callWithRefresh } = useAuthenticatedAPI();
  const router = useRouter();

  const requiredDocs = user ? (DOCS_BY_ROLE[user.role] ?? []) : [];

  const [statuses, setStatuses] = useState<Record<DocumentType, UploadStatus>>(
    () => Object.fromEntries(requiredDocs.map((docConfig) => [docConfig.type, "idle" as UploadStatus])) as Record<DocumentType, UploadStatus>,
  );
  const [errors, setErrors] = useState<Partial<Record<DocumentType, string>>>({});
  const inputRefs = useRef<Partial<Record<DocumentType, HTMLInputElement | null>>>({});

  useEffect(() => {
    if (!tokens?.accessToken) return;
    callWithRefresh((token) => getMyDocuments(token)).then(({ data }) => {
      if (!data || !data.length) return;
      setStatuses((previousStatuses) => {
        const updatedStatuses = { ...previousStatuses };
        data.forEach((uploadedDocument) => { if (uploadedDocument.type in updatedStatuses) updatedStatuses[uploadedDocument.type as DocumentType] = "done"; });
        return updatedStatuses;
      });
    });
  }, [tokens]);

  useEffect(() => {
    if (user && requiredDocs.length === 0) router.replace("/dashboard");
  }, [user, requiredDocs.length, router]);

  const allDone = requiredDocs.length > 0 && requiredDocs.every((docConfig) => statuses[docConfig.type] === "done");

  /* ── Upload avec auto-refresh si 401 ── */
  const handleFile = async (type: DocumentType, file: File) => {
    if (!tokens?.accessToken) return;

    setStatuses((previousStatuses) => ({ ...previousStatuses, [type]: "uploading" }));
    setErrors((previousErrors) => ({ ...previousErrors, [type]: undefined }));

    const uploadResult = await callWithRefresh((token) => uploadDocument(type, file, token));

    if (uploadResult.ok) {
      setStatuses((previousStatuses) => ({ ...previousStatuses, [type]: "done" }));
    } else {
      setStatuses((previousStatuses) => ({ ...previousStatuses, [type]: "error" }));
      setErrors((previousErrors) => ({ ...previousErrors, [type]: uploadResult.message ?? "Erreur lors de l'envoi" }));
    }
  };

  if (!user) return null;

  const renderStatusIcon = (uploadStatus: UploadStatus) => {
    if (uploadStatus === "done")      return <span className="text-emerald-600 font-bold text-lg">✓</span>;
    if (uploadStatus === "uploading") return <span className="text-slate-400 animate-pulse text-sm">Envoi…</span>;
    if (uploadStatus === "error")     return <span className="text-red-500 font-bold text-lg">✕</span>;
    return null;
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-amber-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-orange-600 mb-1">EcoEats</p>
          <h1 className="text-2xl font-black text-slate-900">Documents requis</h1>
          <p className="text-slate-500 text-sm mt-1">
            Déposez les justificatifs pour valider votre compte{" "}
            <span className="font-semibold">{ROLE_LABEL[user.role]}</span>.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          {requiredDocs.map((requiredDocument) => {
            const status = statuses[requiredDocument.type] ?? "idle";
            return (
              <div key={requiredDocument.type} className={`rounded-xl border-2 p-4 transition ${
                status === "done"  ? "border-emerald-300 bg-emerald-50" :
                status === "error" ? "border-red-300 bg-red-50" :
                "border-slate-200 hover:border-slate-300"
              }`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm">{requiredDocument.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{requiredDocument.description}</p>
                    <p className="text-xs text-slate-400 mt-1">PDF, JPG ou PNG · max 10 Mo</p>
                    {errors[requiredDocument.type] && (
                      <p className="text-xs text-red-600 mt-1">{errors[requiredDocument.type]}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {renderStatusIcon(status)}
                    <button
                      type="button"
                      disabled={status === "uploading"}
                      onClick={() => inputRefs.current[requiredDocument.type]?.click()}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                        status === "done"
                          ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          : "bg-orange-600 text-white hover:bg-orange-700"
                      } disabled:opacity-50`}
                    >
                      {status === "done" ? "Remplacer" : "Choisir"}
                    </button>
                    <input
                      ref={(inputElement) => { inputRefs.current[requiredDocument.type] = inputElement; }}
                      type="file"
                      accept={requiredDocument.accept}
                      className="hidden"
                      onChange={(changeEvent) => {
                        const selectedFile = changeEvent.target.files?.[0];
                        if (selectedFile) handleFile(requiredDocument.type, selectedFile);
                        changeEvent.target.value = "";
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Progression */}
          <div className="pt-2">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Progression</span>
              <span>{requiredDocs.filter((docConfig) => statuses[docConfig.type] === "done").length} / {requiredDocs.length}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div
                className="bg-orange-500 h-1.5 rounded-full transition-all"
                style={{ width: `${(requiredDocs.filter((docConfig) => statuses[docConfig.type] === "done").length / requiredDocs.length) * 100}%` }}
              />
            </div>
          </div>

          <button
            onClick={() => router.push("/dashboard")}
            disabled={!allDone}
            className="w-full rounded-xl bg-orange-600 py-3 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Accéder au tableau de bord →
          </button>

          {!allDone && (
            <p className="text-center text-xs text-slate-400">
              Tous les documents ci-dessus sont obligatoires avant de continuer.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
