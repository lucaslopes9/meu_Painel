import React, { useState } from 'react';
import { auth } from '../../firebase'; // Certifique-se de que o caminho está correto
import { signOut } from 'firebase/auth';

const TopHeader = ({ titulo, userName }) => {
  const [menuAberto, setMenuAberto] = useState(false);

  // Função para deslogar do Firebase
  const handleLogout = async () => {
    try {
      await signOut(auth);
      // O App.jsx vai detectar que o user é null e voltará para o Login automaticamente
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  return (
    <header className="top-header">
      <div className="header-content">
        <h1>{titulo || "Painel Administrativo"}</h1>
      </div>
      
      <div className="header-right">
        <div className="status-indicator">
          <span className="dot online"></span>
          Sistema Online
        </div>

        {/* Container do Perfil com evento de clique */}
        <div className="user-profile-container">
          <div 
            className="user-profile" 
            onClick={() => setMenuAberto(!menuAberto)}
          >
            <span className="user-name">{userName || "Administrador"}</span>
            <div className="user-avatar">
              {userName ? userName.substring(0, 2).toUpperCase() : "AD"}
            </div>
          </div>

          {/* Menu Dropdown - Só aparece se menuAberto for true */}
          {menuAberto && (
            <div className="profile-dropdown">
              <div className="dropdown-info">
                <strong>{userName}</strong>
                <span>Painel Adm</span>
              </div>
              <hr />
              <button className="btn-sair-dropdown" onClick={handleLogout}>
                🚪 Sair do Sistema
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopHeader;