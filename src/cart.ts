// Copyright (c) ACSONE SA/NV 2022

import { CartData } from './cartData.js';
import { Transaction } from './transaction.js';
import { CartObserver } from './cartObserver.js';
import { CartStorage } from './cartStorage.js';

export class Cart {
  private erpFetch: any;

  private cartStorage: CartStorage;

  private erpCart: any = null;

  // true if last sync failed
  private syncError: boolean = false;

  private observers: CartObserver[] = [];

  constructor(
    erpFetch: any,
    cartStorage: CartStorage,
  ) {
    this.erpFetch = erpFetch;
    this.cartStorage = cartStorage;
  }

  registerObserver(observer: CartObserver) {
    this.observers.push(observer);
  }

  unregisterObserver(observer: CartObserver) {
    const index = this.observers.indexOf(observer);
    if (index !== -1) {
      this.observers.splice(index, 1);
    }
  }

  private notifyCartUpdated() {
    for (const observer of this.observers) {
      observer.onCartUpdated(this);
    }
  }

  addTransaction(transaction: Transaction) {
    this.cartStorage.addTransactions([transaction]);
    this.notifyCartUpdated();
  }

  getData(): CartData {
    const cartData = CartData.fromErpCart(this.erpCart);
    cartData.applyTransactions(this.cartStorage.getTransactions());
    cartData.syncError = this.syncError;
    return cartData;
  }

  async sync(): Promise<boolean> {
    // Clear transactions list before posting, so new transactions can
    // be done by the user while the post occurs asynchronously.
    const txs = this.cartStorage.popTransactions();
    let success: boolean;
    try {
      this.erpCart = await this.erpFetch.post('/cart/v2/sync', {
        cartUuid: this.cartStorage.getUuid(),
        transactions: txs,
      });
      success = true;
      this.syncError = false;
      this.cartStorage.setUuid(this.erpCart?.uuid);
    } catch (error) {
      console.error(error);
      success = false;
      // If Odoo is not available, this is not an error, the cart will simply be
      // buffered.
      this.syncError = true; // TODO (error.status !== 503);
      // In case of error, assume the transactions have not been applied, keep them for
      // an ulterior sync.
      this.cartStorage.addTransactions(txs);
    }
    this.notifyCartUpdated();
    return success;
  }
}
