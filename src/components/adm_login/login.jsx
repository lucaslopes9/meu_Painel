import React, { useState } from 'react';
import { auth, db } from '../../firebase'; 
import { 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { ref, get } from 'firebase/database'; 
import { useNavigate } from 'react-router-dom';
import Register from './Register'; 
import './LoginStyles.css';

const LoginMain = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [mensagemSucesso, setMensagemSucesso] = useState(''); 
  const [verSenha, setVerSenha] = useState(false);

  const navigate = useNavigate();

  const handleRedefinirSenha = async () => {
    if (!email) {
      setErro('Por favor, digite seu e-mail primeiro para redefinir a senha.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setMensagemSucesso('E-mail de redefinição enviado! Verifique sua caixa de entrada.');
      setErro('');
    } catch (error) {
      console.error("Erro ao enviar e-mail:", error);
      setErro('Erro ao enviar e-mail de redefinição.');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro('');
    setMensagemSucesso('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;

      const adminRef = ref(db, `UsersAdmin/${user.uid}`);
      const snapshot = await get(adminRef);

      if (snapshot.exists()) {
        const dadosAdmin = snapshot.val();
        // Captura o cargo independente do nome da chave no Firebase
        const userRole = (dadosAdmin.role || dadosAdmin.perfil || dadosAdmin.cargo || '').trim();

        if (userRole) {
          // Se for Super Admin ou qualquer um dos outros cargos definidos, ele entra.
          // A filtragem de quem vê o quê será feita via props dentro do Painel/Sidebar.
          navigate('/painel'); 
        } else {
          await signOut(auth);
          setErro('Erro: Perfil de acesso não identificado no banco de dados.');
        }
      } else {
        await signOut(auth);
        setErro('Acesso negado! Este usuário não está na lista de administradores.');
      }

    } catch (error) {
      console.error("Erro no login:", error.code);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        setErro('E-mail ou senha incorretos.');
      } else {
        setErro('Erro ao acessar o sistema. Tente novamente.');
      }
    }
  };

  if (isRegistering) {
    return <Register aoVoltar={() => setIsRegistering(false)} />;
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>UAI GO</h1>
          <span>Painel Administrativo</span>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label>E-mail</label>
            <input 
              type="email" 
              placeholder="admin@uaigo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>

          <div className="input-group">
            <label>Senha</label>
            <div className="password-wrapper" style={{ position: 'relative' }}>
              <input 
                type={verSenha ? "text" : "password"} 
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required 
                style={{ width: '100%', paddingRight: '40px' }} 
              />
              <span 
                onClick={() => setVerSenha(!verSenha)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }}
              >
                {verSenha ? '👁️‍🗨️' : '👁️'}
              </span>
            </div>
            <div style={{ textAlign: 'right', marginTop: '5px' }}>
              <span 
                onClick={handleRedefinirSenha}
                style={{ color: '#aaa', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Esqueci minha senha
              </span>
            </div>
          </div>

          {erro && <p className="error-message">{erro}</p>}
          {mensagemSucesso && <p style={{color: '#2ecc71', fontSize: '14px', textAlign: 'center'}}>{mensagemSucesso}</p>}

          <button type="submit" className="btn-login">Acessar Painel</button>
        </form>

        <div className="toggle-auth">
          <p>Não tem cadastro? <a href="#cadastro" onClick={(e) => { e.preventDefault(); setIsRegistering(true); }}>Se cadastre</a></p>
        </div>

        <div className="login-footer">
          <p>&copy; 2026 Uai Go Mobile</p>
        </div>
      </div>
    </div>
  );
};

export default LoginMain;