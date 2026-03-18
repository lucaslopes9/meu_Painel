import React, { useState } from 'react';
import { auth } from '../../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import './LoginStyles.css'; // Reaproveita o mesmo CSS

const Cadastro = ({ aoVoltar }) => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');

  const handleCadastro = async (e) => {
    e.preventDefault();
    setErro('');
    try {
      await createUserWithEmailAndPassword(auth, email, senha);
      alert("Administrador cadastrado com sucesso!");
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') setErro('Este e-mail já existe.');
      else setErro('Erro ao cadastrar. Tente uma senha mais forte.');
    }
  };

  return (
    <div className="login-card">
      <div className="login-header">
        <h1>UAI GO</h1>
        <span>Criar Nova Conta ADM</span>
      </div>

      <form onSubmit={handleCadastro} className="login-form">
        <div className="input-group">
          <label>E-mail Administrativo</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="input-group">
          <label>Senha</label>
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
        </div>

        {erro && <p className="error-message">{erro}</p>}

        <button type="submit" className="btn-login">Finalizar Cadastro</button>
      </form>

      <div className="toggle-auth">
        <p>Já tem conta? <a href="#login" onClick={(e) => { e.preventDefault(); aoVoltar(); }}>Voltar para Login</a></p>
      </div>
    </div>
  );
};

export default Cadastro;