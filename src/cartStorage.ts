// Copyright (c) ACSONE SA/NV 2022

import { CartTransaction } from './cartTransaction.js';

export interface CartStorage {
  getTransactions(): CartTransaction[];
  addTransactions(transactions: CartTransaction[]): void;
  removeTransactions(transactions: CartTransaction[]): void;
  setUuid(uuid: string | null): void;
  getUuid(): string | null;
}
