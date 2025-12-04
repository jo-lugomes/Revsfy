import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Calendar, Users, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';

import { getFirestore, collection, addDoc, query, where, onSnapshot, serverTimestamp, orderBy } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { app } from '../firebaseConfig';
import { API_BASE } from '../config';

const db = getFirestore(app);
const auth = getAuth(app);

interface Review {
  id: string; // Firebase IDs são strings
  game_id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: any; // Timestamp do Firebase ou string convertida
}

interface GameData {
  appid: string;
  name: string;
  description: string;
  header_image: string;
  background?: string;
  release_date?: string;
  developers?: string[];
  genres?: string[];
  screenshots?: string[];
  price?: string;
}

function GameDetails() {
  // 🔥 CORREÇÃO: Pega qualquer variante do ID que o Router enviar
  const params = useParams();
  const gameId = params.gameId || params.id; 

  const navigate = useNavigate();

  const [game, setGame] = useState<GameData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados do formulário
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 1. CARREGA JOGO
  useEffect(() => {
    console.log("ID Recebido na URL:", gameId); // Olhe o console (F12)

    async function fetchGameData() {
      if (!gameId) {
        console.error("ID inválido ou indefinido.");
        setLoading(false);
        return;
      }
      
      let localData = null;
      let steamInfo = null;

      try {
        // A) Tenta pegar do banco local (caso tenha adicionado manualmente)
        try {
          const localRes = await fetch(`${API_BASE}/api/jogos/${gameId}`);
          if (localRes.ok) {
             localData = await localRes.json();
             console.log("Dados locais encontrados:", localData);
          }
        } catch (e) {
             // Ignora erro local silenciosamente
        }

        // B) Pega detalhes da Steam via Backend
        try {
          const steamRes = await fetch(`${API_BASE}/api/steam/details/${gameId}`);
          if (steamRes.ok) {
             steamInfo = await steamRes.json();
             console.log("Dados Steam encontrados:", steamInfo);
          } else {
             console.warn("Steam retornou erro:", steamRes.status);
          }
        } catch (e) {
          console.error("Erro de conexão com Steam Proxy:", e);
        }

        // C) Monta o objeto final (Fallback Robusto)
        // Se não achou NADA, cria um objeto genérico com o ID para não dar tela de erro
        const finalData: GameData = {
          appid: localData?.appid || gameId,
          name: steamInfo?.name || localData?.nome || `Jogo #${gameId}`,
          description: steamInfo?.detailed_description || steamInfo?.short_description || "Detalhes não disponíveis para este jogo.",
          header_image: steamInfo?.header_image || localData?.imagem_url || "https://via.placeholder.com/600x400?text=No+Image",
          background: steamInfo?.background || localData?.imagem_url,
          release_date: steamInfo?.release_date?.date || "Data desconhecida",
          developers: steamInfo?.developers || [],
          genres: steamInfo?.genres?.map((g: any) => g.description) || [],
          screenshots: steamInfo?.screenshots?.map((s: any) => s.path_thumbnail) || [],
          price: steamInfo?.price_overview?.final_formatted || ""
        };

        setGame(finalData);

      } catch (err) {
        console.error("Erro fatal no GameDetails:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchGameData();
  }, [gameId]);

useEffect(() => {
    if (!gameId) return;

    // Cria a query: Buscar na coleção 'reviews', onde gameId == atual, ordenado por data
    const q = query(
      collection(db, "reviews"), 
      where("gameId", "==", gameId),
      orderBy("createdAt", "desc") // Precisa criar índice no console se der erro, explico abaixo
    );

    // onSnapshot "escuta" o banco. Se alguém postar, atualiza na hora na sua tela.
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const firebaseReviews = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          game_id: data.gameId,
          user_name: data.userName || "Anônimo",
          rating: data.rating,
          comment: data.comment,
          // Converte Timestamp do Firestore para Date JS
          created_at: data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString()
        } as Review;
      });
      setReviews(firebaseReviews);
    });

    // Limpa o "ouvinte" quando sair da página
    return () => unsubscribe();
  }, [gameId]);
  
  

  
// 2. CARREGA REVIEWS DO FIREBASE
  useEffect(() => {
    if (!gameId) return;

    console.log("🔍 Iniciando busca de reviews para o ID:", gameId);

    // DICA: O String(gameId) garante que estamos buscando texto, pois no banco salvamos como texto
    const q = query(
      collection(db, "reviews"), 
      where("gameId", "==", String(gameId)),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log("📦 Dados recebidos do Firebase. Quantidade:", snapshot.size);

      const firebaseReviews = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          game_id: data.gameId,
          user_name: data.userName || "Anônimo",
          rating: data.rating,
          comment: data.comment,
          // Tratamento de data: Se for Timestamp do Firebase converte, senão usa data atual
          created_at: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString()
        } as Review; // Assegura que o objeto bata com sua interface
      });
      
      setReviews(firebaseReviews);
    }, (error) => {
      // 🔥 AQUI VAI APARECER O LINK DO ÍNDICE SE FALTAR
      console.error("❌ Erro ao buscar reviews:", error);
    });

    return () => unsubscribe();
  }, [gameId]);

  // 3. ENVIA REVIEW
