import React, { useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import { Button } from '@material-ui/core';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import VolumeUpIcon from '@material-ui/icons/VolumeUp';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import {
  changeVoice,
  changePitch,
  changeRate
} from '../../../providers/SpeechProvider/SpeechProvider.actions';

import './VoiceSelector.css';

const VoiceSelector = ({ history, dispatch, embedded = false }) => {
  // Navegação 2D: Linha (0=Voltar, 1 a 4=Cards) e Coluna (0=Ouvir, 1=Selecionar)
  // Dentro da tela de Configurações (embedded) o Voltar fica no cabeçalho dela
  const primeiraLinha = embedded ? 1 : 0;
  const [selectedRow, setSelectedRow] = useState(primeiraLinha);
  const [focusedAction, setFocusedAction] = useState(1); // 1 = Selecionar (padrão), 0 = Ouvir

  const [vozAtivaSistema, setVozAtivaSistema] = useState(null);
  const [systemVoices, setSystemVoices] = useState([]);

  const backRef = useRef(null);
  const voiceRefs = useRef([]);

  useEffect(() => {
    const carregarVozes = () => {
      const vozes = window.speechSynthesis.getVoices();
      setSystemVoices(vozes);
    };

    carregarVozes();
    window.speechSynthesis.onvoiceschanged = carregarVozes;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Foco visual com scroll suave
  useEffect(
    () => {
      if (selectedRow === 0) {
        if (backRef.current)
          backRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        return;
      }
      const card = voiceRefs.current[selectedRow - 1];
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    },
    [selectedRow]
  );

  const obterConfiguracaoDaVoz = index => {
    let vozEscolhida = null;
    let pitch = 1;
    let rate = 0.9;

    if (index === 1) {
      vozEscolhida = systemVoices.find(
        v => v.name === 'Microsoft Daniel - Portuguese (Brazil)'
      );
    } else if (index === 2) {
      vozEscolhida = systemVoices.find(
        v => v.name === 'Microsoft Maria - Portuguese (Brazil)'
      );
      pitch = 1.25;
      rate = 1.08;
    } else if (index === 3) {
      vozEscolhida = systemVoices.find(
        v => v.name === 'Microsoft Daniel - Portuguese (Brazil)'
      );
      pitch = 2.0;
      rate = 2.75;
    } else if (index === 4) {
      vozEscolhida = systemVoices.find(
        v => v.name === 'Microsoft Maria - Portuguese (Brazil)'
      );
      pitch = 2.5;
      rate = 3.0;
    }

    return { vozEscolhida, pitch, rate };
  };

  const ouvirAmostra = (index, e) => {
    if (e) e.stopPropagation();
    if (!systemVoices.length) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      'Olá! Esta é uma amostra da minha voz.'
    );
    const { vozEscolhida, pitch, rate } = obterConfiguracaoDaVoz(index);

    if (vozEscolhida) {
      utterance.voice = vozEscolhida;
      utterance.lang = vozEscolhida.lang;
      utterance.pitch = pitch;
      utterance.rate = rate;
    } else {
      utterance.lang = 'pt-BR';
    }

    window.speechSynthesis.speak(utterance);
  };

  const selecionarESalvarVoz = (index, e) => {
    if (e) e.stopPropagation();
    const { vozEscolhida, pitch, rate } = obterConfiguracaoDaVoz(index);

    if (vozEscolhida) {
      dispatch(changeVoice(vozEscolhida.voiceURI, vozEscolhida.lang));
      dispatch(changePitch(pitch));
      dispatch(changeRate(rate));
    }

    setVozAtivaSistema(index);
  };

  useEffect(
    () => {
      const handleKeyDown = event => {
        // Atalho rápido para voltar
        if (!embedded && event.key.toLowerCase() === 'v') {
          event.preventDefault();
          history.goBack();
          return;
        }

        // Navegação Vertical (Cima / Baixo)
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setSelectedRow(prev => (prev === 4 ? primeiraLinha : prev + 1));
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          setSelectedRow(prev => (prev === primeiraLinha ? 4 : prev - 1));
        }

        // Navegação Horizontal (Esquerda / Direita dentro do Card)
        if (event.key === 'ArrowRight') {
          event.preventDefault();
          if (selectedRow > 0) setFocusedAction(1); // Vai para "Selecionar"
        }
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          if (selectedRow > 0) setFocusedAction(0); // Vai para "Ouvir"
        }

        // Ação Principal (Enter)
        if (event.key === 'Enter') {
          event.preventDefault();

          if (selectedRow === 0) {
            history.goBack(); // Enter no botão Voltar
            return;
          }

          // Se estiver num Card, checa qual botão está focado
          if (focusedAction === 0) {
            ouvirAmostra(selectedRow);
          } else {
            selecionarESalvarVoz(selectedRow);
          }
        }

        if (!embedded && event.key === 'Escape') {
          history.goBack();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    },
    [selectedRow, focusedAction, systemVoices, history, embedded, primeiraLinha]
  );

  const opcoes = [
    { nome: 'Voz masculina', descricao: 'Microsoft Daniel', emoji: '👨' },
    { nome: 'Voz feminina', descricao: 'Microsoft Maria', emoji: '👩' },
    {
      nome: 'Voz masculina rápida',
      descricao: 'Velocidade diferente',
      emoji: '👨'
    },
    {
      nome: 'Voz feminina rápida',
      descricao: 'Velocidade diferente',
      emoji: '👩'
    }
  ];

  const listaDeVozes = (
    <div
      className="voice-options"
      style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
    >
      {opcoes.map((opcao, index) => {
        const rowIdx = index + 1;
        const isRowFocused = selectedRow === rowIdx;
        const isAtiva = vozAtivaSistema === rowIdx;

        // Lógica visual para saber qual botão está selecionado no teclado
        const isOuvirFocused = isRowFocused && focusedAction === 0;
        const isSelecionarFocused = isRowFocused && focusedAction === 1;

        return (
          <div
            key={opcao.nome}
            ref={element => {
              voiceRefs.current[index] = element;
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '15px 25px',
              transition: 'all 0.2s ease',
              boxShadow: isRowFocused
                ? '0 8px 20px rgba(0,85,255,0.15)'
                : '0 4px 8px rgba(0,0,0,0.05)',
              border: isAtiva
                ? '3px solid #4CAF50'
                : isRowFocused
                ? '3px solid #b3d4ff'
                : '3px solid transparent',
              transform: isRowFocused ? 'scale(1.02)' : 'scale(1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div
                style={{
                  fontSize: '40px',
                  backgroundColor: '#f0f4f8',
                  borderRadius: '50%',
                  width: '60px',
                  height: '60px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {opcao.emoji}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <h2
                    style={{
                      margin: 0,
                      fontSize: '20px',
                      color: '#0a2540'
                    }}
                  >
                    {opcao.nome}
                  </h2>
                  {isAtiva && <CheckCircleIcon style={{ color: '#4CAF50' }} />}
                </div>
                <p
                  style={{
                    margin: 0,
                    color: '#666',
                    fontSize: '14px',
                    marginTop: '4px'
                  }}
                >
                  {opcao.descricao}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<VolumeUpIcon />}
                onClick={e => ouvirAmostra(rowIdx, e)}
                style={{
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 'bold',
                  border: isOuvirFocused
                    ? '3px solid #0055ff'
                    : '1px solid rgba(0, 0, 0, 0.23)',
                  backgroundColor: isOuvirFocused ? '#e6f0ff' : 'transparent',
                  transition: 'all 0.2s ease'
                }}
              >
                Ouvir
              </Button>
              <Button
                variant="contained"
                onClick={e => selecionarESalvarVoz(rowIdx, e)}
                style={{
                  backgroundColor: isAtiva ? '#4CAF50' : '#00bcd4',
                  color: 'white',
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 'bold',
                  boxShadow: 'none',
                  border: isSelecionarFocused
                    ? '3px solid #0055ff'
                    : '3px solid transparent',
                  transition: 'all 0.2s ease'
                }}
              >
                {isAtiva ? 'Selecionada' : 'Selecionar'}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );

  if (embedded) return listaDeVozes;

  return (
    <div
      className="voice-selector"
      style={{
        minHeight: '100vh',
        width: '100vw',
        padding: '20px 40px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      {/* Container principal ocupando 90% da largura, similar à tela de teclado */}
      <div style={{ width: '90%', maxWidth: '1200px' }}>
        {/* CABEÇALHO: Posição Relativa para centralizar o título e isolar o botão */}
        <div
          className="voice-header"
          style={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '40px',
            minHeight: '50px'
          }}
        >
          <Button
            ref={backRef}
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={() => history.goBack()}
            style={{
              position: 'absolute', // Ancorado à esquerda
              left: 0,
              backgroundColor: selectedRow === 0 ? '#0056b3' : '#ffffff',
              color: selectedRow === 0 ? '#ffffff' : '#0a2540',
              border:
                selectedRow === 0
                  ? '4px solid #ffcc00'
                  : '2px solid transparent',
              fontWeight: 'bold',
              borderRadius: '8px',
              padding: '10px 20px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease'
            }}
          >
            Voltar
          </Button>
          <h1 style={{ color: '#0a2540', margin: 0, fontSize: '32px' }}>
            Escolha uma voz
          </h1>
        </div>

        {listaDeVozes}
      </div>
    </div>
  );
};

export default connect()(VoiceSelector);
