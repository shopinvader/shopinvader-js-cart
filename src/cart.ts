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

  // true if last sync returned a 503 Service Unavailable
  private erpNotAvailable: boolean = false;

  // true while sync is in progress
  private synchronizing: boolean = false;

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
    this.syncWithRetry();
  }

  hasPendingTransactions(): boolean {
    return this.cartStorage.getTransactions().length > 0;
  }

  clearPendingTransactions() {
    this.cartStorage.setUuid(null);
    this.cartStorage.removeTransactions(this.cartStorage.getTransactions());
  }

  getData(): CartData {
    const cartData = CartData.fromErpCart(this.erpCart);
    cartData.applyTransactions(this.cartStorage.getTransactions());
    cartData.syncError = this.syncError;
    cartData.erpNotAvailable = this.erpNotAvailable;
    return cartData;
  }

  // Call sync while there are pending transactions. Retry with exponential backoff
  // until it succeeds, with a maximum backoff delay of 1 minute.
  private async syncWithRetry(force: boolean = true) {
    const maxBackoff = 60 * 1000;
    let forceSync = force;
    if (this.synchronizing) {
      console.log('Already synchronizing');
      return;
    }
    this.synchronizing = true;
    try {
      let backoff = 1000;
      while (forceSync || this.hasPendingTransactions()) {
        console.log(
          `sync force=${force} pending=${this.hasPendingTransactions()}`
        );
        // eslint-disable-next-line no-await-in-loop
        const success = await this.sync();
        if (success) {
          forceSync = false;
        } else {
          console.log(`sleep ${backoff}`);
          backoff = Math.min(backoff * 2, maxBackoff);
          // eslint-disable-next-line no-await-in-loop, no-loop-func
          await new Promise(resolve => setTimeout(resolve, backoff));
        }
      }
    } finally {
      this.synchronizing = false;
    }
  }

  async sync(): Promise<boolean> {
    // Clear transactions list before posting, so new transactions can
    // be done by the user while the post occurs asynchronously.
    const txs = this.cartStorage.getTransactions();
    let success: boolean;
    try {
      console.log('v2/cart/sync');
      const response = await this.erpFetch.post(
        'v2/cart/sync',
        {
          uuid: this.cartStorage.getUuid(),
          transactions: txs.map(transaction => transaction.toErpTransaction()),
        },
        {},
        'response'
      );
      if (response.ok) {
        this.erpCart = await response.json();
        if (Object.keys(this.erpCart).length === 0) {
          // an empty object means no cart
          this.erpCart = null;
        }
        success = true;
        this.syncError = false;
        this.erpNotAvailable = false;
        this.cartStorage.setUuid(this.erpCart?.uuid);
        this.cartStorage.removeTransactions(txs);
      } else if (response.status === 503) {
        // ERP is not available, this is not an error, the cart will simply stay
        // with pending transactions.
        console.warn('shopinvader cart sync: ERP not available');
        success = false;
        this.syncError = false;
        this.erpNotAvailable = true;
      } else {
        console.warn(`shopinvader cart sync: http ${response.status}}`);
        success = false;
        this.syncError = true;
        this.erpNotAvailable = false;
      }
    } catch (error) {
      console.warn(`shopinvader cart sync: exception ${error}}`);
      success = false;
      this.syncError = true;
      // Yet some exceptions may mean the erp is not available ?
      this.erpNotAvailable = false;
    }
    this.notifyCartUpdated();
    console.log(`sync result: ${success}`);
    return success;
  }
}
