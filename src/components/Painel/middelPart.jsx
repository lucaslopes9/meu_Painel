import React, { useState, useEffect } from 'react';
import { db } from '../../firebase'; 

// Adicionei o 'set' aqui embaixo
import { ref, onValue, update, remove, set } from "firebase/database";

const MiddelPart = ({ activeTab, userRole }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fbError, setFbError] = useState(null);
  const [searchTerm, setSearchTerm] = useState(""); 
  const [selectedMotorista, setSelectedMotorista] = useState(null);
  const [replyTicket, setReplyTicket] = useState(null);
  const [adminResponse, setAdminResponse] = useState("");

  const [novoCupom, setNovoCupom] = useState({ 
    codigo: "", tipo: "Porcentagem", valor: "10", limite: "1", 
    usoAtuais: "0", categoria: "Geral", status: "ativo", validade: "" 
  });
  const [novaCidade, setNovaCidade] = useState({ nome: "", comissao: "" });

  useEffect(() => {
    const dbRef = ref(db);
    const unsubscribe = onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        setData(snapshot.val());
        setFbError(null);
      } else {
        setData({});
      }
      setLoading(false);
    }, (error) => {
      setFbError(error.message);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- FUNÇÕES DE APOIO ---
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'concluida': return '#28a745';
      case 'cancelada': return '#dc3545';
      case 'em andamento': return '#007bff';
      case 'pendente': return '#ffc107';
      default: return '#aaa';
    }
  };

  const gerarCodigoAleatorio = () => {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let resultado = '';
    for (let i = 0; i < 6; i++) {
      resultado += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    setNovoCupom({ ...novoCupom, codigo: resultado });
  };

  const incrementarPorcentagem = () => {
    const atual = parseInt(novoCupom.valor) || 0;
    setNovoCupom({ ...novoCupom, valor: String(atual + 5) });
  };

  const adicionarCidade = () => {
    if (!novaCidade.nome || !novaCidade.comissao) return alert("Preencha o nome e a comissão!");
    const idCidade = novaCidade.nome.toLowerCase().replace(/\s+/g, '_');
    const cidadeRef = ref(db, `Settings/Financeiro/Cidades/${idCidade}`);
    
    update(cidadeRef, {
      nome: novaCidade.nome,
      comissao: novaCidade.comissao
    }).then(() => {
      setNovaCidade({ nome: "", comissao: "" });
    });
  };

  
  const alterarValorCupom = (id, novoValor) => {
    const cupomRef = ref(db, `Settings/Cuppons/${id}`);
    update(cupomRef, { valor: String(novoValor) });
  };

  const toggleAprovacao = (uid, statusAtual) => {
    const novoStatus = (statusAtual === "Aprovado" || statusAtual === "aprovado") ? "Pendente" : "Aprovado";
    update(ref(db, `Users/motoristas/${uid}`), { Situacao: novoStatus, situacao: novoStatus });
  };

  const toggleStatusPassageiro = (uid, statusAtual) => {
    const novoStatus = statusAtual === "Ativo" ? "Bloqueado" : "Ativo";
    update(ref(db, `Users/Passageiros/${uid}`), { status: novoStatus });
  };

  const excluirItem = (path, nome) => {
    if (window.confirm(`Tem certeza que deseja remover ${nome}?`)) {
      remove(ref(db, path)).then(() => alert("Removido!")).catch(err => alert(err.message));
    }
  };

  const salvarConfigGeral = (campo, valor) => {
    update(ref(db, 'Settings/Geral'), { [campo]: valor });
  };

  const atualizarPlano = (planoId, campo, valor) => {
    const planoRef = ref(db, `Settings/Planos/${planoId}`);
    update(planoRef, { [campo]: Number(valor) })
      .catch(err => alert("Erro ao atualizar: " + err.message));
  };

  if (loading) return <div style={{color: '#fff', padding: '40px', textAlign: 'center'}}>⏳ Sincronizando com UaiGo...</div>;

  // --- DASHBOARD ---
  if (activeTab === 'dashboard' || !activeTab) {
    const passageiros = data?.Users?.Passageiros || {};
    const motoristas = data?.Users?.motoristas || {};
    const rides = data?.Rides || {};
    return (
      <div style={{ padding: '20px', width: '100%' }}>
        <h2 style={{ color: '#fff', marginBottom: '20px' }}>📊 Estatísticas Gerais</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div style={{ background: '#6f42c1', padding: '25px', borderRadius: '15px', color: '#fff' }}>
            <h3 style={{ fontSize: '30px', margin: 0 }}>{Object.keys(passageiros).length}</h3>
            <p style={{ margin: 0, opacity: 0.8 }}>Passageiros</p>
          </div>
          <div style={{ background: '#007bff', padding: '25px', borderRadius: '15px', color: '#fff' }}>
            <h3 style={{ fontSize: '30px', margin: 0 }}>{Object.keys(motoristas).length}</h3>
            <p style={{ margin: 0, opacity: 0.8 }}>Motoristas</p>
          </div>
          <div style={{ background: '#28a745', padding: '25px', borderRadius: '15px', color: '#fff' }}>
            <h3 style={{ fontSize: '25px', margin: 0 }}>R$ {Object.values(rides).reduce((a,c) => a + (Number(c.Valor)||0), 0).toFixed(2)}</h3>
            <p style={{ margin: 0, opacity: 0.8 }}>Volume de Corridas</p>
          </div>
        </div>
      </div>
    );
  }

  // --- GESTÃO DE CORRIDAS ---
 // --- GESTÃO DE CORRIDAS (COM COLUNA DE DATA) ---
  if (activeTab === 'corridas') {
    const ridesObj = data?.Rides || {};
    // .reverse() para mostrar as mais recentes primeiro
    const listaCorridas = Object.entries(ridesObj).map(([id, info]) => ({ id, ...info })).reverse();
    
    const filteredCorridas = listaCorridas.filter(r => 
      r.Motorista_Nome?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.Status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.id.includes(searchTerm)
    );

    return (
      <div style={{ padding: '20px', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2>🏁 Histórico de Corridas ({filteredCorridas.length})</h2>
          <input type="text" placeholder="Buscar por Motorista ou ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={styles.searchInput} />
        </div>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead style={styles.thead}>
              <tr>
                <th style={styles.td}>ID</th>
                <th style={styles.td}>Data Corrida</th> {/* Nova Coluna */}
                <th style={styles.td}>Motorista</th>
                <th style={styles.td}>Categoria</th>
                <th style={styles.td}>Valor</th>
                <th style={styles.td}>Status</th>
                <th style={styles.td}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredCorridas.map((ride) => (
                <tr key={ride.id} style={styles.tr}>
                  <td style={styles.td}><small style={{color: '#888'}}>{ride.id.substring(0,8)}...</small></td>
                  
                  {/* Puxando a Data do Banco de Dados */}
                  <td style={styles.td}>
                    <small style={{color: '#007bff'}}>
                      {ride.Data || ride.data || ride.date || '---'}
                    </small>
                  </td>

                  <td style={styles.td}><strong>{ride.Motorista_Nome || 'Buscando...'}</strong></td>
                  <td style={styles.td}>
                    <span style={{fontSize: '12px', background: '#333', padding: '3px 8px', borderRadius: '4px'}}>
                      {ride.Categoria?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={styles.td}>R$ {Number(ride.Valor || 0).toFixed(2)}</td>
                  <td style={styles.td}>
                    <span style={{ 
                      padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold',
                      background: `${getStatusColor(ride.Status)}22`, color: getStatusColor(ride.Status),
                      border: `1px solid ${getStatusColor(ride.Status)}`
                    }}>
                      {ride.Status?.toUpperCase() || 'N/A'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {userRole === 'Super Admin' && (
                      <button onClick={() => excluirItem(`Rides/${ride.id}`, `Corrida ${ride.id}`)} style={styles.deleteBtn}>🗑️</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

 // --- MOTORISTAS (COM LOGICA DE MODAL INCLUÍDA) ---
  if (activeTab === 'motoristas') {
    const motoristasObj = data?.Users?.motoristas || {};
    const listaMotoristas = Object.entries(motoristasObj).map(([id, info]) => ({
      uid: id, ...info,
      displayModelo: info.veiculo?.modelo || info.carroModelo || '---',
      displayPlaca: info.veiculo?.placa || info.carroPlaca || '---',
      currentStatus: info.Situacao || info.situacao || 'Pendente'
    })).filter(m => m.nome?.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
      <div style={{ padding: '20px', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2>🚗 Gestão de Motoristas ({listaMotoristas.length})</h2>
          <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={styles.searchInput} />
        </div>

        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead style={styles.thead}>
              <tr>
                <th style={styles.td}>ID</th>
                <th style={styles.td}>Data Cadastro</th>
                <th style={styles.td}>Nome</th>
                <th style={styles.td}>Veículo/placa</th>
                <th style={styles.td}>Status</th>
                <th style={styles.td}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {listaMotoristas.map((m, index) => (
                <tr key={m.uid} style={styles.tr}>
                  <td style={styles.td}><span style={{color: '#888'}}>{index + 1}</span></td>
                  <td style={styles.td}>
                    <small style={{color: '#007bff'}}>
                      {m.dataCadastro || m.data || '---'}
                    </small>
                  </td>
                  <td style={styles.td}><strong>{m.nome}</strong></td>
                  <td style={styles.td}>{m.displayModelo}<br/><small>{m.displayPlaca}</small></td>
                  <td style={styles.td}>
                    <button onClick={() => toggleAprovacao(m.uid, m.currentStatus)} style={{...styles.statusBtn, color: (m.currentStatus === 'Aprovado' || m.currentStatus === 'aprovado') ? '#28a745' : '#dc3545', borderColor: (m.currentStatus === 'Aprovado' || m.currentStatus === 'aprovado') ? '#28a745' : '#dc3545'}}>
                      {m.currentStatus.toUpperCase()}
                    </button>
                  </td>
                  <td style={styles.td}>
                    {/* ESTE BOTÃO ATIVA O MODAL ABAIXO */}
                    <button onClick={() => setSelectedMotorista(m)} style={styles.actionBtn}>👁️</button>
                    {userRole === 'Super Admin' && <button onClick={() => excluirItem(`Users/motoristas/${m.uid}`, m.nome)} style={styles.deleteBtn}>🗑️</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* --- INCLUA ESTE BLOCO ABAIXO PARA O MODAL FUNCIONAR --- */}
        {selectedMotorista && (
          <div style={styles.modalOverlay}>
            <div style={{...styles.modalContent, width: '450px', textAlign: 'center'}}>
              <h3 style={{color: '#007bff', marginBottom: '15px'}}>Documentação do Motorista</h3>
              
              <div style={{textAlign: 'left', fontSize: '14px', marginBottom: '20px'}}>
                <p><strong>Motorista:</strong> {selectedMotorista.nome}</p>
                <p><strong>CPF:</strong> {selectedMotorista.cpf || 'Não informado'}</p>
              </div>

              <div style={{background: '#000', borderRadius: '8px', padding: '10px', minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                {/* Aqui ele tenta buscar a imagem da CNH no banco */}
                {selectedMotorista.CNH_Image || selectedMotorista.cnhUrl || selectedMotorista.fotoCNH ? (
                  <img 
                    src={selectedMotorista.CNH_Image || selectedMotorista.cnhUrl || selectedMotorista.fotoCNH} 
                    alt="CNH" 
                    style={{width: '100%', borderRadius: '5px'}} 
                  />
                ) : (
                  <p style={{color: '#666'}}>Foto da CNH não disponível</p>
                )}
              </div>

              <button 
                onClick={() => setSelectedMotorista(null)} 
                style={{...styles.cancelBtn, marginTop: '20px', background: '#dc3545'}}
              >
                FECHAR
              </button>
            </div>
          </div>
        )}
        {/* --- FIM DO BLOCO DO MODAL --- */}

      </div>
    );
  }

  // --- PASSAGEIROS (COM COLUNA DE DATA DE ENTRADA) ---


const handleGerarCupom = (uid, nome) => {
  const codigoGerado = `UAI${Math.floor(1000 + Math.random() * 9000)}`;
  const passageiroRef = ref(db, `Users/Passageiros/${uid}`);

  update(passageiroRef, { 
    cupomBoasVindas: codigoGerado 
  })
  .then(() => alert(`Cupom ${codigoGerado} gerado para ${nome}!`))
  .catch(err => alert("Erro ao gerar: " + err.message));
};



  
if (activeTab === 'passageiros') {
  const passageirosObj = data?.Users?.Passageiros || {};
  const listaPassageiros = Object.entries(passageirosObj).map(([id, info]) => ({ uid: id, ...info }))
    .filter(p => 
      p.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.cpf?.includes(searchTerm) ||
      p.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div style={{ padding: '20px', color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2>👥 Gestão de Passageiros ({listaPassageiros.length})</h2>
        <input type="text" placeholder="Buscar por Nome, CPF ou E-mail..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={styles.searchInput} />
      </div>
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead style={styles.thead}>
            <tr>
              <th style={styles.td}>ID</th>
              <th style={styles.td}>Cadastro</th>
              <th style={styles.td}>Nome Completo</th>
              <th style={styles.td}>E-mail</th>
              <th style={styles.td}>Celular</th>
              <th style={styles.td}>Cupom 1ª Viagem</th>
              <th style={styles.td}>Status</th>
              <th style={styles.td}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {listaPassageiros.map((p, index) => (
              <tr key={p.uid} style={styles.tr}>
                <td style={styles.td}><span style={{color: '#888'}}>{index + 1}</span></td>
                <td style={styles.td}>
                  <small style={{color: '#007bff'}}>
                    {p.createdAt ? new Date(p.createdAt).toLocaleDateString('pt-BR') : '---'}
                  </small>
                </td>
                <td style={styles.td}><strong>{p.nome || 'N/A'}</strong></td>
                <td style={styles.td}><small>{p.email || '---'}</small></td>
                <td style={styles.td}><small>{p.telefone || '---'}</small></td>
                
                {/* Coluna do Cupom com Lógica de Gerador Manual */}
                <td style={styles.td}>
                  {p.cupomBoasVindas ? (
                    <span style={{ 
                      background: '#28a745', 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      fontSize: '11px',
                      fontWeight: 'bold',
                      color: '#fff' 
                    }}>
                      {p.cupomBoasVindas}
                    </span>
                  ) : (
                    <button 
                      onClick={() => handleGerarCupom(p.uid, p.nome)}
                      style={{ 
                        fontSize: '10px', 
                        padding: '2px 5px', 
                        cursor: 'pointer', 
                        backgroundColor: '#ffc107', 
                        border: 'none', 
                        borderRadius: '3px',
                        fontWeight: 'bold' 
                      }}
                    >
                      ⚡ Gerar Cupom
                    </button>
                  )}
                </td>

                <td style={styles.td}>
                  <button 
                    onClick={() => toggleStatusPassageiro(p.uid, p.status || 'Inativo', p.nome)} 
                    style={{ 
                      ...styles.statusBtn, 
                      color: (p.status === 'Ativo') ? '#28a745' : '#dc3545', 
                      borderColor: (p.status === 'Ativo') ? '#28a745' : '#dc3545', 
                      minWidth: '100px' 
                    }}
                  >
                    {(p.status || 'Pendente').toUpperCase()}
                  </button>
                </td>
                <td style={styles.td}>
                  {userRole === 'Super Admin' && (
                    <button onClick={() => excluirItem(`Users/Passageiros/${p.uid}`, p.nome)} style={styles.deleteBtn}>
                      🗑️
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
  // --- FINANCEIRO ---
  if (activeTab === 'financeiro') {
    const ridesObj = data?.Rides || {};
    const planos = data?.Settings?.Planos || {}; 
    const finSettings = data?.Settings?.Financeiro || {};
    const ridesArray = Object.values(ridesObj);
    const totalBruto = ridesArray.reduce((a, c) => a + (Number(c.Valor) || 0), 0);
    const receitaLiquidaUaiGo = ridesArray.reduce((a, c) => {
        const taxa = parseFloat(c.TaxaComissao) || 15;
        return a + (Number(c.Valor) * (taxa / 100));
    }, 0);

    const categoriasPlanos = [
      { id: 'Econômico', nome: 'Econômico' },
      { id: 'Conforto', nome: 'Conforto' },
      { id: 'Premium', nome: 'Premium' },
      { id: 'Compartilhado', nome: 'Compartilhado' }
    ];

    return (
      <div style={{ padding: '20px', color: '#fff' }}>
        <h2 style={{ marginBottom: '20px' }}>💰 Gestão Financeira Estratégica</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '25px' }}>
          <div style={{ ...styles.formCard, marginBottom: 0, borderLeft: '5px solid #28a745' }}>
            <small style={styles.label}>FATURAMENTO BRUTO</small>
            <h3 style={{ fontSize: '24px' }}>R$ {totalBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          </div>
          <div style={{ ...styles.formCard, marginBottom: 0, borderLeft: '5px solid #007bff' }}>
            <small style={styles.label}>RECEITA LÍQUIDA (UAIGO)</small>
            <h3 style={{ fontSize: '24px', color: '#28a745' }}>R$ {receitaLiquidaUaiGo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          </div>
          <div style={{ ...styles.formCard, marginBottom: 0, borderLeft: '5px solid #ffc107' }}>
            <small style={styles.label}>TOTAL REPASSES MOTORISTAS</small>
            <h3 style={{ fontSize: '24px' }}>R$ {(totalBruto - receitaLiquidaUaiGo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          </div>
        </div>

        <div style={styles.formCard}>
          <h4 style={{ marginBottom: '15px', color: '#6f42c1' }}>⚙️ Tabela de Planos e Preços (Real-time)</h4>
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead style={styles.thead}>
                <tr><th>CATEGORIA</th><th>BASE (R$)</th><th>KM (R$)</th><th>MIN (R$)</th><th>MÍNIMA (R$)</th></tr>
              </thead>
              <tbody>
                {categoriasPlanos.map(cat => {
                  const info = planos[cat.id] || {};
                  return (
                    <tr key={cat.id} style={styles.tr}>
                      <td style={styles.td}><strong>{cat.nome}</strong></td>
                      <td style={styles.td}><input type="number" step="0.01" defaultValue={info.base} onBlur={(e) => atualizarPlano(cat.id, 'base', e.target.value)} style={styles.miniInput} /></td>
                      <td style={styles.td}><input type="number" step="0.01" defaultValue={info.km} onBlur={(e) => atualizarPlano(cat.id, 'km', e.target.value)} style={styles.miniInput} /></td>
                      <td style={styles.td}><input type="number" step="0.01" defaultValue={info.min} onBlur={(e) => atualizarPlano(cat.id, 'min', e.target.value)} style={styles.miniInput} /></td>
                      <td style={styles.td}><input type="number" step="0.01" defaultValue={info.minima} onBlur={(e) => atualizarPlano(cat.id, 'minima', e.target.value)} style={styles.miniInput} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // --- SUPORTE (COM COLUNA DE DATA DE ENVIO) ---
if (activeTab === 'suporte') {
  // 1. Buscamos os dados das duas novas pastas no Firebase
  const suporteMotoristas = data?.Suporte?.Motorista || {};
  const suportePassageiros = data?.Suporte?.Passageiro || {};
  
  const listaTickets = [];

  // 2. Lógica para extrair tickets de Motoristas
  Object.entries(suporteMotoristas).forEach(([idUsuario, ticketsDoUser]) => {
    if (typeof ticketsDoUser === 'object') {
      Object.entries(ticketsDoUser).forEach(([idTicket, info]) => {
        listaTickets.push({ 
          id: idTicket, 
          idUsuario, 
          ...info, 
          perfil: 'Motorista',
          corPerfil: '#6f42c1', // Roxo para Motorista
          // Garante que a mensagem apareça independente do nome da chave no banco
          textoMensagem: info.mensagemMotorista || info.mensagem 
        });
      });
    }
  });

  // 3. Lógica para extrair tickets de Passageiros
  Object.entries(suportePassageiros).forEach(([idUsuario, ticketsDoUser]) => {
    if (typeof ticketsDoUser === 'object') {
      Object.entries(ticketsDoUser).forEach(([idTicket, info]) => {
        listaTickets.push({ 
          id: idTicket, 
          idUsuario, 
          ...info, 
          perfil: 'Passageiro',
          corPerfil: '#007bff', // Azul para Passageiro
          textoMensagem: info.mensagem 
        });
      });
    }
  });

  // 4. Ordenar: Mais recentes primeiro (baseado no timestamp)
  listaTickets.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  return (
    <div style={{ padding: '20px', color: '#fff' }}>
      <h2>🎧 Central de Suporte</h2>
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead style={styles.thead}>
            <tr>
              <th style={styles.td}>Data Envio</th>
              <th style={styles.td}>Perfil</th>
              <th style={styles.td}>Usuário</th>
              <th style={styles.td}>Mensagem</th>
              <th style={styles.td}>Status</th>
              <th style={styles.td}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {listaTickets.length === 0 ? (
              <tr><td colSpan="6" style={{textAlign: 'center', padding: '20px'}}>Nenhum ticket encontrado.</td></tr>
            ) : (
              listaTickets.map((t) => (
                <tr key={t.id} style={styles.tr}>
                  <td style={styles.td}>
                    <small style={{color: '#aaa'}}>
                      {t.dataEnvio ? new Date(t.dataEnvio).toLocaleString('pt-BR') : '---'}
                    </small>
                  </td>
                  
                  {/* Tag de Perfil com cor dinâmica */}
                  <td style={styles.td}>
                    <span style={{
                      backgroundColor: t.corPerfil,
                      padding: '4px 8px',
                      borderRadius: '5px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      color: '#fff'
                    }}>
                      {t.perfil}
                    </span>
                  </td>

                  <td style={styles.td}><strong>{t.nome || 'Usuário'}</strong></td>
                  <td style={styles.td}>{t.textoMensagem}</td>
                  
                  <td style={styles.td}>
                    <span style={{color: t.status === 'Respondido' ? '#28a745' : '#ffc107', fontWeight: 'bold'}}>
                      {t.status || 'Pendente'}
                    </span>
                  </td>
                  
                  <td style={styles.td}>
                    <button onClick={() => setReplyTicket(t)} style={styles.actionBtn}>
                      Responder
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL DE RESPOSTA */}
      {replyTicket && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <h3>Responder: {replyTicket.nome}</h3>
                <span style={{color: replyTicket.corPerfil, fontWeight: 'bold'}}>{replyTicket.perfil}</span>
            </div>
            <p style={{fontStyle: 'italic', color: '#888', marginTop: '10px'}}>"{replyTicket.textoMensagem}"</p>
            
            <textarea 
              value={adminResponse} 
              onChange={(e) => setAdminResponse(e.target.value)} 
              style={{
                ...styles.textarea, 
                width: '100%', 
                minHeight: '100px', 
                marginTop: '10px',
                backgroundColor: '#f9f9f9',
                color: '#333',
                padding: '10px',
                borderRadius: '8px'
              }} 
              placeholder="Digite sua resposta aqui..." 
            />
            
            <div style={{display: 'flex', gap: '10px', marginTop: '15px'}}>
              <button 
                onClick={() => responderTicket(replyTicket)} 
                style={{...styles.saveBtn, flex: 1}}
              >
                ENVIAR RESPOSTA
              </button>
              <button 
                onClick={() => { setReplyTicket(null); setAdminResponse(""); }} 
                style={{...styles.cancelBtn, flex: 1, backgroundColor: '#666'}}
              >
                FECHAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

  // --- CUPONS ---
  // --- ABA DE CUPONS ---
  if (activeTab === 'cupons') {
    // 1. Garantia de dados e mapeamento para a tabela
    // O 'data' deve vir do seu hook/state que escuta o Firebase no caminho principal
    const cuponsObj = data?.Settings?.Cuppons || {};
    const listaCupons = Object.entries(cuponsObj)
      .filter(([id, info]) => info && typeof info === 'object')
      .map(([id, info]) => ({ id, ...info }));

    // 2. Lógica para Salvar no Firebase
    const handleCriarCupomLocal = async () => {
      if (!novoCupom.codigo || !novoCupom.valor) {
        alert("Por favor, preencha o código e o valor!");
        return;
      }

      try {
        // Referência exata: Settings -> Cuppons -> CODIGO (como chave)
        const cupomRef = ref(db, `Settings/Cuppons/${novoCupom.codigo.trim()}`);
        
        await set(cupomRef, {
          tipo: novoCupom.tipo || 'Porcentagem',
          valor: novoCupom.valor,
          status: 'ativo',
          criadoEm: new Date().toISOString()
        });

        // Limpa o formulário após o sucesso
        setNovoCupom({ codigo: '', tipo: 'Porcentagem', valor: '' });
        console.log("Cupom gravado no Firebase com sucesso!");
      } catch (error) {
        console.error("Erro ao criar cupom:", error);
        alert("Erro ao salvar no banco de dados.");
      }
    };

    // 3. Lógica para Alterar Valor (onBlur)
    const handleAlterarValor = async (id, novoValor) => {
      try {
        const itemRef = ref(db, `Settings/Cuppons/${id}`);
        await update(itemRef, { valor: novoValor });
      } catch (error) {
        console.error("Erro ao atualizar valor:", error);
      }
    };

    return (
      <div style={{ padding: '20px', color: '#fff' }}>
        <h2>🎟️ Gerenciar Cupons</h2>
        
        <div style={styles.formCard}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', alignItems: 'end' }}>
            <div>
              <label style={styles.label}>CÓDIGO</label>
              <div style={{ display: 'flex', gap: '5px' }}>
                <input 
                  placeholder="EX: UAI10" 
                  value={novoCupom?.codigo || ''} 
                  onChange={(e) => setNovoCupom({ ...novoCupom, codigo: e.target.value.toUpperCase() })} 
                  style={styles.input} 
                />
                <button onClick={gerarCodigoAleatorio} style={styles.logicBtn}>🎲</button>
              </div>
            </div>

            <div>
              <label style={styles.label}>TIPO</label>
              <select 
                value={novoCupom?.tipo || 'Porcentagem'} 
                onChange={(e) => setNovoCupom({ ...novoCupom, tipo: e.target.value })} 
                style={styles.input}
              >
                <option value="Porcentagem">Porcentagem</option>
                <option value="Fixo">Fixo</option>
              </select>
            </div>

            <div>
              <label style={styles.label}>VALOR (%)</label>
              <div style={{ display: 'flex', gap: '5px' }}>
                <input 
                  type="number" 
                  value={novoCupom?.valor || ''} 
                  onChange={(e) => setNovoCupom({ ...novoCupom, valor: e.target.value })} 
                  style={styles.input} 
                />
                <button onClick={incrementarPorcentagem} style={styles.logicBtn}>+</button>
              </div>
            </div>

            <button onClick={handleCriarCupomLocal} style={{ ...styles.saveBtn, height: '42px' }}>
              GERAR CUPOM
            </button>
          </div>
        </div>

        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead style={styles.thead}>
              <tr>
                <th style={{ textAlign: 'left', padding: '10px' }}>Chave (Código)</th>
                <th style={{ textAlign: 'left' }}>Tipo</th>
                <th style={{ textAlign: 'left' }}>Valor</th>
                <th style={{ textAlign: 'left' }}>Status</th>
                <th style={{ textAlign: 'left' }}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {listaCupons.length > 0 ? (
                listaCupons.map((c) => (
                  <tr key={c.id} style={styles.tr}>
                    <td style={{ padding: '10px' }}><strong>{c.id}</strong></td>
                    <td>{c.tipo}</td>
                    <td>
                      <input 
                        type="text" 
                        defaultValue={c.valor} 
                        onBlur={(e) => handleAlterarValor(c.id, e.target.value)} 
                        style={styles.miniInput} 
                      />
                    </td>
                    <td>
                      <span style={{ color: c.status === 'ativo' ? '#28a745' : '#dc3545', fontWeight: 'bold' }}>
                        {(c.status || 'ativo').toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <button 
                        onClick={() => excluirItem(`Settings/Cuppons/${c.id}`, c.id)} 
                        style={styles.deleteBtn}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                    Nenhum cupom encontrado em Settings/Cuppons.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
  // --- CONFIGURAÇÕES ---
  if (activeTab === 'configuracoes') {
    const configGeral = data?.Settings?.Geral || {};
    return (
      <div style={{ padding: '20px', color: '#fff' }}>
        <h2 style={{ marginBottom: '20px' }}>⚙️ Configurações do Sistema</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={styles.formCard}>
            <h4 style={{ color: '#007bff', marginBottom: '15px' }}>🕒 Regras Operacionais</h4>
            <label style={styles.label}>TEMPO MÁXIMO DE ESPERA (MINUTOS)</label>
            <input type="number" style={styles.input} defaultValue={configGeral.tempoEspera || 5} onBlur={(e) => salvarConfigGeral('tempoEspera', e.target.value)} />
          </div>
          <div style={styles.formCard}>
            <h4 style={{ color: '#ffc107', marginBottom: '15px' }}>🛡️ Segurança</h4>
            <label style={styles.label}>AVALIAÇÃO MÍNIMA PARA BLOQUEIO</label>
            <input type="number" step="0.1" style={styles.input} defaultValue={configGeral.notaMinima || 4.5} onBlur={(e) => salvarConfigGeral('notaMinima', e.target.value)} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{color: '#fff', padding: '20px', textAlign: 'center', marginTop: '50px'}}>
      {selectedMotorista && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3>Ficha: {selectedMotorista.nome}</h3>
            <p>CPF: {selectedMotorista.cpf}</p>
            <p>Placa: {selectedMotorista.veiculo?.placa || '---'}</p>
            <button onClick={() => setSelectedMotorista(null)} style={styles.cancelBtn}>Fechar</button>
          </div>
        </div>
      )}
      <div style={{fontSize: '50px'}}>👆</div>
      <h3>Selecione um menu lateral para visualizar os dados.</h3>
    </div>
  );
};

const styles = {
  searchInput: { padding: '10px', borderRadius: '8px', background: '#1e1e2f', color: '#fff', border: '1px solid #333', width: '300px' },
  tableContainer: { background: '#1e1e2f', borderRadius: '10px', overflow: 'hidden', marginTop: '10px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#252545', color: '#aaa', textAlign: 'left' },
  tr: { borderBottom: '1px solid #2d2d44' },
  td: { padding: '15px' },
  label: { display: 'block', fontSize: '10px', color: '#888', marginBottom: '5px', fontWeight: 'bold' },
  statusBtn: { background: 'none', border: '1px solid', padding: '5px 12px', borderRadius: '20px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' },
  actionBtn: { background: '#333', border: 'none', color: '#fff', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer', marginRight: '5px' },
  deleteBtn: { background: '#dc354533', border: 'none', color: '#dc3545', padding: '8px', borderRadius: '4px', cursor: 'pointer' },
  formCard: { background: '#1e1e2f', padding: '20px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #333' },
  input: { padding: '10px', background: '#000', color: '#fff', border: '1px solid #444', borderRadius: '5px', width: '100%' },
  miniInput: { width: '70px', background: '#000', color: '#28a745', border: '1px solid #444', borderRadius: '4px', padding: '5px', textAlign: 'center' },
  logicBtn: { background: '#6f42c1', color: '#fff', border: 'none', borderRadius: '5px', padding: '0 15px', cursor: 'pointer', fontSize: '18px' },
  saveBtn: { background: '#28a745', color: '#fff', border: 'none', borderRadius: '5px', padding: '10px', cursor: 'pointer', fontWeight: 'bold' },
  cancelBtn: { background: '#444', color: '#fff', border: 'none', borderRadius: '5px', padding: '10px', cursor: 'pointer', marginTop: '10px', width: '100%' },
  modalOverlay: { position: 'fixed', top:0, left:0, width:'100%', height:'100%', background: 'rgba(0,0,0,0.8)', display:'flex', justifyContent:'center', alignItems:'center', zIndex: 1000 },
  modalContent: { background: '#1e1e2f', padding: '30px', borderRadius: '15px', width: '400px', border: '1px solid #333' },
  textarea: { width: '100%', height: '100px', background: '#000', color: '#fff', border: '1px solid #444', borderRadius: '5px', padding: '10px', marginBottom: '10px', resize: 'none' }
};

export default MiddelPart;