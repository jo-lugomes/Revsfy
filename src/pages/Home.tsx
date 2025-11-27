import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LogOut, Star, TrendingUp, Clock } from 'lucide-react';
import { auth } from '../firebaseConfig';

interface Game {
  id: string;
  title: string;
  cover: string;
  rating: number;
  reviews: number;
  year: number;
}

const featuredGames: Game[] = [
  {
    id: '1091500',
    title: 'Cyberpunk 2077',
    cover: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&h=600&fit=crop',
    rating: 4.5,
    reviews: 1247,
    year: 2020,
  },
  {
    id: '1174180',
    title: 'Red Dead Redemption 2',
    cover: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=600&fit=crop',
    rating: 4.8,
    reviews: 2156,
    year: 2018,
  },
  {
    id: '1245620',
    title: 'Elden Ring',
    cover: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&h=600&fit=crop',
    rating: 4.6,
    reviews: 1834,
    year: 2022,
  },
  {
    id: '1086940',
    title: 'Baldur\'s Gate 3',
    cover: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=400&h=600&fit=crop',
    rating: 4.9,
    reviews: 3421,
    year: 2023,
  },
  {
    id: '1172470',
    title: 'Apex Legends',
    cover: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=600&fit=crop',
    rating: 4.2,
    reviews: 892,
    year: 2019,
  },
  {
    id: '292030',
    title: 'The Witcher 3',
    cover: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400&h=600&fit=crop',
    rating: 4.9,
    reviews: 4521,
    year: 2015,
  },
];

function Home() {
  const navigate = useNavigate(); // Hook de navegação
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'popular' | 'recent' | 'trending'>('popular');

const handleLogout = async () => {
    await auth.signOut();
    // O App.tsx detectará a mudança de auth e redirecionará para login
  };

  const handleGameClick = (gameId: string) => {
    navigate(`/game/${gameId}`); // Navega para a URL específica do jogo
  };

  const filteredGames = featuredGames.filter((game) =>
    game.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center pl-[75px]">
              {/* --- ALTERAÇÃO AQUI: Logo GIF --- */}
              <img 
                src="https://s12.gifyu.com/images/b9av6.gif" 
                alt="Revsfy Logo" 
                className="w-32 h-32 object-contain"
              />
            </div>

            <div className="flex-1 max-w-2xl mx-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search games..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('popular')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'popular'
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Star className="w-4 h-4" />
            Popular
          </button>
          <button
            onClick={() => setActiveTab('trending')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'trending'
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Trending
          </button>
          <button
            onClick={() => setActiveTab('recent')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'recent'
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Clock className="w-4 h-4" />
            Recent
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {filteredGames.map((game) => (
            <div
              key={game.id}
              onClick={() => handleGameClick(game.id)}
              className="group cursor-pointer"
            >
              <div className="relative overflow-hidden rounded-lg shadow-lg mb-3 aspect-[2/3] bg-slate-800">
                <img
                  src={game.cover}
                  alt={game.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex items-center gap-2 text-yellow-400 mb-2">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="font-bold">{game.rating}</span>
                      <span className="text-xs text-slate-300">({game.reviews})</span>
                    </div>
                  </div>
                </div>
              </div>
              <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors line-clamp-2 mb-1">
                {game.title}
              </h3>
              <p className="text-sm text-slate-400">{game.year}</p>
            </div>
          ))}
        </div>

        {filteredGames.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate-400 text-lg">No games found matching your search</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default Home;