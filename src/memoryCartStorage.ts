// Copyright (c) ACSONE SA/NV 2022

import { CartStorage } from './cartStorage.js';
import { CartTransaction } from './cartTransaction.js';

export class MemoryCartStorage implements CartStorage {
  private uuid: string | null = null;

  private transactions: CartTransaction[] = [];

  getUuid(): string | null {
    return this.uuid;
  }

  setUuid(uuid: string | null): void {
    if (this.uuid !== uuid) {
      this.transactions = [];
    }
    this.uuid = uuid;
  }

  addTransactions(transactions: CartTransaction[]): void {
    this.transactions.push(...transactions);
  }

  // remove transactions which have the same uuid
  removeTransactions(transactions: CartTransaction[]): void {
    for (const transaction of transactions) {
      const index = this.transactions.findIndex(
        t => t.uuid === transaction.uuid
      );
      if (index !== -1) {
        this.transactions.splice(index, 1);
      }
    }
  }

  getTransactions(): CartTransaction[] {
    return [...this.transactions];
  }
}
