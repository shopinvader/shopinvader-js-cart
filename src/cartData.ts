// Copyright (c) ACSONE SA/NV 2022

import { CartLineData } from './cartLineData.js';
import { CartTransaction } from './cartTransaction.js';

export class CartData {
  public hasPendingTransactions: boolean = false;

  public syncError: boolean = false;

  public lines: CartLineData[] = [];

  public erpCart: any;

  static fromErpCart(erpCart: any): CartData {
    const cartData = new this();
    cartData.erpCart = erpCart;
    cartData.lines = [];
    if (erpCart) {
      for (const erpCartLine of erpCart.lines) {
        cartData.addItem(CartLineData.fromErpCartLine(erpCartLine));
      }
    }
    return cartData;
  }

  addItem(item: CartLineData) {
    this.lines.push(item);
  }

  getItem(productId: number): CartLineData | undefined {
    return this.lines.find(item => item.productId === productId);
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
    // remove lines with quantity <= 0
    this.lines = this.lines.filter(item => item.quantity > 0);
    this.hasPendingTransactions = transactions.length > 0;
  }
}
