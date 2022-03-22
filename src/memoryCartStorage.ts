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
    this.uuid = uuid;
  }

  updateTransactions(transactions: CartTransaction[]): void {
    this.transactions = [...transactions];
  }

  popTransactions(): CartTransaction[] {
    const txs = this.transactions;
    this.transactions = [];
    return txs;
  }

  getTransactions(): CartTransaction[] {
    return [...this.transactions];
  }
}
