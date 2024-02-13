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
      res.transactions = res.transactions.map(
        t => new CartTransaction(t.productId, t.qty, t.uuid, t?.options || {})
      );
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
    if (data.uuid && data.uuid !== uuid) {
      // Make sure to empty the local cart storage when the uuid change. This can
      // happen e.g., when a new cart has been created in the backend for the user or
      // when the user has logged out and logs in with another identity.
      data.transactions = [];
    }
    data.uuid = uuid;
    this._set(data);
  }

  addTransactions(transactions: CartTransaction[]): void {
    const data = this._get();
    data.transactions.push(...transactions);
    this._set(data);
  }

  // remove transactions which have the same uuid
  removeTransactions(transactions: CartTransaction[]): void {
    const data = this._get();
    for (const transaction of transactions) {
      const index = data.transactions.findIndex(
        t => t.uuid === transaction.uuid
      );
      if (index !== -1) {
        data.transactions.splice(index, 1);
      }
    }
    this._set(data);
  }

  getTransactions(): CartTransaction[] {
    return [...this._get().transactions];
  }
}
