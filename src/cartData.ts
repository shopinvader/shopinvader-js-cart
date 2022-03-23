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
        cartData.addLine(CartLineData.fromErpCartLine(erpCartLine));
      }
    }
    return cartData;
  }

  addLine(line: CartLineData) {
    this.lines.push(line);
  }

  getLine(productId: number): CartLineData | undefined {
    return this.lines.find(line => line.productId === productId);
  }

  applyTransactions(transactions: CartTransaction[]) {
    for (const transaction of transactions) {
      const cartLineData = this.getLine(transaction.productId);
      if (!cartLineData) {
        this.addLine(CartLineData.fromTransaction(transaction));
      } else {
        cartLineData.applyTransaction(transaction);
      }
    }
    // Remove lines with quantity = 0. We keep lines with a negative quantity
    // as they signify we are in a situation where the local view of the cart
    // is seriously desynchronized with the ERP but this shows the user a
    // negative transaction is going to be applied.
    this.lines = this.lines.filter(line => line.quantity !== 0);
    this.hasPendingTransactions = transactions.length > 0;
  }
}
