// Copyright (c) ACSONE SA/NV 2022

import { expect } from '@open-wc/testing';
import { Cart } from '../src/index.js';
import { MemoryCartStorage } from '../src/memoryCartStorage.js';
import { CartTransaction } from '../src/cartTransaction.js';

describe('ShopinvaderJsCart', () => {
  it('test transaction', () => {
    const productId: number = 1000;
    const cart = new Cart(null, new MemoryCartStorage());
    cart.addTransaction(new CartTransaction(productId, 1));
    const line = cart.getData().getLine(productId);
    expect(line).to.exist;
    expect(line?.hasPendingTransactions).to.be.true;
    expect(line?.qty).to.equal(1);
    cart.addTransaction(new CartTransaction(productId, 2));
    const line2 = cart.getData().getLine(productId);
    expect(line2?.qty).to.equal(3);
    cart.addTransaction(new CartTransaction(productId, -3));
    const line3 = cart.getData().getLine(productId);
    expect(line3).to.be.undefined;
  });

  it('test no 0 qty', () => {
    const productId: number = 1000;
    const cart = new Cart(null, new MemoryCartStorage());
    cart.addTransaction(new CartTransaction(productId, 1));
    const line = cart.getData().getLine(productId);
    expect(line).to.exist;
    expect(line?.hasPendingTransactions).to.be.true;
    expect(line?.qty).to.equal(1);
    cart.addTransaction(new CartTransaction(productId, -1));
    const line3 = cart.getData().getLine(productId);
    expect(line3).to.be.undefined;
  });

  it('test hasPendingTransactions', () => {
    const productId: number = 1000;
    const cart = new Cart(null, new MemoryCartStorage());
    expect(cart.getData().hasPendingTransactions).to.be.false;
    cart.addTransaction(new CartTransaction(productId, 2));
    expect(cart.getData().hasPendingTransactions).to.be.true;
    cart.addTransaction(new CartTransaction(productId, -2));
  });
});
