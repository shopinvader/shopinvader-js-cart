// Copyright (c) ACSONE SA/NV 2022

import { CartData } from './cartData.js';
import { CartTransaction } from './cartTransaction.js';
import { CartObserver } from './cartObserver.js';
import { CartStorage } from './cartStorage.js';

export class Cart {
  private erpFetch: any;

  private cartStorage: CartStorage;

  private erpCart: any = null;

  // true if last sync failed
  private syncError: boolean = false;

  private observers: CartObserver[] = [];

  constructor(erpFetch: any, cartStorage: CartStorage) {
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

  addTransaction(transaction: CartTransaction) {
    this.cartStorage.addTransactions([transaction]);
    this.notifyCartUpdated();
  }

  hasPendingTransactions(): boolean {
    return this.cartStorage.getTransactions().length > 0;
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
      const response = await this.erpFetch.post(
        '/v2/cart/sync',
        {
          uuid: this.cartStorage.getUuid(),
          transactions: txs.map(transaction => transaction.toErpTransaction()),
        },
        {},
        'response'
      );
      if (response.ok) {
        this.erpCart = await response.json();
        success = true;
        this.syncError = false;
        // TODO do we need to check the UUID ?
        this.cartStorage.setUuid(this.erpCart?.uuid);
      } else if (response.status === 503) {
        // ERP is not available, this is not an error, the cart will simply stay
        // with pending transactions.
        console.warn('shopinvader cart sync: ERP not available');
        success = false;
        this.syncError = false;
      } else {
        console.warn(`shopinvader cart sync: http ${response.status}}`);
        success = false;
        this.syncError = true;
      }
    } catch (error) {
      console.warn(`shopinvader cart sync: exception ${error}}`);
      success = false;
      this.syncError = true;
    }
    if (!success) {
      // In case of error, assume the transactions have not been applied, keep them for
      // an ulterior sync.
      this.cartStorage.addTransactions(txs);
    }
    this.notifyCartUpdated();
    return success;
  }
}
