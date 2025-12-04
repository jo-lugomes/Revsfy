import { useState } from 'react';
import { auth } from '../firebaseConfig'; 
// 🔥 IMPORTANTE: Adicionei updateProfile aqui nos imports
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, AuthError } from 'firebase/auth';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // 🔥 Novo estado para o nome do usuário
  const [username, setUsername] = useState('');
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        // --- LÓGICA DE CADASTRO COM NOME ---
        
        // 1. Cria a conta
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // 2. Atualiza o perfil imediatamente com o nome digitado
        if (username.trim()) {
            await updateProfile(userCredential.user, {
                displayName: username
            });
        }
        
        // Opcional: Recarregar a página ou redirecionar
        // window.location.href = '/'; 

      } else {
        // --- LÓGICA DE LOGIN ---
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      const firebaseError = err as AuthError;
      console.error(firebaseError);
      
      switch (firebaseError.code) {
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          setError('Email ou senha incorretos.');
          break;
        case 'auth/email-already-in-use':
          setError('Este email já está cadastrado.');
          break;
        case 'auth/weak-password':
          setError('A senha deve ter pelo menos 6 caracteres.');
          break;
        default:
          setError('Ocorreu um erro. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-5">
          <div className="flex items-center justify-center mb-0">
            <img
                src="https://s12.gifyu.com/images/b9av6.gif" 
                alt="Revsfy Logo" 
                className="w-48 h-48 object-contain"
              />
          </div>
          <p className="text-slate-400">Que comecem os JOGOS!</p>
        </div>

        <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => { setIsSignUp(false); setError(''); }}
              className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                !isSignUp
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => { setIsSignUp(true); setError(''); }}
              className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                isSignUp
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* 🔥 NOVO CAMPO DE NOME (Só aparece no cadastro) */}
            {isSignUp && (
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-2">
                    Nome de Usuário
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder="Como você quer ser chamado?"
                    required={isSignUp} // Obrigatório apenas se for cadastro
                  />
                </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            {!isSignUp && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center text-slate-300 cursor-pointer">
                  <input type="checkbox" className="mr-2 rounded accent-emerald-500" />
                  Remember me
                </label>
                <a href="#" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                  Forgot password?
                </a>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Processando...' : (isSignUp ? 'Criar Conta' : 'Entrar')}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-400 text-sm mt-6">
          Rate, review, and discover your next favorite game
        </p>
      </div>
    </div>
  );
}

export default Login;