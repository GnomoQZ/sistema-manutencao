import Database from "better-sqlite3";

const db = new Database("dados.db");

// cria tabela se não existir
db.prepare(`
  CREATE TABLE IF NOT EXISTS atendimentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data TEXT,
    modelo TEXT,
    serie TEXT,
    defeito TEXT,
    diagnostico TEXT,
    sugestao TEXT
  )
`).run();

export default db;
