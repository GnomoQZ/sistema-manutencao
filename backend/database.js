import sqlite3 from "sqlite3";

const db = new sqlite3.Database("./historico.db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS atendimentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data TEXT,
      modelo TEXT,
      serie TEXT,
      defeito TEXT,
      diagnostico TEXT,
      sugestao TEXT,
      pecas TEXT
    )
  `);
});

export default db;