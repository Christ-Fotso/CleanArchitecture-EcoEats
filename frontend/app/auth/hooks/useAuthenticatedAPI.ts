"use client";

import { useAuth } from "../context/AuthContext";
import type { ApiResult } from "../types";

export function useAuthenticatedAPI() {
  const { tokens, refresh } = useAuth();

  const callWithRefresh = async <T,>(
    apiCall: (token: string) => Promise<ApiResult<T>>,
  ): Promise<ApiResult<T>> => {
    if (!tokens?.accessToken) {
      return { ok: false, status: 401, data: null, message: "Non authentifié" };
    }

    const result = await apiCall(tokens.accessToken);

    // Si expiration du token (401), on tente un refresh automatique
    if (result.status === 401) {
      console.log("🔄 Access token expiré, tentative de refresh...");
      const success = await refresh();
      if (success) {
        // On récupère le nouveau token depuis le storage (car l'état tokens du hook est encore l'ancien)
        const { getStoredAccessToken } = await import("../services/tokenHelper");
        const newToken = getStoredAccessToken();
        if (newToken) {
          console.log("✅ Refresh réussi, nouvelle tentative de l'appel API");
          return apiCall(newToken);
        }
      }
    }

    return result;
  };

  return { callWithRefresh };
}
