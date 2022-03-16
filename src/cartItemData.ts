// Copyright (c) ACSONE SA/NV 2022

import { Transaction } from './transaction.js';

export class CartItemData {
  public hasPendingTransactions: boolean;

  public productId: number;

  public quantity: number;

  public erpCartItem: any;

  constructor(
    hasPendingTransactions: boolean,
    productId: number,
    quantity: number,
    erpCartItem?: any
  ) {
    this.hasPendingTransactions = hasPendingTransactions;
    this.productId = productId;
    this.quantity = quantity;
    this.erpCartItem = erpCartItem;
  }

  static fromErpCartItem(erpCartItem: any): CartItemData {
    return new this(
      false,
      erpCartItem.product_id,
      erpCartItem.quantity,
      erpCartItem
    );
  }

  static fromTransaction(transaction: Transaction): CartItemData {
    return new this(true, transaction.productId, transaction.quantity);
  }

  applyTransaction(transaction: Transaction) {
    this.quantity += transaction.quantity;
    this.hasPendingTransactions = true;
  }
}
