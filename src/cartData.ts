// Copyright (c) ACSONE SA/NV 2022

import { CartItemData } from './cartItemData.js';
import { Transaction } from './transaction.js';

export class CartData {
  // buffered means there are pending transactions
  public buffered: boolean = false;

  public syncError: boolean = false;

  public items: CartItemData[] = [];

  public erpCart: any;

  static fromErpCart(erpCart: any): CartData {
    const cartData = new this();
    cartData.erpCart = erpCart;
    cartData.items = [];
    if (erpCart) {
      for (const erpCartItem of erpCart.items) {
        cartData.addItem(CartItemData.fromErpCartItem(erpCartItem));
      }
    }
    return cartData;
  }

  addItem(item: CartItemData) {
    this.items.push(item);
  }

  getItem(productId: number): CartItemData | undefined {
    return this.items.find(item => item.productId === productId);
  }

  applyTransactions(transactions: Transaction[]) {
    for (const transaction of transactions) {
      const cartItemData = this.getItem(transaction.productId);
      if (!cartItemData) {
        this.addItem(CartItemData.fromTransaction(transaction));
      } else {
        cartItemData.quantity += transaction.quantity;
        cartItemData.buffered = true;
      }
      this.buffered = true;
    }
    this.items = this.items.filter((item) => item.quantity > 0);
  }
}
