// Copyright (c) ACSONE SA/NV 2022

import { v4 as uuidv4 } from 'uuid';

export class CartTransaction {
  public readonly uuid: string;

  public readonly productId: number;

  public qty: number;

  constructor(productId: number, qty: number, uuid?: string) {
    this.productId = productId;
    this.qty = qty || 0;
    this.uuid = uuid || uuidv4();
  }

  isForSameCartLine(other: CartTransaction): boolean {
    return other.productId === this.productId;
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
    };
  }
}
