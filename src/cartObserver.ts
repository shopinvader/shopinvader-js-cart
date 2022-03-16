// Copyright (c) ACSONE SA/NV 2022

import { Cart } from './cart.js';

export interface CartObserver {
  onCartUpdated(cart: Cart): void;
}
