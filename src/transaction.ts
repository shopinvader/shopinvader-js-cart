// Copyright (c) ACSONE SA/NV 2022

import { v4 as uuidv4 } from 'uuid';

export class Transaction {
  public readonly uuid: string;

  public readonly productId: number;

  public readonly quantity: number;

  constructor(productId: number, quantity: number) {
    this.productId = productId;
    this.quantity = quantity;
    this.uuid = uuidv4();
  }

  /* Convert to a JSON object suitable to send to the ERP */
  toErpTransaction(): any {
    return {
      uuid: this.uuid,
      product_id: this.productId,
      quantity: this.quantity,
    }
  }
}
