import { DomainError } from "../errors/DomainError.js";

export class NegativeAmountError extends DomainError {
  readonly code = "NEGATIVE_AMOUNT";
  constructor() { super("Un montant monétaire ne peut pas être négatif."); }
}

/** Montant stocké en centimes (entier) pour éviter les erreurs d'arrondi. */
export class Money {
  private constructor(readonly cents: number) {}

  static fromCents(cents: number): Money {
    if (cents < 0) throw new NegativeAmountError();
    return new Money(Math.round(cents));
  }

  static fromEuros(euros: number): Money {
    return Money.fromCents(Math.round(euros * 100));
  }

  static zero(): Money {
    return new Money(0);
  }

  add(other: Money): Money {
    return new Money(this.cents + other.cents);
  }

  multiply(factor: number): Money {
    return new Money(Math.round(this.cents * factor));
  }

  isGreaterThan(other: Money): boolean {
    return this.cents > other.cents;
  }

  isLessThan(other: Money): boolean {
    return this.cents < other.cents;
  }

  isGreaterThanOrEqual(other: Money): boolean {
    return this.cents >= other.cents;
  }

  isLessThanOrEqual(other: Money): boolean {
    return this.cents <= other.cents;
  }

  toEuros(): number {
    return this.cents / 100;
  }

  toString(): string {
    return `${this.toEuros().toFixed(2)} €`;
  }
}
