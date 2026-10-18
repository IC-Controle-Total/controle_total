import React, { useEffect, useState } from 'react';
import { Button } from '@material-ui/core';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import RecordVoiceOverIcon from '@material-ui/icons/RecordVoiceOver';
import ViewModuleIcon from '@material-ui/icons/ViewModule';
import VoiceSelector from '../VoiceSelector/VoiceSelector.component';
import GerenciarCards from '../GerenciarCards/GerenciarCards.component';

import './Configuracoes.css';

const ABAS = [
  { id: 'voz', nome: 'Voz', icone: <RecordVoiceOverIcon /> },
  { id: 'cards', nome: 'Criar cards', icone: <ViewModuleIcon /> }
];

const Configuracoes = ({ history }) => {
  const [abaAtiva, setAbaAtiva] = useState('voz');

  // Atalhos do hardware para voltar. Na aba de cards são ignorados enquanto
  // se digita em um campo de texto.
  useEffect(
    () => {
      const handleKeyDown = event => {
        const digitando = ['INPUT', 'TEXTAREA'].includes(
          document.activeElement && document.activeElement.tagName
        );
        if (digitando) return;

        if (event.key.toLowerCase() === 'v' || event.key === 'Escape') {
          event.preventDefault();
          history.goBack();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    },
    [history]
  );

  return (
    <div className="configuracoes">
      <div className="configuracoes-conteudo">
        <div className="configuracoes-cabecalho">
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={() => history.goBack()}
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
              onClick={() => setAbaAtiva(aba.id)}
            >
              {aba.icone}
              {aba.nome}
            </button>
          ))}
        </div>

        {abaAtiva === 'voz' && <VoiceSelector history={history} embedded />}
        {abaAtiva === 'cards' && <GerenciarCards />}
      </div>
    </div>
  );
};

export default Configuracoes;
