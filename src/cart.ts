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

  addTransaction(transaction: Transaction) {
    this.cartStorage.updateTransactions(
      this.mergeTransactions(this.cartStorage.getTransactions(), [transaction])
    );
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

  /**
   * Merge transactions of list transactions2 into transactions1. Return the list of
   * transactions in transactions1, possibly modified with mergeable transactions in
   * transactions2. Also return transactions of transactions2 that could not be merged
   * in transactions1.
   * @param transactions1
   * @param transactions2
   */
  // eslint-disable-next-line class-methods-use-this
  mergeTransactions(
    transactions1: Transaction[], transactions2: Transaction[]
  ): Transaction[] {
    const res = [...transactions1];
    for (const transaction2 of transactions2) {
      let merged = false;
      for (const transaction1 of transactions1) {
        if (transaction1.merge(transaction2)) {
          merged = true;
          break;
        }
      }
      if (!merged) {
        res.push(transaction2);
      }
    }
    return res.filter(item => item.quantity > 0);
  }

  async sync(): Promise<boolean> {
    // Clear transactions list before posting, so new transactions can
    // be done by the user while the post occurs asynchronously.
    const txs = this.cartStorage.popTransactions();
    let success: boolean;
    try {
      this.erpCart = await this.erpFetch.post('/cart/v2/sync', {
        cart_uuid: this.cartStorage.getUuid(),
        transactions: txs.map(transaction => transaction.toErpTransaction()),
      });
      success = true;
      this.syncError = false;
      this.cartStorage.setUuid(this.erpCart?.uuid);
    } catch (error) {
      console.error(error);
      success = false;
      // If Odoo is not available, this is not an error, the cart will simply stay
      // with pending transactions.
      this.syncError = true; // TODO (error.status !== 503);
      // In case of error, assume the transactions have not been applied, keep them for
      // an ulterior sync.
      this.cartStorage.updateTransactions(
        this.mergeTransactions(txs, this.cartStorage.getTransactions())
      );
    }
    this.notifyCartUpdated();
    return success;
  }
}
