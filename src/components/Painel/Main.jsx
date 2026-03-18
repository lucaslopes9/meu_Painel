import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';
import MiddelPart from './middelPart';
import './PainelStyles.css'; 

const Main = ({ user, userRole, userName }) => { 
  const [activeTab, setActiveTab] = useState('dashboard');

  // Log para confirmar que o componente recebeu os dados corretos
  useEffect(() => {
    console.log("Painel carregado para:", userName, "| Cargo:", userRole);
  }, [userRole, userName]);

  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'motoristas': return 'Gestão de Motoristas';
      case 'passageiros': return 'Gestão de Passageiros';
      case 'corridas': return 'Gestão de Corridas';
      case 'financeiro': return 'Módulo Financeiro';
      case 'config': return 'Configurações do Sistema';
      case 'suporte': return 'Central de Atendimento'; // Adicionado para o cargo Suporte
      default: return `Visão Geral - UaiGo`;
    }
  };

  // Proteção: Se o componente montar sem role, exibe o loading interno
  if (!userRole) {
    return (
      <div className="loading-screen" style={{
        display: 'flex', 
        height: '100vh', 
        justifyContent: 'center', 
        alignItems: 'center', 
        background: '#131021', 
        color: '#fff',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%'
      }}>
        <p>Sincronizando permissões do perfil...</p>
      </div>
    );
  }

  return (
    <div className="painel-layout" style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      width: '100vw',
      position: 'relative',
      zIndex: 1 // Garante que fique acima de camadas residuais
    }}>
      {/* O Sidebar usa o userRole para filtrar quais botões aparecem */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        userRole={userRole} 
      />

      <div className="main-area" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TopHeader 
          titulo={getHeaderTitle()} 
          userName={userName || (user?.email ? user.email.split('@')[0] : 'Usuário')} 
          userRole={userRole} 
        />
        
        <main className="content-container" style={{ flex: 1, overflowY: 'auto' }}>
          {/* Repassamos o userRole para o MiddelPart para travar ações internas */}
          <MiddelPart activeTab={activeTab} userRole={userRole} />
        </main>
      </div>
    </div>
  );
};

export default Main;