import express from "express";
import sqlite3 from "sqlite3";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import fs from "fs"; // Módulo nativo para manipular arquivos
import { exec } from "child_process"; // Módulo nativo para executar comandos (o programa em C)

// Configuração para __dirname em ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// --- CONFIGURAÇÃO DO BANCO DE DADOS (SQLITE) ---
// O arquivo database.db deve estar na mesma pasta deste server.js
const dbPath = path.join(__dirname, "database.db");

const sqlite = sqlite3.verbose();
const db = new sqlite.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ Erro ao conectar no SQLite:", err.message);
  } else {
    console.log("✔ Banco SQLite conectado em:", dbPath);

    // Verifica se a tabela 'jogos' existe (apenas para debug)
    db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
      if (err) {
        console.error("Erro ao ler tabelas:", err);
      } else {
        const nomesTabelas = tables.map((t) => t.name);
        console.log("📂 Tabelas encontradas no banco:", nomesTabelas);

        if (!nomesTabelas.includes("jogos")) {
          console.warn("⚠️ ALERTA: A tabela 'jogos' não foi encontrada. O código C pode falhar se ela não existir.");
        } else {
          console.log("✅ Tabela 'jogos' detectada com sucesso.");
        }
      }
    });

    criarTabelas();
  }
});

function criarTabelas() {
  // Cria tabela de reviews caso não exista
  const queryReviews = `
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id TEXT NOT NULL,
      user_name TEXT,
      rating INTEGER,
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;
  db.run(queryReviews);
}

// ==========================================
// 1. ROTA ESPECIAL: ADICIONAR JOGO VIA C
// ==========================================
app.post("/api/jogos/adicionar", (req, res) => {
  const { nome, imagem_url } = req.body;

  if (!nome || !imagem_url) {
    return res.status(400).json({ error: "Nome e URL da imagem são obrigatórios." });
  }

  const dadosParaC = {
    nome: nome,
    imagem_url: imagem_url
  };

  // Caminhos completos APENAS para o Node escrever o arquivo
  const jsonFilePath = path.join(__dirname, "input_dados.json");
  
  // Escreve o arquivo JSON
  fs.writeFile(jsonFilePath, JSON.stringify(dadosParaC), (err) => {
    if (err) {
      console.error("❌ Erro ao criar JSON:", err);
      return res.status(500).json({ error: "Erro interno ao preparar os dados." });
    }

    console.log("📄 JSON criado.");

    // --- CORREÇÃO AQUI ---
    // Usamos apenas os nomes dos arquivos, sem o caminho "C:\Users\..."
    // Isso evita problemas com acentos na "Área de Trabalho"
    const comando = `add_game.exe "input_dados.json" "database.db"`;

    // A opção { cwd: __dirname } diz para rodar o comando DENTRO da pasta do arquivo
    exec(comando, { cwd: __dirname }, (error, stdout, stderr) => {
      
      // Se houver erro, mostramos o stderr (mensagem de erro do C)
      if (error) {
        console.error(`❌ Erro crítico ao executar C: ${error.message}`);
        console.error(`🔍 Detalhes do erro (C): ${stderr}`); // Aqui vai aparecer o motivo real
        return res.status(500).json({ error: "O sistema em C falhou. Veja o console do servidor." });
      }

      console.log(`✅ Saída do C:\n${stdout}`);
      
      res.status(200).json({ 
        message: "Jogo adicionado com sucesso!", 
        system_output: stdout 
      });
    });
  });
});

// ==========================================
// 2. PROXY DA STEAM (Para evitar erros de CORS no front)
// ==========================================
app.get("/api/steam/details/:appid", async (req, res) => {
  const { appid } = req.params;
  console.log(`🔍 Buscando detalhes Steam para: ${appid}`);

  try {
    const response = await axios.get(`https://store.steampowered.com/api/appdetails`, {
      params: { 
        appids: appid,
        cc: 'US', 
        l: 'en' 
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const data = response.data[appid];

    if (data && data.success) {
      res.json(data.data);
    } else {
      res.status(404).json({ error: "Jogo não encontrado na Steam" });
    }
  } catch (error) {
    console.error("❌ Erro no Proxy Steam:", error.message);
    res.status(500).json({ error: "Erro interno ao conectar com a Steam" });
  }
});

// ==========================================
// 3. ROTAS DE REVIEWS
// ==========================================
app.post("/api/reviews", (req, res) => {
  const { game_id, user_name, rating, comment } = req.body;
  if (!game_id || !rating) return res.status(400).json({ error: "Dados incompletos" });

  const query = `INSERT INTO reviews (game_id, user_name, rating, comment) VALUES (?, ?, ?, ?)`;
  db.run(query, [game_id, user_name, rating, comment], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, game_id, user_name, rating, comment, created_at: new Date() });
  });
});

app.get("/api/reviews/:gameId", (req, res) => {
  const { gameId } = req.params;
  db.all("SELECT * FROM reviews WHERE game_id = ? ORDER BY created_at DESC", [gameId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ==========================================
// 4. ROTAS DE LISTAGEM (HOME STEAM)
// ==========================================
app.get("/api/steam/:category", async (req, res) => {
  const { category } = req.params;
  try {
    const response = await axios.get("http://store.steampowered.com/api/featured/", {
      params: { cc: 'US', l: 'en' },
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    const data = response.data;
    let steamData = category === 'recent' ? data.featured_mac : (category === 'trending' ? data.featured_linux : data.featured_win);
    
    if (!steamData || steamData.length === 0) steamData = data.featured_win || [];

    const formatted = steamData.map(g => ({
      appid: g.id.toString(),
      nome: g.name,
      imagem_url: g.large_capsule_image || g.header_image,
      nome_normalizado: g.name.toLowerCase(),
      tipo: "steam",
      price: g.final_price ? g.final_price / 100 : null
    }));
    res.json(formatted);
  } catch (err) {
    console.error("Erro ao buscar destaques Steam:", err.message);
    res.json([]);
  }
});

// ==========================================
// 5. ROTAS LOCAIS (BUSCA E DETALHES SQLITE)
// ==========================================
app.get("/api/jogos/busca", (req, res) => {
  const { q } = req.query;

  if (!q) return res.json([]);

  const query = `
    SELECT appid, nome, imagem_url, nome_normalizado, tipo 
    FROM jogos 
    WHERE nome LIKE ? OR nome_normalizado LIKE ?
    LIMIT 50
  `;

  const searchTerm = `%${q}%`;

  db.all(query, [searchTerm, searchTerm], (err, rows) => {
    if (err) {
      console.error("❌ Erro SQL na busca:", err.message);
      return res.status(500).json({ error: "Erro interno no banco de dados" });
    }
    res.json(rows);
  });
});

app.get("/api/jogos/:appid", (req, res) => {
  db.get("SELECT * FROM jogos WHERE appid = ?", [req.params.appid], (err, row) => {
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  });
});

// Inicializa o servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});