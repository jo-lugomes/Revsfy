import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
// Adicionei PlusCircle aqui nas importações
import { Search, LogOut, Star, TrendingUp, Clock, X, PlusCircle } from "lucide-react";
import { auth } from "../firebaseConfig";

interface GameDB {
  appid: string;
  nome: string;
  imagem_url: string;
  nome_normalizado: string;
  tipo: string;
  rating?: number;
  year?: number;
  price?: number;
}

function Home() {
  const navigate = useNavigate();
  
  // --- ESTADOS DA GRADE PRINCIPAL (STEAM) ---
  const [activeTab, setActiveTab] = useState<"popular" | "recent" | "trending">("popular");
  const [mainGames, setMainGames] = useState<GameDB[]>([]);
  const [loadingMain, setLoadingMain] = useState(true);

  // --- ESTADOS DA BUSCA (SQLITE / DROPDOWN) ---
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GameDB[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  // --- NOVO: ESTADOS DO MODAL ADICIONAR JOGO ---
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGameName, setNewGameName] = useState("");
  const [newGameUrl, setNewGameUrl] = useState("");
  const [savingGame, setSavingGame] = useState(false);

  // Ref para detectar clique fora
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // 1. CARREGA A GRADE PRINCIPAL (STEAM)
  useEffect(() => {
    async function loadMainGrid() {
      setLoadingMain(true);
      try {
        const res = await fetch(`http://localhost:3001/api/steam/${activeTab}`);
        const data = await res.json();
        setMainGames(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Erro na grade principal:", err);
      } finally {
        setLoadingMain(false);
      }
    }
    loadMainGrid();
  }, [activeTab]);

  // 2. LÓGICA DE BUSCA (SQLITE - DROPDOWN)
  useEffect(() => {
    if (searchQuery.trim() === "") {
        setSearchResults([]);
        setShowDropdown(false);
        return;
    }

    const timeoutId = setTimeout(async () => {
      setLoadingSearch(true);
      setShowDropdown(true); 
      try {
        const res = await fetch(`http://localhost:3001/api/jogos/busca?q=${searchQuery}`);
        if (res.ok) {
            const data = await res.json();
            setSearchResults(Array.isArray(data) ? data : []);
        } else {
            setSearchResults([]);
        }
      } catch (err) {
        console.error("Erro na busca:", err);
        setSearchResults([]);
      } finally {
        setLoadingSearch(false);
      }
    }, 500); 

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // --- NOVA FUNÇÃO: SALVAR JOGO VIA C ---
  const handleSaveCustomGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGameName || !newGameUrl) return;

    setSavingGame(true);
    try {
      const response = await fetch("http://localhost:3001/api/jogos/adicionar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: newGameName,
          imagem_url: newGameUrl
        })
      });

      if (response.ok) {
        alert("Sucesso! O sistema em C adicionou o jogo ao banco.");
        setShowAddModal(false);
        setNewGameName("");
        setNewGameUrl("");
        // Opcional: Recarregar alguma lista ou limpar busca
        setSearchQuery("");
      } else {
        const errData = await response.json();
        alert("Erro ao adicionar: " + (errData.error || "Erro desconhecido"));
      }
    } catch (error) {
      console.error(error);
      alert("Erro de conexão com o servidor.");
    } finally {
      setSavingGame(false);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
  };

  const handleGameClick = (gameId: string) => {
    navigate(`/game/${gameId}`);
    setShowDropdown(false); 
    setSearchQuery(""); 
  };

  // Fecha o dropdown se clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 relative">
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center pl-[75px]">
              <img
                src="https://s12.gifyu.com/images/b9av6.gif"
                alt="Revsfy Logo"
                className="w-32 h-32 object-contain"
              />
            </div>

            {/* --- ÁREA DE BUSCA --- */}
            <div className="flex-1 max-w-2xl mx-8 relative" ref={searchContainerRef}>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => { if (searchQuery) setShowDropdown(true); }}
                  placeholder="Pesquisar no banco de dados..."
                  className="w-full pl-12 pr-10 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
                {searchQuery && (
                    <button 
                        onClick={() => { setSearchQuery(""); setShowDropdown(false); }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
              </div>

              {/* --- MENU SUSPENSO (DROPDOWN) --- */}
              {showDropdown && searchQuery && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl z-[100] max-h-96 overflow-y-auto custom-scrollbar">
                  {loadingSearch ? (
                    <div className="p-6 text-center text-slate-400 flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500"></div>
                        Buscando...
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-6 text-center text-slate-400">
                        Nenhum jogo encontrado para "{searchQuery}"
                    </div>
                  ) : (
                    <div className="py-2">
                        {searchResults.map((game) => (
                            <div 
                                key={game.appid}
                                onClick={() => handleGameClick(game.appid)}
                                className="flex items-center gap-4 px-4 py-3 hover:bg-slate-700 cursor-pointer transition-colors border-b border-slate-700/50 last:border-0"
                            >
                                <img 
                                    src={game.imagem_url} 
                                    alt={game.nome} 
                                    className="w-12 h-16 object-cover rounded bg-slate-900"
                                    onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/50x70'}
                                />
                                <div className="flex-1">
                                    <h4 className="text-white font-medium line-clamp-1">{game.nome}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-slate-400 bg-slate-900/50 px-2 py-0.5 rounded">
                                            ID: {game.appid}
                                        </span>
                                        {game.price && (
                                            <span className="text-xs text-emerald-400 font-bold">
                                                R$ {game.price.toFixed(2).replace('.', ',')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* --- BOTÃO NOVO: ADICIONAR JOGO --- */}
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all shadow-lg hover:shadow-emerald-500/20"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden md:inline">Adicionar Jogo</span>
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* --- MODAL (JANELA) DE ADICIONAR JOGO --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <PlusCircle className="text-emerald-500" />
              Novo Jogo Customizado
            </h2>
            
            <form onSubmit={handleSaveCustomGame} className="space-y-4">
              <div>
                <label className="block text-slate-300 mb-2 text-sm font-medium">Nome do Jogo</label>
                <input 
                  type="text" 
                  required
                  value={newGameName}
                  onChange={(e) => setNewGameName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder-slate-500"
                  placeholder="Ex: Super Mario World"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-2 text-sm font-medium">URL da Imagem (Capa)</label>
                <input 
                  type="text" 
                  required
                  value={newGameUrl}
                  onChange={(e) => setNewGameUrl(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder-slate-500"
                  placeholder="https://exemplo.com/imagem.jpg"
                />
                <p className="text-xs text-slate-500 mt-1">Cole um link direto para uma imagem JPG ou PNG.</p>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={savingGame}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-lg shadow-emerald-900/20"
                >
                  {savingGame ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Processando com C...
                    </>
                  ) : (
                    "Salvar no Banco"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- GRADE PRINCIPAL --- */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2 custom-scrollbar">
          <button
            onClick={() => setActiveTab("popular")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === "popular"
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Star className="w-4 h-4" />
            Popular
          </button>
          <button
            onClick={() => setActiveTab("trending")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === "trending"
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Trending
          </button>
          <button
            onClick={() => setActiveTab("recent")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === "recent"
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Clock className="w-4 h-4" />
            Recent
          </button>
        </div>

        {loadingMain ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-slate-300">Carregando Steam...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {mainGames.map((game) => (
              <div
                key={game.appid}
                onClick={() => handleGameClick(game.appid)}
                className="group cursor-pointer"
              >
                <div className="relative overflow-hidden rounded-lg shadow-lg mb-3 aspect-[2/3] bg-slate-800">
                  <img
                    src={game.imagem_url}
                    alt={game.nome}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      {game.price && (
                         <span className="text-emerald-400 font-bold block mb-1">
                           R$ {game.price.toFixed(2).replace('.', ',')}
                         </span>
                      )}
                    </div>
                  </div>
                </div>

                <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors line-clamp-2 mb-1">
                  {game.nome}
                </h3>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Home;