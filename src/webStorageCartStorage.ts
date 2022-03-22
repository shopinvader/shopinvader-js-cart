// Copyright (c) ACSONE SA/NV 2022

/* eslint-disable max-classes-per-file */
import { CartStorage } from './cartStorage.js';
import { CartTransaction } from './cartTransaction.js';

const KEY: string = 'shopinvader-js-cart-data';

class Data {
  uuid: string | null = null;

  transactions: CartTransaction[] = [];
}

export class WebStorageCartStorage implements CartStorage {
  private storage: Storage;

  constructor(storage: Storage) {
    this.storage = storage;
  }

  private _get(): Data {
    const data = this.storage.getItem(KEY);
    if (!data) {
      return new Data();
    }
    try {
      const res = JSON.parse(data) as Data;
      res.transactions = res.transactions.map(t => new CartTransaction(t.productId, t.quantity, t.uuid));
      return res;
    } catch (error) {
      // we can't grok what we have in local storage, discard it
      return new Data();
    }
  }

  private _set(data: Data) {
    this.storage.setItem(KEY, JSON.stringify(data));
  }

  getUuid(): string | null {
    return this._get().uuid;
  }

  setUuid(uuid: string | null): void {
    const data = this._get();
    data.uuid = uuid;
    this._set(data);
  }

  updateTransactions(transactions: CartTransaction[]): void {
    const data = this._get();
    data.transactions = [...transactions];
    this._set(data);
  }

  popTransactions(): CartTransaction[] {
    const data = this._get();
    const txs = data.transactions;
    data.transactions = [];
    this._set(data);
    return txs;
  }

  getTransactions(): CartTransaction[] {
    return [...this._get().transactions];
  }
}
