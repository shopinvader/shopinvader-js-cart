// Copyright (c) ACSONE SA/NV 2022

import { Transaction } from './transaction.js';

export interface CartStorage {
  getTransactions(): Transaction[];
  addTransactions(transactions: Transaction[]): void;
  popTransactions(): Transaction[];
  setUuid(uuid: string | null): void;
  getUuid(): string | null;
}
