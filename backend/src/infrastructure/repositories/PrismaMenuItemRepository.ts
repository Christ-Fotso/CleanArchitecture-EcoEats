import type { PrismaClient } from "@prisma/client";
import type { IMenuItemRepository } from "../../application/ports/IMenuItemRepository.js";
import type {
  MenuItem,
  MenuItemOption,
  MenuOptionValue,
  CreateMenuItemInput,
  UpdateMenuItemInput,
  CreateMenuItemOptionInput,
  MenuOptionType,
} from "../../application/menu/types.js";

export class PrismaMenuItemRepository implements IMenuItemRepository {
  constructor(private readonly prismaClient: PrismaClient) {}

  async findById(id: string, withOptions = true): Promise<MenuItem | null> {
    const record = await this.prismaClient.menuItem.findUnique({
      where:   { id },
      include: withOptions
        ? { options: { include: { values: { orderBy: { extra_price: "asc" } } } } }
        : undefined,
    });
    if (!record) return null;
    return this.toMenuItem({ ...record, options: (record as { options?: unknown[] }).options ?? [] });
  }

  async findByCategoryId(categoryId: string): Promise<MenuItem[]> {
    const records = await this.prismaClient.menuItem.findMany({
      where:   { category_id: categoryId },
      orderBy: { name: "asc" },
      include: { options: { include: { values: true } } },
    });
    return records.map((record) => this.toMenuItem(record));
  }

  async create(input: CreateMenuItemInput): Promise<MenuItem> {
    const record = await this.prismaClient.menuItem.create({
      data: {
        category_id:  input.categoryId,
        name:         input.name,
        description:  input.description ?? null,
        price:        input.price,
        is_available: input.isAvailable,
        is_popular:   input.isPopular,
        daily_stock:  input.dailyStock ?? null,
        allergens:    input.allergens ?? [],
      },
      include: { options: { include: { values: true } } },
    });
    return this.toMenuItem(record);
  }

  async update(id: string, input: UpdateMenuItemInput): Promise<MenuItem> {
    const record = await this.prismaClient.menuItem.update({
      where: { id },
      data: {
        ...(input.name        !== undefined && { name:         input.name }),
        ...(input.description !== undefined && { description:  input.description }),
        ...(input.price       !== undefined && { price:        input.price }),
        ...(input.isAvailable !== undefined && { is_available: input.isAvailable }),
        ...(input.isPopular   !== undefined && { is_popular:   input.isPopular }),
        ...(input.dailyStock  !== undefined && { daily_stock:  input.dailyStock }),
        ...(input.allergens   !== undefined && { allergens:    input.allergens }),
      },
      include: { options: { include: { values: true } } },
    });
    return this.toMenuItem(record);
  }

  async remove(id: string): Promise<void> {
    await this.prismaClient.menuItem.delete({ where: { id } });
  }

  async updatePhotoUrl(id: string, photoUrl: string): Promise<MenuItem> {
    const record = await this.prismaClient.menuItem.update({
      where:   { id },
      data:    { photo_url: photoUrl },
      include: { options: { include: { values: true } } },
    });
    return this.toMenuItem(record);
  }

  async decrementStock(id: string): Promise<MenuItem> {
    const item = await this.findById(id);
    if (!item) throw new Error("Plat introuvable");
    
    // Si le stock est illimité (null), on ne fait rien
    if (item.dailyStock === null) return item;

    const record = await this.prismaClient.menuItem.update({
      where: { id },
      data: {
        daily_stock: { decrement: 1 },
      },
      include: { options: { include: { values: true } } },
    });

    if (record.daily_stock !== null && record.daily_stock <= 0) {
      return this.update(id, { isAvailable: false, dailyStock: 0 });
    }
    return this.toMenuItem(record);
  }

  async createOption(input: CreateMenuItemOptionInput): Promise<MenuItemOption> {
    const record = await this.prismaClient.menuItemOption.create({
      data: {
        item_id:     input.itemId,
        name:        input.name,
        type:        input.type,
        is_required: input.isRequired,
        values: {
          create: input.values.map((value) => ({
            label:       value.label,
            extra_price: value.extraPrice,
          })),
        },
      },
      include: { values: { orderBy: { extra_price: "asc" } } },
    });

    return {
      id:         record.id,
      itemId:     record.item_id,
      name:       record.name,
      type:       record.type as MenuOptionType,
      isRequired: record.is_required,
      values:     record.values.map((value): MenuOptionValue => ({
        id:         value.id,
        optionId:   value.option_id,
        label:      value.label,
        extraPrice: Number(value.extra_price),
      })),
    };
  }

  async removeOption(optionId: string): Promise<void> {
    await this.prismaClient.menuItemOption.delete({ where: { id: optionId } });
  }

  private toMenuItem(record: {
    id: string; category_id: string; name: string; description: string | null;
    photo_url: string | null; price: unknown; is_available: boolean; is_popular: boolean;
    daily_stock: number | null; allergens: string[];
    options: Array<{
      id: string; item_id: string; name: string; type: string; is_required: boolean;
      values: Array<{ id: string; option_id: string; label: string; extra_price: unknown }>;
    }>;
  }): MenuItem {
    return {
      id:          record.id,
      categoryId:  record.category_id,
      name:        record.name,
      description: record.description,
      photoUrl:    record.photo_url,
      price:       Number(record.price),
      isAvailable: record.is_available,
      isPopular:   record.is_popular,
      dailyStock:  record.daily_stock,
      allergens:   record.allergens,
      options:     (record.options ?? []).map((option) => ({
        id:         option.id,
        itemId:     option.item_id,
        name:       option.name,
        type:       option.type as MenuOptionType,
        isRequired: option.is_required,
        values:     option.values.map((value): MenuOptionValue => ({
          id:         value.id,
          optionId:   value.option_id,
          label:      value.label,
          extraPrice: Number(value.extra_price),
        })),
      })),
    };
  }
}
