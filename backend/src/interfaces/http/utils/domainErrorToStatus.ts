import type { DomainError } from "../../../domain/errors/DomainError.js";

/**
 * Utilitaire partagé entre Express et Fastify : traduit une DomainError en
 * code HTTP. Centralisé ici pour éviter la duplication entre les deux adaptateurs.
 */
export const domainErrorToStatus = (error: DomainError): number => {
  switch (error.code) {
    case "EMAIL_ALREADY_IN_USE":
    case "PHONE_ALREADY_IN_USE":
    case "DELIVERY_ALREADY_TAKEN":    return 409;
    case "INVALID_CREDENTIALS":
    case "INVALID_TOKEN":             return 401;
    case "USER_NOT_FOUND":
    case "ORDER_NOT_FOUND":
    case "DELIVERY_NOT_FOUND":
    case "PAYMENT_METHOD_NOT_FOUND":
    case "RESTAURANT_NOT_FOUND":
    case "DOCUMENT_NOT_FOUND":
    case "MENU_CATEGORY_NOT_FOUND":
    case "MENU_ITEM_NOT_FOUND":
    case "MENU_ITEM_OPTION_NOT_FOUND":
    case "DRIVER_NOT_FOUND":           return 404;
    case "RESTAURANT_NOT_OWNED":
    case "MENU_CATEGORY_NOT_OWNED":
    case "MENU_ITEM_NOT_OWNED":
    case "PAYMENT_METHOD_NOT_OWNED":   return 403;
    case "MENU_ITEM_OUT_OF_STOCK":
    case "INVALID_MENU_CSV":           return 422;
    case "INVALID_OPENING_HOURS":     return 422;
    case "MAX_PAYMENT_METHODS_REACHED":
    case "PAYMENT_INTENT_CREATION_FAILED":
    case "SETUP_INTENT_CREATION_FAILED": return 422;
    case "UNAUTHORIZED_ORDER_ACTION": return 403;
    case "CART_DIFFERENT_RESTAURANT":
    case "CART_EMPTY":
    case "OUT_OF_STOCK":
    case "INVALID_ORDER_TRANSITION":  return 422;
    default:                          return 400;
  }
};
