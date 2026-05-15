import type { PrismaClient } from "@prisma/client";
import pkg from "@prisma/client"; const { PaymentType } = pkg;
import type { IPaymentMethodRepository } from "../../application/ports/IPaymentMethodRepository.js";
import type { SavedPaymentMethod, CreatePaymentMethodInput, PaymentMethodType } from "../../application/payment/types.js";

const PAYMENT_METHOD_SELECT = {
  id:           true,
  user_id:      true,
  stripe_token: true,
  type:         true,
  label:        true,
  last4:        true,
  brand:        true,
  expiry_month: true,
  expiry_year:  true,
  is_default:   true,
  created_at:   true,
} as const;

export class PrismaPaymentMethodRepository implements IPaymentMethodRepository {
  constructor(private readonly prismaClient: PrismaClient) {}

  async findAllByUserId(userId: string): Promise<SavedPaymentMethod[]> {
    const records = await this.prismaClient.paymentMethod.findMany({
      where:   { user_id: userId },
      select:  PAYMENT_METHOD_SELECT,
      orderBy: [{ is_default: "desc" }, { created_at: "asc" }],
    });
    return records.map((record) => this.toSavedPaymentMethod(record));
  }

  async findById(id: string): Promise<SavedPaymentMethod | null> {
    const record = await this.prismaClient.paymentMethod.findUnique({
      where: { id }, select: PAYMENT_METHOD_SELECT,
    });
    return record ? this.toSavedPaymentMethod(record) : null;
  }

  async findByStripePaymentMethodId(stripePaymentMethodId: string): Promise<SavedPaymentMethod | null> {
    const record = await this.prismaClient.paymentMethod.findFirst({
      where: { stripe_token: stripePaymentMethodId }, select: PAYMENT_METHOD_SELECT,
    });
    return record ? this.toSavedPaymentMethod(record) : null;
  }

  async countByUserId(userId: string): Promise<number> {
    return this.prismaClient.paymentMethod.count({ where: { user_id: userId } });
  }

  async save(input: CreatePaymentMethodInput): Promise<SavedPaymentMethod> {
    const record = await this.prismaClient.paymentMethod.create({
      data: {
        user_id:      input.userId,
        stripe_token: input.stripePaymentMethodId,
        type:         this.toPrismaPaymentType(input.type),
        label:        `${input.brand} •••• ${input.last4}`,
        last4:        input.last4,
        brand:        input.brand,
        expiry_month: input.expiryMonth,
        expiry_year:  input.expiryYear,
        is_default:   input.isDefault,
      },
      select: PAYMENT_METHOD_SELECT,
    });
    return this.toSavedPaymentMethod(record);
  }

  async remove(id: string): Promise<void> {
    await this.prismaClient.paymentMethod.delete({ where: { id } });
  }

  async setDefault(userId: string, paymentMethodId: string): Promise<SavedPaymentMethod> {
    const [, updated] = await this.prismaClient.$transaction([
      this.prismaClient.paymentMethod.updateMany({
        where: { user_id: userId },
        data:  { is_default: false },
      }),
      this.prismaClient.paymentMethod.update({
        where:  { id: paymentMethodId },
        data:   { is_default: true },
        select: PAYMENT_METHOD_SELECT,
      }),
    ]);
    return this.toSavedPaymentMethod(updated);
  }

  private toSavedPaymentMethod(record: {
    id: string;
    user_id: string;
    stripe_token: string | null;
    type: string;
    label: string;
    last4: string;
    brand: string;
    expiry_month: number;
    expiry_year:  number;
    is_default: boolean;
    created_at: Date;
  }): SavedPaymentMethod {
    return {
      id:                    record.id,
      userId:                record.user_id,
      stripePaymentMethodId: record.stripe_token ?? "",
      type:                  this.toDomainPaymentMethodType(record.type),
      brand:                 record.brand,
      last4:                 record.last4,
      expiryMonth:           record.expiry_month,
      expiryYear:            record.expiry_year,
      isDefault:             record.is_default,
      createdAt:             record.created_at,
    };
  }

  // Isolation infrastructure : empêche les valeurs Prisma de fuir dans le domaine
  private toPrismaPaymentType(type: PaymentMethodType): PaymentType {
    const mapping: Record<PaymentMethodType, PaymentType> = {
      card:   PaymentType.cb,
      paypal: PaymentType.paypal,
    };
    return mapping[type];
  }

  private toDomainPaymentMethodType(prismaType: string): PaymentMethodType {
    const mapping: Record<string, PaymentMethodType> = {
      [PaymentType.cb]:     "card",
      [PaymentType.paypal]: "paypal",
      [PaymentType.apple]:  "card",
      [PaymentType.google]: "card",
    };
    return mapping[prismaType] ?? "card";
  }
}