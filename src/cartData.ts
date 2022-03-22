// Copyright (c) ACSONE SA/NV 2022

import { CartLineData } from './cartLineData.js';
import { CartTransaction } from './cartTransaction.js';

export class CartData {
  public hasPendingTransactions: boolean = false;

  public syncError: boolean = false;

  public items: CartLineData[] = [];

  public erpCart: any;

  static fromErpCart(erpCart: any): CartData {
    const cartData = new this();
    cartData.erpCart = erpCart;
    cartData.items = [];
    if (erpCart) {
      for (const erpCartLine of erpCart.items) {
        cartData.addItem(CartLineData.fromErpCartLine(erpCartLine));
      }
    }
    return cartData;
  }

  addItem(item: CartLineData) {
    this.items.push(item);
  }

  getItem(productId: number): CartLineData | undefined {
    return this.items.find(item => item.productId === productId);
  }

  applyTransactions(transactions: CartTransaction[]) {
    for (const transaction of transactions) {
      const cartLineData = this.getItem(transaction.productId);
      if (!cartLineData) {
        this.addItem(CartLineData.fromTransaction(transaction));
      } else {
        cartLineData.applyTransaction(transaction);
      }
    }
    // remove items with quantity <= 0
    this.items = this.items.filter(item => item.quantity > 0);
    this.hasPendingTransactions = transactions.length > 0;
  }
}
