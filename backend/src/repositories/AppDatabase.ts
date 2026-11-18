import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

export class AppDatabase {
  private readonly db: Database.Database;

  public constructor(private readonly dbPath: string) {
    if (dbPath !== ':memory:') {
      fs.mkdirSync(path.dirname(path.resolve(dbPath)), { recursive: true });
    }
    this.db = new Database(dbPath);
    this.db.pragma('foreign_keys = ON');
    if (dbPath !== ':memory:') {
      this.db.pragma('journal_mode = WAL');
    }
    this.migrate();
  }

  public get raw(): Database.Database {
    return this.db;
  }

  public transaction<T>(work: () => T): T {
    return this.db.transaction(work)();
  }

  public close(): void {
    this.db.close();
  }

  public migrate(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL,
        customer_tier TEXT,
        business_threshold REAL NOT NULL DEFAULT 200,
        balance REAL NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        sku TEXT NOT NULL UNIQUE,
        price REAL NOT NULL,
        stock INTEGER,
        weight REAL,
        dimensions TEXT,
        download_link TEXT,
        duration_months INTEGER,
        auto_renew INTEGER,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS discounts (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL,
        type TEXT NOT NULL,
        percentage REAL,
        amount REAL,
        active_from TEXT,
        active_to TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        status TEXT NOT NULL,
        delivery_code TEXT NOT NULL,
        payment_snapshot TEXT,
        promo_discount_id TEXT,
        additional_charges REAL NOT NULL DEFAULT 0,
        total_amount REAL NOT NULL,
        breakdown TEXT NOT NULL,
        refunded INTEGER NOT NULL DEFAULT 0,
        is_cart INTEGER NOT NULL DEFAULT 0,
        tracking_number TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        confirmed_at TEXT,
        paid_at TEXT,
        shipped_at TEXT,
        delivered_at TEXT,
        cancelled_at TEXT,
        refunded_at TEXT,
        FOREIGN KEY (customer_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        product_name TEXT NOT NULL,
        unit_price REAL NOT NULL,
        quantity INTEGER NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS carts (
        customer_id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        FOREIGN KEY (customer_id) REFERENCES users(id),
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
      CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
      CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
    `);
  }

  public reset(): void {
    this.db.exec(`
      DROP TABLE IF EXISTS carts;
      DROP TABLE IF EXISTS order_items;
      DROP TABLE IF EXISTS orders;
      DROP TABLE IF EXISTS discounts;
      DROP TABLE IF EXISTS products;
      DROP TABLE IF EXISTS users;
    `);
    this.migrate();
  }
}
