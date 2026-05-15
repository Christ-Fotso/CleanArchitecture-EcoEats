import type { PrismaClient } from "@prisma/client";
import type { IRestaurantRepository, RestaurantStats } from "../../application/ports/IRestaurantRepository.js";
import type { Restaurant, CreateRestaurantInput, UpdateRestaurantProfileInput } from "../../application/restaurant/types.js";
import type { OpeningHoursMap } from "../../domain/value-objects/OpeningHours.js";

const RESTAURANT_SELECT = {
  id:            true,
  owner_id:      true,
  name:          true,
  description:   true,
  logo_url:      true,
  address:       true,
  lat:           true,
  lng:           true,
  opening_hours: true,
  is_active:     true,
  rating_avg:    true,
  cuisine_type:  true,
  prep_time_min: true,
  delivery_fee:  true,
} as const;

export class PrismaRestaurantRepository implements IRestaurantRepository {
  constructor(private readonly prismaClient: PrismaClient) {}

  async findAllActive(): Promise<Restaurant[]> {
    const records = await this.prismaClient.restaurant.findMany({
      where: {
        is_active: true,
        owner: {
          AND: [
            { documents: { some: { type: "kbis", status: "approved" } } },
            { documents: { some: { type: "id_card", status: "approved" } } },
            { documents: { some: { type: "food_hygiene", status: "approved" } } },
          ],
        },
      },
      select:  RESTAURANT_SELECT,
      orderBy: { rating_avg: "desc" },
    });
    return records.map((record) => this.toRestaurant(record));
  }

  async getStats(): Promise<RestaurantStats> {
    const [total, active] = await Promise.all([
      this.prismaClient.restaurant.count(),
      this.prismaClient.restaurant.count({ where: { is_active: true } }),
    ]);
    return { total, active };
  }

  async findAllByOwnerId(ownerId: string): Promise<Restaurant[]> {
    const records = await this.prismaClient.restaurant.findMany({
      where:   { owner_id: ownerId },
      select:  RESTAURANT_SELECT,
      orderBy: { is_active: "desc" },
    });
    return records.map((record) => this.toRestaurant(record));
  }

  async findById(id: string): Promise<Restaurant | null> {
    const record = await this.prismaClient.restaurant.findUnique({
      where: { id }, select: RESTAURANT_SELECT,
    });
    return record ? this.toRestaurant(record) : null;
  }

  async create(input: CreateRestaurantInput): Promise<Restaurant> {
    const record = await this.prismaClient.restaurant.create({
      data: {
        owner_id:      input.ownerId,
        name:          input.name,
        description:   input.description ?? null,
        address:       input.address,
        lat:           input.lat,
        lng:           input.lng,
        cuisine_type:  input.cuisineType,
        prep_time_min: input.prepTimeMin,
        delivery_fee:  input.deliveryFee,
        opening_hours: {},
        is_active:     false,
      },
      select: RESTAURANT_SELECT,
    });
    return this.toRestaurant(record);
  }

  async updateProfile(id: string, input: UpdateRestaurantProfileInput): Promise<Restaurant> {
    const record = await this.prismaClient.restaurant.update({
      where: { id },
      data: {
        ...(input.name        !== undefined && { name:          input.name }),
        ...(input.description !== undefined && { description:   input.description }),
        ...(input.address     !== undefined && { address:       input.address }),
        ...(input.cuisineType !== undefined && { cuisine_type:  input.cuisineType }),
        ...(input.prepTimeMin !== undefined && { prep_time_min: input.prepTimeMin }),
        ...(input.deliveryFee !== undefined && { delivery_fee:  input.deliveryFee }),
      },
      select: RESTAURANT_SELECT,
    });
    return this.toRestaurant(record);
  }

  async updateOpeningHours(id: string, openingHours: OpeningHoursMap): Promise<Restaurant> {
    const record = await this.prismaClient.restaurant.update({
      where:  { id },
      data:   { opening_hours: openingHours },
      select: RESTAURANT_SELECT,
    });
    return this.toRestaurant(record);
  }

  async updateStatus(id: string, isActive: boolean): Promise<Restaurant> {
    const record = await this.prismaClient.restaurant.update({
      where:  { id },
      data:   { is_active: isActive },
      select: RESTAURANT_SELECT,
    });
    return this.toRestaurant(record);
  }

  async updateLogoUrl(id: string, logoUrl: string): Promise<Restaurant> {
    const record = await this.prismaClient.restaurant.update({
      where:  { id },
      data:   { logo_url: logoUrl },
      select: RESTAURANT_SELECT,
    });
    return this.toRestaurant(record);
  }

  private toRestaurant(record: {
    id: string;
    owner_id: string;
    name: string;
    description: string | null;
    logo_url: string | null;
    address: string;
    lat: number;
    lng: number;
    opening_hours: unknown;
    is_active: boolean;
    rating_avg: number | null;
    cuisine_type: string;
    prep_time_min: number;
    delivery_fee: unknown;
  }): Restaurant {
    return {
      id:           record.id,
      ownerId:      record.owner_id,
      name:         record.name,
      description:  record.description,
      logoUrl:      record.logo_url,
      address:      record.address,
      lat:          record.lat,
      lng:          record.lng,
      openingHours: (record.opening_hours as OpeningHoursMap) ?? {},
      isActive:     record.is_active,
      ratingAvg:    record.rating_avg,
      cuisineType:  record.cuisine_type,
      prepTimeMin:  record.prep_time_min,
      deliveryFee:  Number(record.delivery_fee),
    };
  }
}