# shopinvader-js-cart

An asynchronous cart object, that works when the ERP is offline, by storing transactions
that add or remove product quantities from the cart in local storage, and sending them
to the ERP when it becomes offline, using the `/cart/v2/sync` endpoint.

Changes to the cart are notified to consumer (such as UI components) via an observer
parttern.

## Installation

```bash
npm i shopinvader-js-cart
```

## Usage

You first need an `ErpFetch` object from https://github.com/shopinvader/shopinvader-js,
which encapsulate the ERP authentication mechanism.

You then create a cart object:

```typescript
const cart = Cart(
  erpFetch,
  new WebStorageCartStorage(window.localStorage)
);
cart.registerObjserver(observer);
cart.addTransaction(new Transaction(productId, quantity));
cartData = cart.getData();
// cartData.buffered indicates that transactions are pending synchronization
// cartData.syncError indicates that there was an error syncing the cart with the ERP
```

## Linting and formatting

To scan the project for linting and formatting errors, run

```bash
npm run lint
```

To automatically fix linting and formatting errors, run

```bash
npm run format
```

## Testing with Web Test Runner

To execute a single test run:

```bash
npm run test
```

To run the tests in interactive watch mode run:

```bash
npm run test:watch
```


## Tooling configs

For most of the tools, the configuration is in the `package.json` to reduce the amount of files in your project.

If you customize the configuration a lot, you can consider moving them to individual files.

## Local Demo with `web-dev-server`

```bash
npm start
```

To run a local development server that serves the basic demo located in `demo/index.html`

## Authors

* Laurent Mignon <laurent.mignon@acsone.eu>
* Stéphane Bidoul <stephane.bidoul@acsone.eu>
