// Copyright (c) ACSONE SA/NV 2022

import { CartTransaction } from './cartTransaction.js';

export class CartLineData {
  public hasPendingTransactions: boolean;

  public productId: number;

  public qty: number;

  public options: any | null = null;

  public erpCartLine: any;

  constructor(
    hasPendingTransactions: boolean,
    productId: number,
    qty: number,
    options?: any,
    erpCartLine?: any
  ) {
    this.hasPendingTransactions = hasPendingTransactions;
    this.productId = productId;
    this.qty = qty;
    this.options = options || null;
    this.erpCartLine = erpCartLine;
  }

  static fromErpCartLine(erpCartLine: any): CartLineData {
    return new this(
      false,
      erpCartLine.product_id,
      erpCartLine.qty,
      erpCartLine.options,
      erpCartLine
    );
  }

  static fromTransaction(transaction: CartTransaction): CartLineData {
    return new this(
      true,
      transaction.productId,
      transaction.qty,
      transaction.options
    );
  }

  applyTransaction(transaction: CartTransaction) {
    this.qty += transaction.qty;
    this.hasPendingTransactions = true;
  }
}
