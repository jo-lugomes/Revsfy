import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Calendar, Users, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';


interface Review {
  id: string;
  user: string;
  rating: number;
  date: string;
  comment: string;
  likes: number;
  helpful: boolean;
}

interface GameData {
  id: string;
  title: string;
  description: string;
  cover: string;
  banner: string;
  releaseDate: string;
  developer: string;
  publisher: string;
  genres: string[];
  rating: number;
  totalReviews: number;
  screenshots: string[];
}

const gameDatabase: Record<string, GameData> = {
  '1091500': {
    id: '1091500',
    title: 'Cyberpunk 2077',
    description: 'Cyberpunk 2077 is an open-world, action-adventure RPG set in the dark future of Night City — a dangerous megalopolis obsessed with power, glamor, and ceaseless body modification. You play as V, a mercenary outlaw going after a one-of-a-kind implant that is the key to immortality. Customize your character\'s cyberware, skillset and playstyle, and explore a vast city where the choices you make shape the story and the world around you.',
    cover: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&h=600&fit=crop',
    banner: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1200&h=400&fit=crop',
    releaseDate: 'Dec 10, 2020',
    developer: 'CD PROJEKT RED',
    publisher: 'CD PROJEKT RED',
    genres: ['RPG', 'Action', 'Open World'],
    rating: 4.5,
    totalReviews: 1247,
    screenshots: [
      'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=600&h=400&fit=crop',
    ],
  },
};

const sampleReviews: Review[] = [
  {
    id: '1',
    user: 'GamerPro92',
    rating: 5,
    date: '2024-01-15',
    comment: 'An absolutely stunning game with incredible storytelling. The world of Night City is incredibly detailed and immersive. Best RPG I\'ve played in years!',
    likes: 42,
    helpful: false,
  },
  {
    id: '2',
    user: 'CyberFan',
    rating: 4,
    date: '2024-01-10',
    comment: 'Great game overall, but had some technical issues at launch. The story and characters are phenomenal though. Worth playing after the patches.',
    likes: 28,
    helpful: false,
  },
  {
    id: '3',
    user: 'RPGLover',
    rating: 5,
    date: '2023-12-20',
    comment: 'The atmosphere is unmatched. Every corner of Night City tells a story. The soundtrack is also incredible!',
    likes: 35,
    helpful: false,
  },
];

function GameDetails() {
  const { id } = useParams(); // Pega o ID da URL (ex: /game/1091500 -> id = "1091500")
  const navigate = useNavigate();
  
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [reviews] = useState<Review[]>(sampleReviews);

  // Busca o jogo pelo ID da URL. Se não achar, usa o fallback (Cyberpunk) ou exibe erro
  const game = (id && gameDatabase[id]) ? gameDatabase[id] : gameDatabase['1091500'];

  const handleBack = () => {
    navigate(-1); // Volta 1 passo no histórico do navegador
    // ou navigate('/') para forçar ir para a home
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    setUserRating(0);
    setUserComment('');
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </button>
        </div>
      </header>

      <div
        className="h-96 bg-cover bg-center relative"
        style={{ backgroundImage: `url(${game.banner})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/70 to-transparent" />
      </div>

      <main className="max-w-7xl mx-auto px-4 -mt-32 relative z-10">
        <div className="flex gap-8 mb-8">
          <img
            src={game.cover}
            alt={game.title}
            className="w-64 h-96 object-cover rounded-lg shadow-2xl border-4 border-slate-800"
          />

          <div className="flex-1 pt-8">
            <h1 className="text-5xl font-bold text-white mb-4">{game.title}</h1>

            <div className="flex items-center gap-6 mb-6">
              <div className="flex items-center gap-2">
                <Star className="w-6 h-6 text-yellow-400 fill-current" />
                <span className="text-3xl font-bold text-white">{game.rating}</span>
                <span className="text-slate-400">/ 5</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Users className="w-5 h-5" />
                <span>{game.totalReviews.toLocaleString()} reviews</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {game.genres.map((genre) => (
                <span
                  key={genre}
                  className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg font-medium"
                >
                  {genre}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mb-6">
              <div>
                <span className="text-slate-400">Release Date:</span>
                <div className="flex items-center gap-2 text-white mt-1">
                  <Calendar className="w-4 h-4" />
                  {game.releaseDate}
                </div>
              </div>
              <div>
                <span className="text-slate-400">Developer:</span>
                <p className="text-white mt-1">{game.developer}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">About This Game</h2>
          <p className="text-slate-300 leading-relaxed">{game.description}</p>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Screenshots</h2>
          <div className="grid grid-cols-3 gap-4">
            {game.screenshots.map((screenshot, index) => (
              <img
                key={index}
                src={screenshot}
                alt={`Screenshot ${index + 1}`}
                className="w-full h-48 object-cover rounded-lg hover:scale-105 transition-transform cursor-pointer"
              />
            ))}
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <MessageSquare className="w-6 h-6" />
            Write a Review
          </h2>

          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div>
              <label className="block text-slate-300 mb-2">Your Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setUserRating(star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= userRating
                          ? 'text-yellow-400 fill-current'
                          : 'text-slate-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="comment" className="block text-slate-300 mb-2">
                Your Review
              </label>
              <textarea
                id="comment"
                value={userComment}
                onChange={(e) => setUserComment(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                placeholder="Share your thoughts about this game..."
              />
            </div>

            <button
              type="submit"
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-all"
            >
              Submit Review
            </button>
          </form>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">User Reviews</h2>
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-slate-800 rounded-lg p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-white">{review.user}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= review.rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-slate-600'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-slate-400">{review.date}</span>
                    </div>
                  </div>
                </div>

                <p className="text-slate-300 mb-4">{review.comment}</p>

                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors">
                    <ThumbsUp className="w-4 h-4" />
                    <span className="text-sm">Helpful ({review.likes})</span>
                  </button>
                  <button className="flex items-center gap-2 text-slate-400 hover:text-red-400 transition-colors">
                    <ThumbsDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="bg-slate-800 border-t border-slate-700 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-400">
          <p>Game data will be fetched from Steam API based on game ID</p>
        </div>
      </footer>
    </div>
  );
}

export default GameDetails;
