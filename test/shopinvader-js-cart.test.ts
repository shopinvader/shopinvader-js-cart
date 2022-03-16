// Copyright (c) ACSONE SA/NV 2022

import { expect } from '@open-wc/testing';
import { Cart } from '../src/index.js';
import { MemoryCartStorage } from '../src/memoryCartStorage.js';
import { Transaction } from '../src/transaction.js';

describe('ShopinvaderJsCart', () => {
  it('test transaction', () => {
    const productId: number = 1000;
    const cart = new Cart(null, new MemoryCartStorage());
    cart.addTransaction(new Transaction(productId, 1));
    const item = cart.getData().getItem(productId);
    expect(item).to.exist;
    expect(item?.hasPendingTransactions).to.be.true;
    expect(item?.quantity).to.equal(1);
    cart.addTransaction(new Transaction(productId, 2));
    const item2 = cart.getData().getItem(productId);
    expect(item2?.quantity).to.equal(3);
    cart.addTransaction(new Transaction(productId, -3));
    const item3 = cart.getData().getItem(productId);
    expect(item3).to.be.undefined;
  });

  it('test hasPendingTransactions', () => {
    const productId: number = 1000;
    const cart = new Cart(null, new MemoryCartStorage());
    expect(cart.getData().hasPendingTransactions).to.be.false;
    cart.addTransaction(new Transaction(productId, 2));
    expect(cart.getData().hasPendingTransactions).to.be.true;
    cart.addTransaction(new Transaction(productId, -2));
    expect(cart.hasPendingTransactions()).to.be.false;
    expect(cart.getData().hasPendingTransactions).to.be.false;
  });
});
