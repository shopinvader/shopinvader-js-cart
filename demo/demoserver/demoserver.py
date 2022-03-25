import asyncio
import itertools
import logging
import uuid

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from rich.logging import RichHandler

FORMAT = "%(message)s"
logging.basicConfig(
    level="NOTSET", format=FORMAT, datefmt="[%X]", handlers=[RichHandler()]
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

offline = False


@app.post("/offline")
async def set_offline():
    global offline
    offline = True


@app.post("/online")
async def set_online():
    global offline
    offline = False


class SyncTransaction(BaseModel):
    quantity: int
    uuid: str
    product_id: int


class Sync(BaseModel):
    uuid: str | None
    transactions: list[SyncTransaction]


class CartLine(BaseModel):
    product_id: int
    quantity: int


class Cart(BaseModel):
    uuid: str
    lines: list[CartLine] = []

    def apply_transactions(
        self, transactions: list[SyncTransaction], applied_transactions_uuids: set[str]
    ) -> None:
        for product_id, txs in itertools.groupby(
            transactions, key=lambda tx: tx.product_id
        ):
            for line in self.lines:
                if line.product_id == product_id:
                    break
            else:
                line = CartLine(product_id=product_id, quantity=0)
                self.lines.append(line)
            for tx in txs:
                if tx.uuid in applied_transactions_uuids:
                    logging.warn(f"Ignoring already applied transaction {tx.uuid}")
                    continue
                line.quantity += tx.quantity
                applied_transactions_uuids.add(tx.uuid)
            if line.quantity < 0:
                line.quantity = 0


class CartDatabase:
    def __init__(self):
        self.carts_by_uuid: dict[str, Cart] = {}
        self.applied_transactions_uuids: set[str] = set()

    def create_cart(self) -> Cart:
        cart = Cart(uuid=uuid.uuid4().hex)
        self.carts_by_uuid[cart.uuid] = cart
        logging.info(f"Created cart f{cart.uuid}")
        return cart

    def find_open_cart(self, uuid: str) -> Cart:
        try:
            return self.carts_by_uuid[uuid]
        except KeyError:
            logging.warn(f"Cart {uuid} not found")
            raise


cart_db = CartDatabase()


@app.post("/v2/cart/sync", response_model=Cart)
async def sync(data: Sync) -> Cart:
    if offline:
        raise HTTPException(status_code=503)
    if data.transactions:
        if data.uuid:
            try:
                cart = cart_db.find_open_cart(uuid=data.uuid)
            except KeyError:
                cart = cart_db.create_cart()
        else:
            cart = cart_db.create_cart()
    else:
        if data.uuid:
            try:
                cart = cart_db.find_open_cart(uuid=data.uuid)
            except KeyError:
                cart = None
        else:
            logging.info(
                "No transactions and no cart uuid provided, "
                "not creating nor updating cart"
            )
            cart = None
    if cart:
        cart.apply_transactions(data.transactions, cart_db.applied_transactions_uuids)
        if data.transactions:
            # simulate heavy computation
            await asyncio.sleep(2)
    return cart


if __name__ == "__main__":
    uvicorn.main(["demoserver:app", "--reload", "--port", "8002"])
