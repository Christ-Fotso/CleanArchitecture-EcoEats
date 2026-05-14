import type { PrismaClient } from "@prisma/client";
import type { IMenuCategoryRepository } from "../../application/ports/IMenuCategoryRepository.js";
import type {
  MenuCategory,
  MenuItem,
  MenuItemOption,
  MenuOptionValue,
  CreateMenuCategoryInput,
  UpdateMenuCategoryInput,
  MenuAvailability,
  MenuOptionType,
} from "../../application/menu/types.js";

export class PrismaMenuCategoryRepository implements IMenuCategoryRepository {
  constructor(private readonly prismaClient: PrismaClient) {}

  async findAllByRestaurantId(restaurantId: string): Promise<MenuCategory[]> {
    const records = await this.prismaClient.menuCategory.findMany({
      where:   { restaurant_id: restaurantId },
      orderBy: { position: "asc" },
      include: {
        menu_items: {
          orderBy: { name: "asc" },
          include: {
            options: {
              include: { values: { orderBy: { extra_price: "asc" } } },
            },
          },
        },
      },
    });
    return records.map((record) => this.toMenuCategory(record));
  }

  async findById(id: string): Promise<MenuCategory | null> {
    const record = await this.prismaClient.menuCategory.findUnique({
      where:   { id },
      include: { menu_items: { include: { options: { include: { values: true } } } } },
    });
    return record ? this.toMenuCategory(record) : null;
  }

  async create(input: CreateMenuCategoryInput): Promise<MenuCategory> {
    const maxPosition = await this.prismaClient.menuCategory.count({
      where: { restaurant_id: input.restaurantId },
    });
    const record = await this.prismaClient.menuCategory.create({
      data: {
        restaurant_id: input.restaurantId,
        name:          input.name,
        availability:  input.availability,
        position:      maxPosition,
      },
      include: { menu_items: { include: { options: { include: { values: true } } } } },
    });
    return this.toMenuCategory(record);
  }

  async update(id: string, input: UpdateMenuCategoryInput): Promise<MenuCategory> {
    const record = await this.prismaClient.menuCategory.update({
      where: { id },
      data: {
        ...(input.name         !== undefined && { name:         input.name }),
        ...(input.availability !== undefined && { availability: input.availability }),
        ...(input.position     !== undefined && { position:     input.position }),
      },
      include: { menu_items: { include: { options: { include: { values: true } } } } },
    });
    return this.toMenuCategory(record);
  }

  async remove(id: string): Promise<void> {
    await this.prismaClient.menuCategory.delete({ where: { id } });
  }

  async reorder(restaurantId: string, orderedIds: string[]): Promise<void> {
    await this.prismaClient.$transaction(
      orderedIds.map((id, index) =>
        this.prismaClient.menuCategory.update({
          where: { id, restaurant_id: restaurantId },
          data:  { position: index },
        }),
      ),
    );
  }

  private toMenuCategory(record: {
    id: string; restaurant_id: string; name: string; position: number; availability: string;
    menu_items: Array<{
      id: string; category_id: string; name: string; description: string | null;
      photo_url: string | null; price: unknown; is_available: boolean; is_popular: boolean;
      daily_stock: number | null;
      options: Array<{
        id: string; item_id: string; name: string; type: string; is_required: boolean;
        values: Array<{ id: string; option_id: string; label: string; extra_price: unknown }>;
      }>;
    }>;
  }): MenuCategory {
    return {
      id:           record.id,
      restaurantId: record.restaurant_id,
      name:         record.name,
      position:     record.position,
      availability: record.availability as MenuAvailability,
      items:        record.menu_items.map((item) => this.toMenuItem(item)),
    };
  }

  private toMenuItem(item: {
    id: string; category_id: string; name: string; description: string | null;
    photo_url: string | null; price: unknown; is_available: boolean; is_popular: boolean;
    daily_stock: number | null;
    options: Array<{
      id: string; item_id: string; name: string; type: string; is_required: boolean;
      values: Array<{ id: string; option_id: string; label: string; extra_price: unknown }>;
    }>;
  }): MenuItem {
    return {
      id:          item.id,
      categoryId:  item.category_id,
      name:        item.name,
      description: item.description,
      photoUrl:    item.photo_url,
      price:       Number(item.price),
      isAvailable: item.is_available,
      isPopular:   item.is_popular,
      dailyStock:  item.daily_stock,
      options:     item.options.map((option) => this.toOption(option)),
    };
  }

  private toOption(option: {
    id: string; item_id: string; name: string; type: string; is_required: boolean;
    values: Array<{ id: string; option_id: string; label: string; extra_price: unknown }>;
  }): MenuItemOption {
    return {
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
    };
  }
}
