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
    const item = cart.getData().getItem(productId);
    expect(item).to.exist;
    expect(item?.hasPendingTransactions).to.be.true;
    expect(item?.quantity).to.equal(1);
    cart.addTransaction(new CartTransaction(productId, 2));
    const item2 = cart.getData().getItem(productId);
    expect(item2?.quantity).to.equal(3);
    cart.addTransaction(new CartTransaction(productId, -3));
    const item3 = cart.getData().getItem(productId);
    expect(item3).to.be.undefined;
  });

  it('test hasPendingTransactions', () => {
    const productId: number = 1000;
    const cart = new Cart(null, new MemoryCartStorage());
    expect(cart.getData().hasPendingTransactions).to.be.false;
    cart.addTransaction(new CartTransaction(productId, 2));
    expect(cart.getData().hasPendingTransactions).to.be.true;
    cart.addTransaction(new CartTransaction(productId, -2));
    expect(cart.hasPendingTransactions()).to.be.false;
    expect(cart.getData().hasPendingTransactions).to.be.false;
  });

  it("test mergeTransactions", () => {
    const transactions1 = [new CartTransaction(1000, 1), new CartTransaction(2000, 3), new CartTransaction(4000, 2)];
    const transactions2 = [new CartTransaction(1000, 5), new CartTransaction(3000, 7), new CartTransaction(4000, -3)];
    const cart = new Cart(null, new MemoryCartStorage());
    const res = cart.mergeTransactions(transactions1, transactions2);
    expect(res.length).to.be.equal(3);
    expect(res[0].productId).to.be.equal(1000);
    expect(res[0].quantity).to.be.equal(6);
    expect(res[1].productId).to.be.equal(2000);
    expect(res[1].quantity).to.be.equal(3);
    expect(res[2].productId).to.be.equal(3000);
    expect(res[2].quantity).to.be.equal(7);
  });
});
