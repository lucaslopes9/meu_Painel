import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginMain from './components/adm_login/Login';
import PainelMain from './components/Painel/Main'; 
import { auth, db } from './firebase'; 
import { onAuthStateChanged } from 'firebase/auth';
import { ref, onValue } from 'firebase/database';

function App() {
  const MODO_DESENVOLVEDOR = false; 

  const [user, setUser] = useState(MODO_DESENVOLVEDOR ? { uid: 'dev-123' } : null);
  const [userRole, setUserRole] = useState(MODO_DESENVOLVEDOR ? 'Super Admin' : null);
  const [userName, setUserName] = useState(MODO_DESENVOLVEDOR ? 'Dev UaiGo' : '');
  const [loading, setLoading] = useState(true); // Inicializa sempre como true para validar

  useEffect(() => {
    if (MODO_DESENVOLVEDOR) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const roleRef = ref(db, `UsersAdmin/${currentUser.uid}`);
        
        // Lógica RBAC: Buscando o cargo no banco de dados
        onValue(roleRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            // Normaliza o cargo (remove espaços e aceita diferentes nomes de campo)
            const role = (data.role || data.perfil || data.cargo || 'Suporte').trim();
            const name = (data.nome || data.name || currentUser.email.split('@')[0]).trim();
            
            setUserRole(role);
            setUserName(name);
          } else {
            // Caso o usuário esteja no Auth mas não tenha registro no UsersAdmin
            setUserRole(null); 
          }
          // FIM DO LOADING: Agora temos User + Role (ou a falta dele)
          setLoading(false);
        }, (error) => {
          console.error("Erro ao buscar cargo:", error);
          setLoading(false);
        });
      } else {
        // Usuário deslogado
        setUser(null);
        setUserRole(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [MODO_DESENVOLVEDOR]);

  // Tela de transição enquanto valida o acesso
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        height: '100vh', 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#f4f7f6',
        flexDirection: 'column',
        fontFamily: 'sans-serif'
      }}>
          <h2 style={{ color: '#1a1a1a' }}>UAI GO</h2>
          <p style={{ color: '#666' }}>Validando credenciais de acesso...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Rota de Login: Protegida para não mostrar login se já estiver logado */}
        <Route 
          path="/" 
          element={user && userRole ? <Navigate to="/painel" replace /> : <LoginMain />} 
        />

        {/* Rota do Painel: Protegida por Login + Cargo */}
        <Route 
          path="/painel/*" 
          element={
            user && userRole ? (
              <PainelMain user={user} userRole={userRole} userName={userName} />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />

        {/* Rota de Fallback: Qualquer outra coisa manda para o início */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;