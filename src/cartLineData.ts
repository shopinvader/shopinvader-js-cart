// Copyright (c) ACSONE SA/NV 2022

import { CartTransaction } from './cartTransaction.js';

export class CartLineData {
  public hasPendingTransactions: boolean;

  public productId: number;

  public quantity: number;

  public erpCartLine: any;

  constructor(
    hasPendingTransactions: boolean,
    productId: number,
    quantity: number,
    erpCartLine?: any
  ) {
    this.hasPendingTransactions = hasPendingTransactions;
    this.productId = productId;
    this.quantity = quantity;
    this.erpCartLine = erpCartLine;
  }

  static fromErpCartLine(erpCartLine: any): CartLineData {
    return new this(
      false,
      erpCartLine.product_id,
      erpCartLine.qty,
      erpCartLine
    );
  }

  static fromTransaction(transaction: CartTransaction): CartLineData {
    return new this(true, transaction.productId, transaction.quantity);
  }

  applyTransaction(transaction: CartTransaction) {
    this.quantity += transaction.quantity;
    this.hasPendingTransactions = true;
  }
}
