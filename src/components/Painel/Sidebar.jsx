import React from 'react';

const Sidebar = ({ activeTab, setActiveTab, userRole }) => {
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', roles: ['Super Admin', 'administracao Operacional', 'financeiro', 'Suporte'] },
    { id: 'motoristas', label: 'Gestão Motoristas', icon: '🚗', roles: ['Super Admin', 'administracao Operacional', 'Suporte'] },
    { id: 'passageiros', label: 'Gestão Passageiros', icon: '👥', roles: ['Super Admin', 'administracao Operacional', 'Suporte'] },
    { id: 'corridas', label: 'Gestão Corridas', icon: '🚕', roles: ['Super Admin', 'administracao Operacional', 'financeiro', 'Suporte'] },
    { id: 'suporte', label: 'Suporte', icon: '📩', roles: ['Super Admin', 'administracao Operacional', 'Suporte'] }, 
    { id: 'cupons', label: 'Cupons / Promo', icon: '🎟️', roles: ['Super Admin', 'administracao Operacional'] },
    { id: 'financeiro', label: 'Financeiro', icon: '💰', roles: ['Super Admin', 'financeiro'] },
    // Alterado o id de 'config' para 'configuracoes' para conectar com o MiddelPart
    { id: 'configuracoes', label: 'Configurações', icon: '⚙️', roles: ['Super Admin'] }, 
  ];

  // FILTRO INTELIGENTE: Verifica se o cargo do usuário está na lista de permissões da aba
  const filteredItems = menuItems.filter(item => {
    // Se não tiver roles definidos, assume que é público (segurança extra)
    if (!item.roles) return true;
    
    // Verifica se o userRole atual está autorizado para este item
    return item.roles.includes(userRole);
  });

  return (
    <aside className="sidebar">
      <div className="logo-box">
        <h2>UAI GO <span className="badge">ADM</span></h2>
      </div>

      <nav className="nav-menu">
        {filteredItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={activeTab === item.id ? 'active' : ''}
          >
            <span className="icon">{item.icon}</span>
            <span className="label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info-small" style={{ fontSize: '10px', color: '#888', marginBottom: '10px', textAlign: 'center' }}>
            Logado como: <strong>{userRole || "Carregando..."}</strong>
        </div>
        <button className="btn-logout" onClick={() => window.location.reload()}>
          🚪 Sair do Painel
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;