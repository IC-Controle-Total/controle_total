import React, { useState, useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { Button } from '@material-ui/core';
import KeyboardIcon from '@material-ui/icons/Keyboard';
import VolumeUpIcon from '@material-ui/icons/VolumeUp';
import './Home.css';

export default function Home() {
  const history = useHistory();

  // Estado para saber qual botão está focado: 0 = Teclado, 1 = Cards
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Referência para o nosso Anti-Spam (Cooldown do Enter)
  const lastEnterTime = useRef(0);

  useEffect(
    () => {
      const handleKeyDown = event => {
        // Bloqueia a rolagem nativa da página ao apertar as setas
        if (
          ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(
            event.key
          )
        ) {
          event.preventDefault();
        }

        // === SISTEMA DO ENTER COM ANTI-SPAM ===
        if (event.key === 'Enter') {
          const agora = Date.now();
          // Cooldown de 600ms para evitar cliques duplos/travamentos
          if (agora - lastEnterTime.current < 600) return;
          lastEnterTime.current = agora;

          // Executa a ação do botão que estiver com o foco
          if (focusedIndex === 0) {
            history.push('/board/main');
          } else if (focusedIndex === 1) {
            history.push('/board/cards');
          }
        }
        // === NAVEGAÇÃO ESQUERDA / DIREITA ===
        else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
          // Como só temos 2 botões, qualquer seta pros lados inverte o foco (0 vira 1, 1 vira 0)
          setFocusedIndex(prevIndex => (prevIndex === 0 ? 1 : 0));
        }
      };

      // Liga os ouvidos do React para o teclado
      window.addEventListener('keydown', handleKeyDown);

      // Desliga os ouvidos quando o usuário mudar de tela (boas práticas)
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    },
    [focusedIndex, history]
  ); // O React precisa saber quando o foco ou o history mudam

  // Função para injetar o visual dinâmico (a borda azul grossa)
  const getButtonStyle = index => {
    const isFocused = focusedIndex === index;
    return isFocused
      ? {
          outline: '6px solid #0055ff', // Azul forte e grosso
          outlineOffset: '4px', // Joga um pouquinho pra fora do botão
          borderRadius: '5px',
          transform: 'scale(1.05)', // Cresce o botão
          transition: '0.2s',
          zIndex: 10
        }
      : { transition: '0.2s' }; // Suaviza a volta ao normal
  };

  return (
    <div className="home-container">
      <h1 className="home-title">Controle Total</h1>

      <div className="home-button-group">
        <Button
          variant="contained"
          className="home-button"
          startIcon={<KeyboardIcon />}
          onClick={() => history.push('/board/main')}
          style={getButtonStyle(0)} // Aplica a verificação visual para o Index 0
        >
          Teclado
        </Button>

        <Button
          variant="contained"
          className="home-button"
          startIcon={<VolumeUpIcon />}
          onClick={() => history.push('/board/cards')}
          style={getButtonStyle(1)} // Aplica a verificação visual para o Index 1
        >
          Cards
        </Button>
      </div>
    </div>
  );
}
