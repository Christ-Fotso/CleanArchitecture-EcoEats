import { Router } from "express";
import type { Request, Response, RequestHandler } from "express";
import multer from "multer";
import path from "node:path";
import { mkdirSync } from "node:fs";
import { z } from "zod";
import type { IUserRepository } from "../../../application/ports/IUserRepository.js";
import { UserPresenter } from "../../presenters/UserPresenter.js";

const UPLOADS_DIR = "uploads";
mkdirSync(UPLOADS_DIR, { recursive: true });

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const fileExtension = path.extname(file.originalname);
    cb(null, `avatar-${Date.now()}-${Math.random().toString(36).slice(2)}${fileExtension}`);
  },
});

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    cb(null, allowedMimeTypes.includes(file.mimetype));
  },
});

const updateProfileSchema = z.object({
  name:  z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
});

const dietSchema = z.enum(["none", "vegetarian", "vegan", "gluten_free", "halal", "kosher"]);
const allergySchema = z.enum(["gluten", "lactose", "peanuts", "eggs", "shellfish", "tree_nuts", "soy", "fish"]);
const cuisineSchema = z.enum(["french", "italian", "asian", "japanese", "indian", "mexican", "american", "mediterranean"]);

const updatePreferencesSchema = z.object({
  diet:      dietSchema,
  allergies: z.array(allergySchema),
  cuisines:  z.array(cuisineSchema),
});

import type { PrismaClient } from "@prisma/client";

export function createUserRoutes(
  userRepository: IUserRepository,
  prisma:         PrismaClient,
  requireAuth: RequestHandler,
): Router {
  const router = Router();

  /* ── Adresses ── */
  router.get("/me/addresses", requireAuth, async (request: Request, response: Response) => {
    try {
      const addresses = await prisma.userAddress.findMany({
        where: { user_id: request.user!.id },
        orderBy: { is_default: "desc" },
      });
      response.json(addresses.map(a => ({
        id:         a.id,
        label:      a.label,
        street:     a.street,
        city:       a.city,
        lat:        a.lat,
        lng:        a.lng,
        is_default: a.is_default,
      })));
    } catch (err) {
      console.error("Error fetching addresses:", err);
      response.status(500).json({ message: "Erreur lors de la récupération des adresses" });
    }
  });

  router.post("/me/addresses", requireAuth, async (request: Request, response: Response) => {
    const schema = z.object({
      label:  z.string().min(1),
      street: z.string().min(1),
      city:   z.string().min(1),
      lat:    z.number(),
      lng:    z.number(),
      is_default: z.boolean().default(false),
    });

    const parsed = schema.safeParse(request.body);
    if (!parsed.success) return response.status(400).json({ message: "Données invalides" });

    try {
      if (parsed.data.is_default) {
        await prisma.userAddress.updateMany({
          where: { user_id: request.user!.id },
          data: { is_default: false },
        });
      }

      const address = await prisma.userAddress.create({
        data: {
          user_id: request.user!.id,
          ...parsed.data,
        },
      });
      response.status(201).json(address);
    } catch (err) {
      console.error("Error creating address:", err);
      response.status(500).json({ message: "Erreur lors de la création de l'adresse" });
    }
  });

  router.patch("/me", requireAuth, async (request: Request, response: Response) => {
    const parsedProfileUpdate = updateProfileSchema.safeParse(request.body);
    if (!parsedProfileUpdate.success) {
      response.status(400).json({ message: "Données invalides" });
      return;
    }
    if (!parsedProfileUpdate.data.name && !parsedProfileUpdate.data.phone) {
      response.status(400).json({ message: "Aucune donnée à mettre à jour" });
      return;
    }
    try {
      const updateInput = {
        ...(parsedProfileUpdate.data.name ? { name: parsedProfileUpdate.data.name } : {}),
        ...(parsedProfileUpdate.data.phone ? { phone: parsedProfileUpdate.data.phone } : {}),
      };
      const updated = await userRepository.update(request.user!.id, updateInput);
      response.json(UserPresenter.toDto(updated));
    } catch {
      response.status(500).json({ message: "Erreur lors de la mise à jour" });
    }
  });

  router.get("/me/preferences", requireAuth, async (request: Request, response: Response) => {
    try {
      const user = await userRepository.findById(request.user!.id);
      if (!user) { response.status(404).json({ message: "Utilisateur introuvable" }); return; }
      response.json({ diet: user.preferences?.diet ?? "none", cuisines: user.preferences?.cuisines ?? [], allergies: user.allergies ?? [] });
    } catch {
      response.status(500).json({ message: "Erreur lors de la récupération des préférences" });
    }
  });

  router.patch("/me/preferences", requireAuth, async (request: Request, response: Response) => {
    const parsedPreferencesUpdate = updatePreferencesSchema.safeParse(request.body);
    if (!parsedPreferencesUpdate.success) {
      response.status(400).json({ message: "Préférences invalides", errors: parsedPreferencesUpdate.error.issues });
      return;
    }
    try {
      const { diet, allergies, cuisines } = parsedPreferencesUpdate.data;
      const updated = await userRepository.update(request.user!.id, {
        preferences: { diet, cuisines },
        allergies,
      });
      response.json(UserPresenter.toDto(updated));
    } catch {
      response.status(500).json({ message: "Erreur lors de la mise à jour des préférences" });
    }
  });

  router.post(
    "/me/avatar",
    requireAuth,
    uploadAvatar.single("avatar"),
    async (request: Request, response: Response) => {
      if (!request.file) {
        response.status(400).json({ message: "Aucune image fournie" });
        return;
      }
      try {
        const updated = await userRepository.update(request.user!.id, {
          photo_url: request.file.filename,
        });
        response.json(UserPresenter.toDto(updated));
      } catch {
        response.status(500).json({ message: "Erreur lors de la mise à jour de l'avatar" });
      }
    },
  );

  return router;
}
