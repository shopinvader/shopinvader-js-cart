// Copyright (c) ACSONE SA/NV 2022

import { v4 as uuidv4 } from 'uuid';
import { isEqual } from './utils.js';

export class CartTransaction {
  public readonly uuid: string;

  public readonly productId: number;

  public qty: number;

  public options: any | null = null;

  constructor(
    productId: number,
    qty: number,
    uuid?: string | null,
    options?: any
  ) {
    this.productId = productId;
    this.qty = qty || 0;
    this.uuid = uuid || uuidv4();
    this.options = options || null;
  }

  isForSameCartLine(other: CartTransaction): boolean {
    return (
      other.productId === this.productId &&
      isEqual(other?.options || null, this.options)
    );
  }

  merge(other: CartTransaction): boolean {
    if (!this.isForSameCartLine(other)) {
      return false;
    }
    this.qty += other.qty;
    return true;
  }

  /* Convert to a JSON object suitable to send to the ERP */
  toErpTransaction(): any {
    return {
      uuid: this.uuid,
      product_id: this.productId,
      qty: this.qty,
      options: this.options,
    };
  }
}
