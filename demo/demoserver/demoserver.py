import itertools
import uuid
from collections import defaultdict
import logging

from fastapi import FastAPI, Request, HTTPException
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
        tx_by_productid = defaultdict(list)
        for tx in transactions:
            tx_by_productid[tx.product_id].append(tx)
        for line in self.lines:
            try:
                txs = tx_by_productid.pop(line.product_id)
            except KeyError:
                continue
            for tx in txs:
                if tx.uuid in applied_transactions_uuids:
                    logging.warning(f"Ignoring already applied transaction {tx.uuid}")
                    continue
                line.quantity = max(0, line.quantity + tx.quantity)
                applied_transactions_uuids.add(tx.uuid)
        for tx in itertools.chain(*tx_by_productid.values()):
            if tx.uuid in applied_transactions_uuids:
                logging.warning(f"Ignoring already applied transaction {tx.uuid}")
                continue
            self.lines.append(
                CartLine(product_id=tx.product_id, quantity=max(0, tx.quantity))
            )
            applied_transactions_uuids.add(tx.uuid)


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
    return cart
