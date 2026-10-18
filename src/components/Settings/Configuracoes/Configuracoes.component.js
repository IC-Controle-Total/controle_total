import React, { useEffect, useState } from 'react';
import { Button } from '@material-ui/core';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import RecordVoiceOverIcon from '@material-ui/icons/RecordVoiceOver';
import ViewModuleIcon from '@material-ui/icons/ViewModule';
import CreateNewFolderIcon from '@material-ui/icons/CreateNewFolder';
import DashboardIcon from '@material-ui/icons/Dashboard';
import VoiceSelector from '../VoiceSelector/VoiceSelector.component';
import GerenciarCards from '../GerenciarCards/GerenciarCards.component';
import GerenciarPastas from '../GerenciarCards/GerenciarPastas.component';
import OrganizarCards from '../GerenciarCards/OrganizarCards.component';

import './Configuracoes.css';

const ABAS = [
  { id: 'voz', nome: 'Voz', icone: <RecordVoiceOverIcon /> },
  { id: 'cards', nome: 'Criar cards', icone: <ViewModuleIcon /> },
  { id: 'pastas', nome: 'Criar pastas', icone: <CreateNewFolderIcon /> },
  { id: 'organizar', nome: 'Organizar', icone: <DashboardIcon /> }
];

const PERGUNTA_SAIR =
  'A organização dos cards tem alterações não salvas. Sair sem salvar?';

const Configuracoes = ({ history }) => {
  const [abaAtiva, setAbaAtiva] = useState('voz');
  // A aba Organizar avisa quando tem uma disposição ainda não salva
  const [alteracoesPendentes, setAlteracoesPendentes] = useState(false);

  const podeSair = () => !alteracoesPendentes || window.confirm(PERGUNTA_SAIR);

  const voltar = () => {
    if (podeSair()) history.goBack();
  };

  const trocarAba = aba => {
    if (aba === abaAtiva || !podeSair()) return;
    setAlteracoesPendentes(false);
    setAbaAtiva(aba);
  };

  // Atalhos do hardware para voltar. São ignorados enquanto se digita em um
  // campo de texto ou com uma janela (como a de escolher pasta) aberta.
  useEffect(
    () => {
      const handleKeyDown = event => {
        const digitando = ['INPUT', 'TEXTAREA'].includes(
          document.activeElement && document.activeElement.tagName
        );
        const janelaAberta = !!document.querySelector('[role="dialog"]');
        if (digitando || janelaAberta) return;

        if (event.key.toLowerCase() === 'v' || event.key === 'Escape') {
          event.preventDefault();
          if (!alteracoesPendentes || window.confirm(PERGUNTA_SAIR)) {
            history.goBack();
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    },
    [history, alteracoesPendentes]
  );

  return (
    <div className="configuracoes">
      <div className="configuracoes-conteudo">
        <div className="configuracoes-cabecalho">
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={voltar}
            className="configuracoes-voltar"
          >
            Voltar
          </Button>
          <h1>Configurações</h1>
        </div>

        <div className="configuracoes-abas" role="tablist">
          {ABAS.map(aba => (
            <button
              key={aba.id}
              type="button"
              role="tab"
              aria-selected={abaAtiva === aba.id}
              className={
                abaAtiva === aba.id
                  ? 'configuracoes-aba ativa'
                  : 'configuracoes-aba'
              }
              onClick={() => trocarAba(aba.id)}
            >
              {aba.icone}
              {aba.nome}
            </button>
          ))}
        </div>

        {abaAtiva === 'voz' && <VoiceSelector history={history} embedded />}
        {abaAtiva === 'cards' && <GerenciarCards />}
        {abaAtiva === 'pastas' && <GerenciarPastas />}
        {abaAtiva === 'organizar' && (
          <OrganizarCards onAlteracoesPendentes={setAlteracoesPendentes} />
        )}
      </div>
    </div>
  );
};

export default Configuracoes;
