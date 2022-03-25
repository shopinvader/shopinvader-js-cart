# shopinvader-js-cart

An asynchronous cart object, that works when the ERP is offline, by storing transactions
that add or remove product quantities from the cart in local storage, and sending them
to the ERP when it becomes offline, using the `/cart/v2/sync` endpoint.

Changes to the cart are notified to consumer (such as UI components) via an observer
parttern.

/!\ this is WIP - TODO:

- add some basic ERP fields to `CartData` and `CartLineData`, such as prices, etc
- add factories so `CartData` and `CartLineData` are extensible (so front end devs
  can add methods such as price calculations and such)
- error handling in sync() (wating for ErpFetch to rais errors)
- background sync (with exponential retry delay in case of error)
- actually test this with the backend
- check that the cart uuid we have in local storage matches the cart uuid we got from
  the erp, to avoid applying transactions on the wrong cart in the client - I think we
  should discard the local storage if the cart uuid differs from the one we got from the
  erp

## Installation

```bash
npm i shopinvader-js-cart
```

## Usage

You first need an `ErpFetch` object from
[shopinvader-js](https://github.com/shopinvader/shopinvader-js), which encapsulate the
ERP authentication mechanism.

You then create a cart object:

```typescript
const cart = Cart(
  erpFetch,
  new WebStorageCartStorage(window.localStorage)
);
cart.registerObjserver(observer);
cart.addTransaction(new CartTransaction(productId, quantity));
cartData = cart.getData();
// cartData.hasPendingTransactions indicates that transactions are pending synchronization
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

This works best when the demo backend server is running. To do this:

```bash
cd demo
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install requirements.txt.in
python3 demoserver.py
```

## Authors

- Laurent Mignon <laurent.mignon@acsone.eu>
- Stéphane Bidoul <stephane.bidoul@acsone.eu>
