import { Router } from "express";
import type { Request, Response, RequestHandler } from "express";
import multer from "multer";
import path from "node:path";
import { mkdirSync } from "node:fs";
import { z } from "zod";

const LOGOS_DIR = "uploads/logos";
mkdirSync(LOGOS_DIR, { recursive: true });

const logoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, LOGOS_DIR),
  filename:    (_req, file, cb) => {
    cb(null, `logo-${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`);
  },
});
const uploadLogo = multer({
  storage: logoStorage,
  limits:  { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype));
  },
});
import type { GetOwnerRestaurantsUseCase } from "../../../application/usecases/restaurant/GetOwnerRestaurantsUseCase.js";
import type { CreateRestaurantUseCase } from "../../../application/usecases/restaurant/CreateRestaurantUseCase.js";
import type { UpdateRestaurantProfileUseCase } from "../../../application/usecases/restaurant/UpdateRestaurantProfileUseCase.js";
import type { UpdateOpeningHoursUseCase } from "../../../application/usecases/restaurant/UpdateOpeningHoursUseCase.js";
import type { ToggleRestaurantStatusUseCase } from "../../../application/usecases/restaurant/ToggleRestaurantStatusUseCase.js";
import type { IRestaurantRepository } from "../../../application/ports/IRestaurantRepository.js";
import { domainErrorToStatus } from "../utils/domainErrorToStatus.js";
import { RestaurantPresenter } from "../../presenters/RestaurantPresenter.js";
import { haversineDistance, calculateDeliveryFee, estimateDeliveryTime } from "../../../shared/utils/deliveryCalculator.js";

const timeSlotSchema = z.object({
  open:  z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  close: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
}).nullable();

const openingHoursSchema = z.object({
  monday:    timeSlotSchema.optional(),
  tuesday:   timeSlotSchema.optional(),
  wednesday: timeSlotSchema.optional(),
  thursday:  timeSlotSchema.optional(),
  friday:    timeSlotSchema.optional(),
  saturday:  timeSlotSchema.optional(),
  sunday:    timeSlotSchema.optional(),
});

const createRestaurantSchema = z.object({
  name:        z.string().min(2),
  description: z.string().optional(),
  address:     z.string().min(5),
  lat:         z.number(),
  lng:         z.number(),
  cuisineType: z.string().min(1),
  prepTimeMin: z.number().int().positive(),
  deliveryFee: z.number().min(0),
});

const updateProfileSchema = z.object({
  name:        z.string().min(2).optional(),
  description: z.string().optional(),
  address:     z.string().min(5).optional(),
  cuisineType: z.string().min(1).optional(),
  prepTimeMin: z.number().int().positive().optional(),
  deliveryFee: z.number().min(0).optional(),
});

