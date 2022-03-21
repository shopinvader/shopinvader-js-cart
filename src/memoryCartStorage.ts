// Copyright (c) ACSONE SA/NV 2022

import { CartStorage } from './cartStorage.js';
import { Transaction } from './transaction.js';

export class MemoryCartStorage implements CartStorage {
  private uuid: string | null = null;

  private transactions: Transaction[] = [];

  getUuid(): string | null {
    return this.uuid;
  }

  setUuid(uuid: string | null): void {
    this.uuid = uuid;
  }

  updateTransactions(transactions: Transaction[]): void {
    this.transactions = [...transactions];
  }

  popTransactions(): Transaction[] {
    const txs = this.transactions;
    this.transactions = [];
    return txs;
  }

  getTransactions(): Transaction[] {
    return [...this.transactions];
  }
}
