import type { PrismaClient } from "@prisma/client";
import pkg from "@prisma/client"; const { AuthProvider, Role } = pkg;
import type { IUserRepository, CreateUserInput, UpdateUserInput, UserCredentials, UserRoleStats } from "../../application/ports/IUserRepository.js";
import type { User } from "../../application/auth/types.js";

const USER_SELECT = {
  id:                 true,
  name:               true,
  email:              true,
  phone:              true,
  role:               true,
  photo_url:          true,
  created_at:         true,
  preferences:        true,
  allergies:          true,
  stripe_customer_id: true,
} as const;

export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prismaClient: PrismaClient) {}

  async getStatsByRole(): Promise<UserRoleStats> {
    const groups = await this.prismaClient.user.groupBy({
      by:     ["role"],
      _count: { role: true },
    });
    const map = Object.fromEntries(groups.map((group) => [group.role, group._count.role]));
    return {
      total:            Object.values(map).reduce((sum, count) => sum + count, 0),
      clients:          map["CLIENT"]           ?? 0,
      restaurantOwners: map["RESTAURANT_OWNER"] ?? 0,
      drivers:          map["DRIVER"]           ?? 0,
    };
  }

  async findById(id: string): Promise<User | null> {
    return this.prismaClient.user.findUnique({ where: { id }, select: USER_SELECT }) as Promise<User | null>;
  }

  async findByEmail(email: string): Promise<Pick<User, "id"> | null> {
    return this.prismaClient.user.findUnique({ where: { email }, select: { id: true } });
  }

  async findByPhone(phone: string): Promise<Pick<User, "id"> | null> {
    return this.prismaClient.user.findFirst({ where: { phone }, select: { id: true } });
  }

  async findCredentialsByEmail(email: string): Promise<UserCredentials | null> {
    const identity = await this.prismaClient.authIdentity.findUnique({
      where: {
        provider_provider_user_id: {
          provider: AuthProvider.password,
          provider_user_id: email,
        },
      },
      include: { user: { select: USER_SELECT } },
    });

    if (!identity?.password_hash) return null;
    return { user: identity.user as User, passwordHash: identity.password_hash };
  }

  async create(input: CreateUserInput): Promise<User> {
    const baseData = {
      name: input.name,
      email: input.email,
      phone: input.phone,
      phone_verified: false,
      role: input.role as Role,
      auth_identities: {
        create: {
          provider: AuthProvider.password,
          provider_user_id: input.email,
          password_hash: input.passwordHash,
        },
      },
    };

    if (input.role === "RESTAURANT_OWNER" && input.restaurantProfile) {
      const { restaurantName, restaurantAddress, cuisineType } = input.restaurantProfile;
      return this.prismaClient.user.create({
        data: {
          ...baseData,
          restaurants: {
            create: {
              name: restaurantName,
              address: restaurantAddress,
              cuisine_type: cuisineType,
              is_active: false,
              opening_hours: {},
              lat: 0,
              lng: 0,
              delivery_fee: 0,
              prep_time_min: 30,
            },
          },
        },
        select: USER_SELECT,
      }) as Promise<User>;
    }

    if (input.role === "DRIVER" && input.driverProfile) {
      return this.prismaClient.user.create({
        data: {
          ...baseData,
          driver_profile: {
            create: {
              name: input.name,
              email: input.email,
              phone: input.phone,
              transport_type: input.driverProfile.transportType,
              is_online: false,
              is_verified: false,
              lat: 0,
              lng: 0,
            },
          },
        },
        select: USER_SELECT,
      }) as Promise<User>;
    }

    return this.prismaClient.user.create({ data: baseData, select: USER_SELECT }) as Promise<User>;
  }

  async update(id: string, input: UpdateUserInput): Promise<User> {
    return this.prismaClient.user.update({
      where: { id },
      data: input,
      select: USER_SELECT,
    }) as Promise<User>;
  }
}