export function createRestaurantRoutes(
  getOwnerRestaurantsUseCase:     GetOwnerRestaurantsUseCase,
  createRestaurantUseCase:        CreateRestaurantUseCase,
  updateRestaurantProfileUseCase: UpdateRestaurantProfileUseCase,
  updateOpeningHoursUseCase:      UpdateOpeningHoursUseCase,
  toggleRestaurantStatusUseCase:  ToggleRestaurantStatusUseCase,
  restaurantRepository:           IRestaurantRepository,
  requireAuth: RequestHandler,
): Router {
  const router = Router();

  router.get("/active", async (request: Request, response: Response) => {
    const restaurants = await restaurantRepository.findAllActive();

    // Coordonnées GPS du client (optionnelles, envoyées par le frontend)
    const clientLat = parseFloat(request.query.lat as string);
    const clientLng = parseFloat(request.query.lng as string);
    const hasClientLocation = !isNaN(clientLat) && !isNaN(clientLng);

    const dtos = RestaurantPresenter.toDtoList(restaurants).map((r: any) => {
      if (hasClientLocation && r.lat && r.lng) {
        const distanceKm    = haversineDistance(clientLat, clientLng, r.lat, r.lng);
        const deliveryFee   = calculateDeliveryFee(distanceKm);
        const deliveryTime  = estimateDeliveryTime(distanceKm, r.prepTimeMin ?? 20);
        return {
          ...r,
          deliveryFee,
          prepTimeMin:  deliveryTime,
          distanceKm:   Math.round(distanceKm * 10) / 10,
        };
      }
      return r;
    });

    response.json(dtos);
  });


  router.get("/:id/public", async (request: Request, response: Response) => {
    const { id } = request.params;
    if (!id) { response.status(400).json({ message: "Identifiant manquant" }); return; }
    const restaurant = await restaurantRepository.findById(id);
    if (!restaurant) { response.status(404).json({ message: "Restaurant introuvable" }); return; }
    response.json(RestaurantPresenter.toDto(restaurant));
  });

  router.get("/", requireAuth, async (request: Request, response: Response) => {
    const restaurants = await getOwnerRestaurantsUseCase.execute(request.user!.id);
    response.json(RestaurantPresenter.toDtoList(restaurants));
  });


  router.post("/", requireAuth, async (request: Request, response: Response) => {
    const parsed = createRestaurantSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({ message: "Données invalides", errors: parsed.error.issues });
      return;
    }

    const result = await createRestaurantUseCase.execute({
      ownerId:     request.user!.id,
      ...parsed.data,
    });

    response.status(201).json(RestaurantPresenter.toDto(result.value));
  });

  router.patch("/:id", requireAuth, async (request: Request, response: Response) => {
    const { id } = request.params;
    if (!id) { response.status(400).json({ message: "Identifiant manquant" }); return; }

    const parsed = updateProfileSchema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({ message: "Données invalides", errors: parsed.error.issues });
      return;
    }

    const result = await updateRestaurantProfileUseCase.execute({
      ownerId:      request.user!.id,
      restaurantId: id,
      input:        parsed.data,
    });

    if (!result.ok) {
      response.status(domainErrorToStatus(result.error)).json({ message: result.error.message });
      return;
    }

    response.json(RestaurantPresenter.toDto(result.value));
  });

  router.patch("/:id/opening-hours", requireAuth, async (request: Request, response: Response) => {
    const { id } = request.params;
    if (!id) { response.status(400).json({ message: "Identifiant manquant" }); return; }

    const parsed = z.object({ openingHours: openingHoursSchema }).safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({ message: "Horaires invalides", errors: parsed.error.issues });
      return;
    }

    const result = await updateOpeningHoursUseCase.execute({
      ownerId:      request.user!.id,
      restaurantId: id,
      openingHours: parsed.data.openingHours,
    });

    if (!result.ok) {
      response.status(domainErrorToStatus(result.error)).json({ message: result.error.message });
      return;
    }

    response.json(RestaurantPresenter.toDto(result.value));
  });

  router.post("/:id/logo", requireAuth, uploadLogo.single("logo"), async (request: Request, response: Response) => {
    const { id } = request.params;
    if (!id) { response.status(400).json({ message: "Identifiant manquant" }); return; }
    if (!request.file) { response.status(400).json({ message: "Aucune image fournie" }); return; }

    const restaurant = await restaurantRepository.findById(id);
    if (!restaurant) { response.status(404).json({ message: "Restaurant introuvable" }); return; }
    if (restaurant.ownerId !== request.user!.id) { response.status(403).json({ message: "Accès refusé" }); return; }

    const updated = await restaurantRepository.updateLogoUrl(id, request.file.path);
    response.json(RestaurantPresenter.toDto(updated));
  });

  router.patch("/:id/status", requireAuth, async (request: Request, response: Response) => {
    const { id } = request.params;
    if (!id) { response.status(400).json({ message: "Identifiant manquant" }); return; }

    const parsed = z.object({ isActive: z.boolean() }).safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({ message: "Données invalides" });
      return;
    }

    const result = await toggleRestaurantStatusUseCase.execute({
      ownerId:      request.user!.id,
      restaurantId: id,
      isActive:     parsed.data.isActive,
    });

    if (!result.ok) {
      response.status(domainErrorToStatus(result.error)).json({ message: result.error.message });
      return;
    }

    response.json(RestaurantPresenter.toDto(result.value));
  });

  return router;
}
