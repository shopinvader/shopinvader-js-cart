import asyncio
import itertools
import json
import logging
import uuid
from enum import Enum
from pathlib import Path

import uvicorn
from fastapi import Depends, FastAPI, HTTPException
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
    qty: int
    uuid: str
    product_id: int


class Sync(BaseModel):
    uuid: str | None
    transactions: list[SyncTransaction]


class CartLine(BaseModel):
    product_id: int
    qty: int


class CartStatus(str, Enum):
    open = "open"
    submitted = "submitted"


class Cart(BaseModel):
    uuid: str
    status: CartStatus = CartStatus.open
    lines: list[CartLine] = []

    def apply_transactions(
        self, transactions: list[SyncTransaction], applied_transactions_uuids: set[str]
    ) -> None:
        logging.info(f"Applying {transactions}")
        for product_id, txs in itertools.groupby(
            transactions, key=lambda tx: tx.product_id
        ):
            for line in self.lines:
                if line.product_id == product_id:
                    break
            else:
                line = CartLine(product_id=product_id, qty=0)
                self.lines.append(line)
            for tx in txs:
                if tx.uuid in applied_transactions_uuids:
                    logging.warn(f"Ignoring already applied transaction {tx.uuid}")
                    continue
                line.qty += tx.qty
                applied_transactions_uuids.add(tx.uuid)
            if line.qty < 0:
                line.qty = 0


class CartNotFound(Exception):
    pass


class CartDatabaseData(BaseModel):
    carts_by_uuid: dict[str, Cart] = {}
    applied_transactions_uuids: set[str] = set()


class CartDatabase:
    def __init__(self):
        try:
            with open(self.data_path) as f:
                data = json.load(f)
                self.data = CartDatabaseData(**data)
        except Exception as e:
            logging.warn(f"Error {e} loading {self.data_path}, creating new database")
            self.data = CartDatabaseData()

    @property
    def data_path(self):
        return Path(__file__).parent / "demoserver.json"

    def save(self):
        with open(self.data_path, "w") as f:
            f.write(self.data.json())

    def create_cart(self) -> Cart:
        cart = Cart(uuid=uuid.uuid4().hex)
        self.data.carts_by_uuid[cart.uuid] = cart
        logging.info(f"Created cart f{cart.uuid}")
        return cart

    def find_open_cart(self, uuid: str) -> Cart:
        try:
            cart = self.data.carts_by_uuid[uuid]
        except KeyError:
            logging.warn(f"Cart {uuid} not found")
            raise CartNotFound()
        else:
            if cart.status != CartStatus.open:
                logging.warn(f"Cart {uuid} is not open")
                raise CartNotFound()
            return cart


cart_db_lock = asyncio.Lock()


async def cart_db() -> CartDatabase:
    async with cart_db_lock:
      db = CartDatabase()
      try:
          yield db
      except:
          raise
      else:
          db.save()


@app.post("/v2/cart/sync", response_model=Cart)
async def sync(data: Sync, cart_db: CartDatabase = Depends(cart_db)) -> Cart:
    if offline:
        raise HTTPException(status_code=503)
    if data.transactions:
        if data.uuid:
            try:
                cart = cart_db.find_open_cart(uuid=data.uuid)
            except CartNotFound:
                cart = cart_db.create_cart()
        else:
            cart = cart_db.create_cart()
    else:
        if data.uuid:
            try:
                cart = cart_db.find_open_cart(uuid=data.uuid)
            except CartNotFound:
                cart = None
        else:
            logging.info(
                "No transactions and no cart uuid provided, "
                "not creating nor updating cart"
            )
            cart = None
    if cart:
        cart.apply_transactions(data.transactions, cart_db.data.applied_transactions_uuids)
        if data.transactions:
            # simulate heavy computation
            await asyncio.sleep(2)
    return cart


if __name__ == "__main__":
    uvicorn.main(["demoserver:app", "--reload", "--port", "8002"])
