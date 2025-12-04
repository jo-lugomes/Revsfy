// db.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Ajustar caminho do seu banco
const dbPath = path.resolve(__dirname, "steam.db");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Erro ao conectar ao SQLite:", err.message);
  } else {
    console.log("SQLite conectado:", dbPath);
  }
});

module.exports = db;
