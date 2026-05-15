import { Router } from "express";
import type { Request, Response, RequestHandler } from "express";
import multer from "multer";
import path from "node:path";
import { mkdirSync } from "node:fs";
import { z } from "zod";
import type { GetRestaurantMenuUseCase }          from "../../../application/usecases/menu/GetRestaurantMenuUseCase.js";
import type { CreateMenuCategoryUseCase }          from "../../../application/usecases/menu/CreateMenuCategoryUseCase.js";
import type { UpdateMenuCategoryUseCase }          from "../../../application/usecases/menu/UpdateMenuCategoryUseCase.js";
import type { DeleteMenuCategoryUseCase }          from "../../../application/usecases/menu/DeleteMenuCategoryUseCase.js";
import type { CreateMenuItemUseCase }              from "../../../application/usecases/menu/CreateMenuItemUseCase.js";
import type { UpdateMenuItemUseCase }              from "../../../application/usecases/menu/UpdateMenuItemUseCase.js";
import type { DeleteMenuItemUseCase }              from "../../../application/usecases/menu/DeleteMenuItemUseCase.js";
import type { ToggleMenuItemAvailabilityUseCase }  from "../../../application/usecases/menu/ToggleMenuItemAvailabilityUseCase.js";
import type { UpdateMenuItemStockUseCase }         from "../../../application/usecases/menu/UpdateMenuItemStockUseCase.js";
import type { CreateMenuItemOptionUseCase }        from "../../../application/usecases/menu/CreateMenuItemOptionUseCase.js";
import type { ExportMenuCsvUseCase }               from "../../../application/usecases/menu/ExportMenuCsvUseCase.js";
import type { ImportMenuCsvUseCase }               from "../../../application/usecases/menu/ImportMenuCsvUseCase.js";
import type { IMenuItemRepository }               from "../../../application/ports/IMenuItemRepository.js";
import type { IMenuCategoryRepository }           from "../../../application/ports/IMenuCategoryRepository.js";
import { domainErrorToStatus }                     from "../utils/domainErrorToStatus.js";
import { MenuPresenter }                           from "../../presenters/MenuPresenter.js";

const PHOTOS_DIR = "uploads/menu";
mkdirSync(PHOTOS_DIR, { recursive: true });

const photoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, PHOTOS_DIR),
  filename:    (_req, file, cb) => {
    cb(null, `menu-${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`);
  },
});
const uploadPhoto = multer({ storage: photoStorage, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadCsv   = multer({ storage: multer.memoryStorage(), limits: { fileSize: 1 * 1024 * 1024 } });

// ── Zod schemas ───────────────────────────────────────────────────────────────

const availabilitySchema = z.enum(["always", "lunch", "dinner", "weekend"]);

const createCategorySchema = z.object({
  name:         z.string().min(1),
  availability: availabilitySchema.default("always"),
});
const updateCategorySchema = z.object({
  name:         z.string().min(1).optional(),
  availability: availabilitySchema.optional(),
  position:     z.number().int().min(0).optional(),
});
const reorderSchema = z.object({ orderedIds: z.array(z.string().uuid()) });

const createItemSchema = z.object({
  categoryId:  z.string().uuid(),
  name:        z.string().min(1),
  description: z.string().optional(),
  price:       z.number().min(0),
  isAvailable: z.boolean().default(true),
  isPopular:   z.boolean().default(false),
  dailyStock:  z.number().int().min(0).optional(),
  allergens:   z.array(z.string()).optional(),
});
const updateItemSchema = z.object({
  name:        z.string().min(1).optional(),
  description: z.string().optional(),
  price:       z.number().min(0).optional(),
  isAvailable: z.boolean().optional(),
  isPopular:   z.boolean().optional(),
  dailyStock:  z.number().int().min(0).nullable().optional(),
  allergens:   z.array(z.string()).optional(),
});

const createOptionSchema = z.object({
  name:       z.string().min(1),
  type:       z.enum(["single", "multiple"]),
  isRequired: z.boolean().default(false),
  values:     z.array(z.object({ label: z.string().min(1), extraPrice: z.number().min(0) })).min(1),
});

// ─────────────────────────────────────────────────────────────────────────────

export function createMenuRoutes(
  getRestaurantMenuUseCase:          GetRestaurantMenuUseCase,
  createMenuCategoryUseCase:         CreateMenuCategoryUseCase,
  updateMenuCategoryUseCase:         UpdateMenuCategoryUseCase,
  deleteMenuCategoryUseCase:         DeleteMenuCategoryUseCase,
  createMenuItemUseCase:             CreateMenuItemUseCase,
  updateMenuItemUseCase:             UpdateMenuItemUseCase,
  deleteMenuItemUseCase:             DeleteMenuItemUseCase,
  toggleMenuItemAvailabilityUseCase: ToggleMenuItemAvailabilityUseCase,
  updateMenuItemStockUseCase:        UpdateMenuItemStockUseCase,
  createMenuItemOptionUseCase:       CreateMenuItemOptionUseCase,
  exportMenuCsvUseCase:              ExportMenuCsvUseCase,
  importMenuCsvUseCase:              ImportMenuCsvUseCase,
  menuItemRepository:                IMenuItemRepository,
  menuCategoryRepository:            IMenuCategoryRepository,
  requireAuth: RequestHandler,
): Router {
  const router = Router({ mergeParams: true });

  const rid = (req: Request) => req.params.restaurantId!;
  const iid = (req: Request) => req.params.itemId!;
  const cid = (req: Request) => req.params.categoryId!;

  /* ── Menu public ──────────────────────────────────────────────────── */
  router.get("/", async (request: Request, response: Response) => {
    const menu = await getRestaurantMenuUseCase.execute(rid(request));
    response.json(MenuPresenter.toCategoryDtoList(menu));
  });

  /* ── Catégories ───────────────────────────────────────────────────── */
  router.post("/categories", requireAuth, async (request: Request, response: Response) => {
    const parsed = createCategorySchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json({ message: "Données invalides", errors: parsed.error.issues }); return; }
    const result = await createMenuCategoryUseCase.execute({ restaurantId: rid(request), ...parsed.data });
    response.status(201).json(MenuPresenter.toCategoryDto(result.value));
  });

  router.patch("/categories/reorder", requireAuth, async (request: Request, response: Response) => {
    const parsed = reorderSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json({ message: "Données invalides" }); return; }
    await menuCategoryRepository.reorder(rid(request), parsed.data.orderedIds);
    response.status(204).send();
  });

  router.patch("/categories/:categoryId", requireAuth, async (request: Request, response: Response) => {
    const parsed = updateCategorySchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json({ message: "Données invalides" }); return; }
    const result = await updateMenuCategoryUseCase.execute({ restaurantId: rid(request), categoryId: cid(request), input: parsed.data });
    if (!result.ok) { response.status(domainErrorToStatus(result.error)).json({ message: result.error.message }); return; }
    response.json(MenuPresenter.toCategoryDto(result.value));
  });

  router.delete("/categories/:categoryId", requireAuth, async (request: Request, response: Response) => {
    const result = await deleteMenuCategoryUseCase.execute({ restaurantId: rid(request), categoryId: cid(request) });
    if (!result.ok) { response.status(domainErrorToStatus(result.error)).json({ message: result.error.message }); return; }
    response.status(204).send();
  });

  /* ── Items ────────────────────────────────────────────────────────── */
  router.post("/items", requireAuth, async (request: Request, response: Response) => {
    const parsed = createItemSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json({ message: "Données invalides", errors: parsed.error.issues }); return; }
    const result = await createMenuItemUseCase.execute({ restaurantId: rid(request), input: parsed.data });
    if (!result.ok) { response.status(domainErrorToStatus(result.error)).json({ message: result.error.message }); return; }
    response.status(201).json(MenuPresenter.toItemDto(result.value));
  });

  router.patch("/items/:itemId", requireAuth, async (request: Request, response: Response) => {
    const parsed = updateItemSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json({ message: "Données invalides" }); return; }
    const result = await updateMenuItemUseCase.execute({ restaurantId: rid(request), itemId: iid(request), input: parsed.data });
    if (!result.ok) { response.status(domainErrorToStatus(result.error)).json({ message: result.error.message }); return; }
    response.json(MenuPresenter.toItemDto(result.value));
  });

  router.delete("/items/:itemId", requireAuth, async (request: Request, response: Response) => {
    const result = await deleteMenuItemUseCase.execute({ restaurantId: rid(request), itemId: iid(request) });
    if (!result.ok) { response.status(domainErrorToStatus(result.error)).json({ message: result.error.message }); return; }
    response.status(204).send();
  });

  router.patch("/items/:itemId/availability", requireAuth, async (request: Request, response: Response) => {
    const parsed = z.object({ isAvailable: z.boolean() }).safeParse(request.body);
    if (!parsed.success) { response.status(400).json({ message: "Données invalides" }); return; }
    const result = await toggleMenuItemAvailabilityUseCase.execute({ restaurantId: rid(request), itemId: iid(request), isAvailable: parsed.data.isAvailable });
    if (!result.ok) { response.status(domainErrorToStatus(result.error)).json({ message: result.error.message }); return; }
    response.json(MenuPresenter.toItemDto(result.value));
  });

  router.patch("/items/:itemId/stock", requireAuth, async (request: Request, response: Response) => {
    const parsed = z.object({ dailyStock: z.number().int().min(0).nullable() }).safeParse(request.body);
    if (!parsed.success) { response.status(400).json({ message: "Données invalides" }); return; }
    const result = await updateMenuItemStockUseCase.execute({ restaurantId: rid(request), itemId: iid(request), dailyStock: parsed.data.dailyStock });
    if (!result.ok) { response.status(domainErrorToStatus(result.error)).json({ message: result.error.message }); return; }
    response.json(MenuPresenter.toItemDto(result.value));
  });

  router.post("/items/:itemId/photo", requireAuth, uploadPhoto.single("photo"), async (request: Request, response: Response) => {
    if (!request.file) { response.status(400).json({ message: "Aucune photo fournie" }); return; }
    const updated = await menuItemRepository.updatePhotoUrl(iid(request), request.file.path);
    response.json(MenuPresenter.toItemDto(updated));
  });

  /* ── Options ──────────────────────────────────────────────────────── */
  router.post("/items/:itemId/options", requireAuth, async (request: Request, response: Response) => {
    const parsed = createOptionSchema.safeParse(request.body);
    if (!parsed.success) { response.status(400).json({ message: "Données invalides", errors: parsed.error.issues }); return; }
    const result = await createMenuItemOptionUseCase.execute({ restaurantId: rid(request), input: { itemId: iid(request), ...parsed.data } });
    if (!result.ok) { response.status(domainErrorToStatus(result.error)).json({ message: result.error.message }); return; }
    response.status(201).json(MenuPresenter.toOptionDto(result.value));
  });

  router.delete("/options/:optionId", requireAuth, async (request: Request, response: Response) => {
    await menuItemRepository.removeOption(request.params.optionId!);
    response.status(204).send();
  });

  /* ── CSV ──────────────────────────────────────────────────────────── */
  router.get("/export", requireAuth, async (request: Request, response: Response) => {
    const csv = await exportMenuCsvUseCase.execute(rid(request));
    response.setHeader("Content-Type", "text/csv; charset=utf-8");
    response.setHeader("Content-Disposition", `attachment; filename="menu-${rid(request)}.csv"`);
    response.send("﻿" + csv);
  });

  router.post("/import", requireAuth, uploadCsv.single("file"), async (request: Request, response: Response) => {
    if (!request.file) { response.status(400).json({ message: "Aucun fichier fourni" }); return; }
    const result = await importMenuCsvUseCase.execute(rid(request), request.file.buffer.toString("utf-8"));
    if (!result.ok) { response.status(422).json({ message: result.error.message }); return; }
    response.json(result.value);
  });

  return router;
}
