import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseConfig';
import Login from './pages/Login';
import Home from './pages/Home';
import GameDetails from './pages/GameDetails';

// Componente para proteger rotas privadas
const ProtectedRoute = ({ children, isAuthenticated }: { children: JSX.Element, isAuthenticated: boolean }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Verifica se o usuário já está logado no Firebase ao carregar a página
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Carregando...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Rota de Login: Se já estiver logado, manda para Home */}
        <Route 
          path="/login" 
          element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />} 
        />

        {/* Rotas Protegidas */}
        <Route
          path="/"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Home />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/game/:id" // :id indica que é um parâmetro dinâmico
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <GameDetails />
            </ProtectedRoute>
          }
        />

        {/* Qualquer outra rota redireciona para Login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;