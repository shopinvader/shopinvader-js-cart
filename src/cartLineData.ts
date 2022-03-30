// Copyright (c) ACSONE SA/NV 2022

import { CartTransaction } from './cartTransaction.js';

export class CartLineData {
  public hasPendingTransactions: boolean;

  public productId: number;

  public qty: number;

  public erpCartLine: any;

  constructor(
    hasPendingTransactions: boolean,
    productId: number,
    qty: number,
    erpCartLine?: any
  ) {
    this.hasPendingTransactions = hasPendingTransactions;
    this.productId = productId;
    this.qty = qty;
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
    return new this(true, transaction.productId, transaction.qty);
  }

  applyTransaction(transaction: CartTransaction) {
    this.qty += transaction.qty;
    this.hasPendingTransactions = true;
  }
}