const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRating === 0 || !gameId) return alert("Dê uma nota!");

    const user = auth.currentUser;

    if (!user) {
      alert("Você precisa estar logado para avaliar!");
      // Opcional: navigate('/login');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, "reviews"), {
        gameId: gameId,              // ID do jogo
        userId: user.uid,            // ID único do usuário (Auth)
        userName: user.displayName || user.email?.split('@')[0] || "Usuário", // Nome para exibição
        rating: userRating,
        comment: userComment,
        createdAt: serverTimestamp() // Data do servidor
      });

      // Sucesso! Limpa o form. 
      // Não precisa dar "setReviews" manual porque o onSnapshot lá em cima vai detectar a mudança e atualizar sozinho!
      setUserRating(0);
      setUserComment('');
      
    } catch (err) {
      console.error("Erro ao salvar review:", err);
      alert("Erro ao salvar avaliação. Verifique o console.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-900 flex justify-center items-center"><div className="text-white text-xl">Carregando...</div></div>;
  
  // Se mesmo com a blindagem o jogo for nulo (muito raro), mostra erro com botão de voltar
  if (!game) return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center text-white">
      <h2 className="text-2xl mb-4">Erro ao carregar ID: {gameId}</h2>
      <button onClick={() => navigate('/')} className="bg-emerald-500 px-4 py-2 rounded">Voltar</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50 p-4">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" /> Voltar
        </button>
      </header>

      {/* Banner */}
      <div className="h-96 bg-cover bg-center relative" style={{ backgroundImage: `url(${game.background || game.header_image})` }}>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent" />
      </div>

      <main className="max-w-7xl mx-auto px-4 -mt-32 relative z-10 pb-20">
        
        {/* Header do Jogo */}
        <div className="flex flex-col md:flex-row gap-8 mb-12">
          <img 
            src={game.header_image} 
            className="w-64 rounded-lg shadow-2xl border-4 border-slate-800 self-center md:self-start object-cover bg-slate-800" 
            alt={game.name}
            onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x450?text=No+Cover'}
          />
          
          <div className="pt-8 text-center md:text-left">
            <h1 className="text-4xl font-bold mb-4 text-white">{game.name}</h1>
            
            {game.price && <p className="text-emerald-400 text-xl font-bold mb-4">{game.price}</p>}
            
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
              {game.genres?.map(g => <span key={g} className="px-3 py-1 bg-slate-700 rounded-full text-sm">{g}</span>)}
            </div>
            
            <div className="flex flex-col gap-1 text-slate-400">
                <p>Desenvolvedor: {game.developers?.join(', ') || 'Desconhecido'}</p>
                <p>Lançamento: {game.release_date}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Descrição */}
          <div className="lg:col-span-2 bg-slate-800 p-6 rounded-lg border border-slate-700">
            <h2 className="text-2xl font-bold mb-4 text-white">Sobre</h2>
            <div className="prose prose-invert max-w-none text-slate-300" dangerouslySetInnerHTML={{ __html: game.description }} />
          </div>
          
          {/* Screenshots */}
          <div className="space-y-4">
             <h3 className="font-bold text-xl text-white">Galeria</h3>
             <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                {game.screenshots?.length ? (
                    game.screenshots.slice(0, 4).map((src, i) => (
                        <img key={i} src={src} className="rounded-lg hover:opacity-80 cursor-pointer border border-slate-700" alt="print" />
                    ))
                ) : (
                    <p className="text-slate-500 text-sm">Sem imagens disponíveis.</p>
                )}
             </div>
          </div>
        </div>

        {/* Área de Reviews */}
        <div className="max-w-3xl mx-auto mt-10">
          <div className="bg-slate-800 p-6 rounded-lg mb-8 border border-slate-700 shadow-lg">
            <h2 className="text-2xl font-bold mb-4 flex gap-2 text-white"><MessageSquare /> Avaliar Jogo</h2>
            
            <form onSubmit={handleSubmitReview} className="space-y-4">
               {/* Seus inputs de estrelas e texto mantidos iguais */}
               <div className="flex gap-2">
                 {[1,2,3,4,5].map(s => (
                   <button type="button" key={s} onClick={() => setUserRating(s)}>
                     <Star className={`w-8 h-8 ${s <= userRating ? 'text-yellow-400 fill-current' : 'text-slate-600'}`} />
                   </button>
                 ))}
               </div>
               <textarea 
                 value={userComment} 
                 onChange={e => setUserComment(e.target.value)} 
                 className="w-full bg-slate-700 p-3 rounded text-white"
                 placeholder="Escreva sua análise..." 
                 required 
               />
               <button disabled={submitting} className="bg-emerald-500 px-6 py-2 rounded text-white">
                 {submitting ? 'Enviando...' : 'Publicar Análise'}
               </button>
            </form>
          </div>

          <h3 className="text-2xl font-bold mb-4 text-white">Comentários ({reviews.length})</h3>
          <div className="space-y-4">
            {reviews.length === 0 && <p className="text-slate-500 italic">Seja o primeiro a avaliar!</p>}
            
            {reviews.map((r) => (
              <div key={r.id} className="bg-slate-800 p-4 rounded border border-slate-700">
                <div className="flex justify-between mb-2">
                  <span className="font-bold text-emerald-400">{r.user_name}</span>
                  <div className="flex text-yellow-400">
                      {[...Array(r.rating)].map((_,x)=><Star key={x} size={14} fill="currentColor"/>)}
                  </div>
                </div>
                <p className="text-slate-300">{r.comment}</p>
                {/* Ajuste na data para lidar com formato ISO */}
                <p className="text-xs text-slate-500 mt-2">
                    {new Date(r.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
     </div>
  );
}

export default GameDetails;