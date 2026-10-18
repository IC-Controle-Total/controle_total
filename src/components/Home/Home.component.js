import React, { useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import { Button } from '@material-ui/core';
import KeyboardIcon from '@material-ui/icons/Keyboard';
import VolumeUpIcon from '@material-ui/icons/VolumeUp';
import SettingsIcon from '@material-ui/icons/Settings';
import HistoryIcon from '@material-ui/icons/History';
import DeleteIcon from '@material-ui/icons/Delete';
import iconeCadeira from './cadeira.png';
import {
  speak,
  cancelSpeech
} from '../../providers/SpeechProvider/SpeechProvider.actions';
import './Home.css';

const layoutTeclado = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ç'],
  ['CAPS', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'ESPAÇO', 'APAGAR']
];

function Home({ dispatch, output }) {
  const history = useHistory();
  const location = useLocation();

  const getFraseFromRedux = () => {
    if (!output || output.length === 0) return '';
    return output.map(item => item.label || '').join(' ');
  };

  const [mostrarTeclado, setMostrarTeclado] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(1);
  const [isCapslock, setIsCapslock] = useState(false);

  const [veioDosCards, setVeioDosCards] = useState(false);
  const [caminhoDeVolta, setCaminhoDeVolta] = useState('/board/main');

  const [fraseOriginal, setFraseOriginal] = useState(() => {
    return getFraseFromRedux();
  });

  const [textoDigitado, setTextoDigitado] = useState(() => {
    const frase = getFraseFromRedux();
    return frase ? frase + ' ' : '';
  });

  const [historico, setHistorico] = useState(() => {
    const salvo = localStorage.getItem('historicoFrases');
    return salvo ? JSON.parse(salvo) : [];
  });

  useEffect(
    () => {
      if (location.state && typeof location.state.frasePronta === 'string') {
        const textoInicial = location.state.frasePronta
          ? location.state.frasePronta + ' '
          : '';
        setFraseOriginal(location.state.frasePronta);
        setCaminhoDeVolta(location.state.returnPath || '/board/main');
        setTextoDigitado(textoInicial);
        setMostrarTeclado(true);
        setVeioDosCards(true);
        history.replace({ ...location, state: undefined });
      }
    },
    [location, history]
  );

  const falarFrase = (texto, salvar = true) => {
    if (!texto || texto.trim() === '') return;

    dispatch(cancelSpeech());
    dispatch(speak(texto));

    if (salvar) {
      setHistorico(prev => {
        const textoLimpo = texto.trim();
        if (prev.length > 0 && prev[0] === textoLimpo) return prev;
        const novoHistorico = [textoLimpo, ...prev].slice(0, 10);
        localStorage.setItem('historicoFrases', JSON.stringify(novoHistorico));
        return novoHistorico;
      });
    }
  };

  const removerFrase = indexParaRemover => {
    const novoHistorico = historico.filter((_, i) => i !== indexParaRemover);
    setHistorico(novoHistorico);
    localStorage.setItem('historicoFrases', JSON.stringify(novoHistorico));

    if (novoHistorico.length === 0) {
      setLinhaSel(layoutTeclado.length - 1);
      setColSel(0);
    } else if (linhaSel >= layoutTeclado.length + novoHistorico.length) {
      setLinhaSel(linhaSel - 1);
      setColSel(0);
    } else {
      setColSel(0);
    }
  };

  const irParaCards = () => {
    history.push({
      pathname: '/board/cards',
      state: {
        textoFinal: textoDigitado.trim(),
        fraseAntiga: fraseOriginal.trim()
      }
    });
  };

  const fecharTeclado = () => {
    if (veioDosCards) {
      history.push({
        pathname: caminhoDeVolta,
        state: {
          textoFinal: textoDigitado.trim(),
          fraseAntiga: fraseOriginal.trim()
        }
      });
    } else {
      setMostrarTeclado(false);
      setLinhaSel(0);
    }
  };

  const [linhaSel, setLinhaSel] = useState(0);
  const [colSel, setColSel] = useState(0);
  const [topoColSel, setTopoColSel] = useState(0);
  const lastEnterTime = useRef(0);

  useEffect(
    () => {
      if (linhaSel >= layoutTeclado.length) {
        const indexHist = linhaSel - layoutTeclado.length;
        const el = document.getElementById(`hist-item-${indexHist}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    },
    [linhaSel]
  );

  const handleTeclaClick = (lIndex, cIndex, tecla) => {
    setLinhaSel(lIndex);
    setColSel(cIndex);
    setTopoColSel(0);

    if (tecla === 'CAPS') {
      setIsCapslock(prev => !prev);
    } else if (tecla === 'ESPAÇO') {
      setTextoDigitado(prev => prev + ' ');
    } else if (tecla === 'APAGAR') {
      setTextoDigitado(prev => prev.slice(0, -1));
    } else {
      const caractere =
        !isCapslock && /^[A-ZÇ]$/.test(tecla) ? tecla.toLowerCase() : tecla;
      setTextoDigitado(prev => prev + caractere);
    }
  };

  useEffect(
    () => {
      const handleKeyDown = event => {
        if (
          ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Enter'].includes(
            event.key
          )
        ) {
          event.preventDefault();
        }

        if (mostrarTeclado) {
          // === NOVOS ATALHOS DO ARDUINO PARA O TECLADO ===
          if (event.key.toLowerCase() === 'v') {
            event.preventDefault();
            fecharTeclado();
            return;
          }
          if (event.key.toLowerCase() === 'f') {
            event.preventDefault();
            falarFrase(textoDigitado);
            return;
          }
          if (event.key === 'Backspace') {
            event.preventDefault();
            setTextoDigitado(prev => prev.slice(0, -1)); // Apaga a última letra
            return;
          }
          // ================================================

          const historyRowsStart = layoutTeclado.length;
          const maxLinha = historyRowsStart + historico.length - 1;

          if (event.key === 'ArrowUp') {
            if (linhaSel === -1) {
              if (topoColSel === 1) {
                setTopoColSel(0);
              } else {
                if (historico.length > 0) {
                  setLinhaSel(maxLinha);
                  setColSel(0);
                } else {
                  setLinhaSel(layoutTeclado.length - 1);
                  setColSel(0);
                }
              }
            } else if (linhaSel === 0) {
              setLinhaSel(-1);
              setTopoColSel(1);
            } else if (linhaSel === historyRowsStart) {
              setLinhaSel(historyRowsStart - 1);
              setColSel(0);
            } else {
              const novaLinha = linhaSel - 1;
              setLinhaSel(novaLinha);
              if (novaLinha < historyRowsStart) {
                setColSel(prev =>
                  Math.min(prev, layoutTeclado[novaLinha].length - 1)
                );
              }
            }
          } else if (event.key === 'ArrowDown') {
            if (linhaSel === -1) {
              if (topoColSel === 0) {
                setTopoColSel(1);
              } else {
                setLinhaSel(0);
                setColSel(0);
              }
            } else if (linhaSel === historyRowsStart - 1) {
              if (historico.length > 0) {
                setLinhaSel(historyRowsStart);
                setColSel(0);
              } else {
                setLinhaSel(-1);
                setTopoColSel(0);
              }
            } else if (linhaSel >= historyRowsStart && linhaSel < maxLinha) {
              setLinhaSel(linhaSel + 1);
              setColSel(0);
            } else if (linhaSel === maxLinha) {
              setLinhaSel(-1);
              setTopoColSel(0);
            } else {
              const novaLinha = linhaSel + 1;
              setLinhaSel(novaLinha);
              if (novaLinha < historyRowsStart) {
                setColSel(prev =>
                  Math.min(prev, layoutTeclado[novaLinha].length - 1)
                );
              }
            }
          } else if (event.key === 'ArrowLeft') {
            if (linhaSel === -1) {
              setTopoColSel(prev => (prev === 1 ? 0 : 1));
            } else if (linhaSel >= historyRowsStart) {
              setColSel(prev => (prev === 0 ? 1 : 0));
            } else {
              const totalColunas = layoutTeclado[linhaSel].length;
              setColSel(prev => (prev > 0 ? prev - 1 : totalColunas - 1));
            }
          } else if (event.key === 'ArrowRight') {
            if (linhaSel === -1) {
              setTopoColSel(prev => (prev === 0 ? 1 : 0));
            } else if (linhaSel >= historyRowsStart) {
              setColSel(prev => (prev === 0 ? 1 : 0));
            } else {
              const totalColunas = layoutTeclado[linhaSel].length;
              setColSel(prev => (prev < totalColunas - 1 ? prev + 1 : 0));
            }
          } else if (event.key === 'Enter') {
            if (linhaSel === -1) {
              if (topoColSel === 0) fecharTeclado();
              else if (topoColSel === 1) falarFrase(textoDigitado);
            } else if (linhaSel >= historyRowsStart) {
              const indexHistorico = linhaSel - historyRowsStart;
              if (colSel === 0) {
                falarFrase(historico[indexHistorico], false);
              } else if (colSel === 1) {
                removerFrase(indexHistorico);
              }
            } else {
              const tecla = layoutTeclado[linhaSel][colSel];
              handleTeclaClick(linhaSel, colSel, tecla);
            }
          }
          return;
        }

        if (event.key === 'Enter') {
          const agora = Date.now();
          if (agora - lastEnterTime.current < 400) return;
          lastEnterTime.current = agora;

          if (focusedIndex === 0) {
            history.push('/settings/configuracoes');
          } else if (focusedIndex === 1) {
            setMostrarTeclado(true);
            setLinhaSel(0);
            setColSel(0);
            setTopoColSel(0);
          } else if (focusedIndex === 2) {
            irParaCards();
          }
        } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
          setFocusedIndex(prevIndex => (prevIndex < 2 ? prevIndex + 1 : 0));
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
          setFocusedIndex(prevIndex => (prevIndex > 0 ? prevIndex - 1 : 2));
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    },
    [
      mostrarTeclado,
      focusedIndex,
      linhaSel,
      colSel,
      topoColSel,
      textoDigitado,
      history,
      isCapslock,
      veioDosCards,
      fraseOriginal,
      caminhoDeVolta,
      historico
    ]
  );

  const getButtonStyle = index => {
    const isFocused = focusedIndex === index;
    return isFocused
      ? {
          outline: '6px solid #0055ff',
          outlineOffset: '4px',
          borderRadius: '5px',
          transform: 'scale(1.05)',
          transition: '0.2s',
          zIndex: 10
        }
      : { transition: '0.2s' };
  };

  return (
    <div className="home-container">
      <style>
        {`
          .historico-scrollbar::-webkit-scrollbar { width: 8px; }
          .historico-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.4); border-radius: 10px; }
          .historico-scrollbar::-webkit-scrollbar-thumb { background: #0a2540; border-radius: 10px; }
          .historico-scrollbar::-webkit-scrollbar-thumb:hover { background: #0056b3; }
        `}
      </style>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px',
          marginBottom: '60px'
        }}
      >
        <img
          src={iconeCadeira}
          alt="Ícone Cadeira de Rodas"
          style={{
            width: '100px',
            height: 'auto',
            filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.15))'
          }}
        />
        <h1 className="home-title" style={{ margin: 0 }}>
          Controle Total
        </h1>
      </div>

      <Button
        variant="contained"
        startIcon={<SettingsIcon />}
        onClick={() => history.push('/settings/configuracoes')}
        style={{
          position: 'fixed',
          top: '30px',
          left: '30px',
          zIndex: 9999,
          border: focusedIndex === 0 ? '4px solid #ffcc00' : 'none',
          transform: focusedIndex === 0 ? 'scale(1.1)' : 'scale(1)',
          transition: 'all 0.1s ease',
          backgroundColor: '#00bcd4',
          color: '#ffffff',
          borderRadius: '50px',
          padding: '12px 25px',
          fontSize: '1.2rem',
          textTransform: 'none',
          boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)'
        }}
      >
        Configurações
      </Button>

      <div className="home-button-group">
        <Button
          variant="contained"
          className="home-button"
          startIcon={<KeyboardIcon />}
          onClick={() => {
            setMostrarTeclado(true);
            setLinhaSel(0);
            setColSel(0);
            setTopoColSel(0);
          }}
          style={getButtonStyle(1)}
        >
          Teclado
        </Button>
        <Button
          variant="contained"
          className="home-button"
          startIcon={<VolumeUpIcon />}
          onClick={irParaCards}
          style={getButtonStyle(2)}
        >
          Cards
        </Button>
      </div>

      {mostrarTeclado && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            overflowY: 'auto',
            background: 'linear-gradient(180deg, #a2e9f3 0%, #76d7e5 100%)',
            zIndex: 999999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '20px'
          }}
        >
          <button
            onClick={fecharTeclado}
            style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              padding: '12px 24px',
              fontSize: '16px',
              cursor: 'pointer',
              borderRadius: '6px',
              border:
                linhaSel === -1 && topoColSel === 0
                  ? '4px solid #ffcc00'
                  : '4px solid transparent',
              backgroundColor:
                linhaSel === -1 && topoColSel === 0 ? '#0056b3' : '#ffffff',
              color:
                linhaSel === -1 && topoColSel === 0 ? '#ffffff' : '#0a2540',
              transform: 'none',
              transition: 'all 0.1s ease',
              fontWeight: 'bold',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
          >
            ← Voltar
          </button>

          <h2
            style={{
              marginBottom: '20px',
              marginTop: '40px',
              color: '#0a2540',
              fontSize: '32px',
              fontWeight: '900',
              textShadow: '1px 1px 3px rgba(0,0,0,0.15)'
            }}
          >
            Teclado Interativo
          </h2>

          <div
            style={{
              display: 'flex',
              gap: '12px',
              width: '90%',
              maxWidth: '800px',
              marginBottom: '25px',
              alignItems: 'center'
            }}
          >
            <div
              style={{
                flex: 1,
                backgroundColor: '#ffffff',
                color: '#000000',
                fontSize: '28px',
                padding: '15px',
                borderRadius: '8px',
                minHeight: '50px',
                textAlign: 'center',
                wordBreak: 'break-word',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
            >
              {textoDigitado || (
                <span style={{ color: '#aaaaaa', fontSize: '20px' }}>
                  Use as setas para navegar e Enter para digitar...
                </span>
              )}
            </div>
            <button
              onClick={() => falarFrase(textoDigitado)}
              style={{
                padding: '15px 25px',
                fontSize: '20px',
                cursor: 'pointer',
                borderRadius: '8px',
                border:
                  linhaSel === -1 && topoColSel === 1
                    ? '4px solid #ffcc00'
                    : '4px solid transparent',
                backgroundColor:
                  linhaSel === -1 && topoColSel === 1 ? '#0056b3' : '#28a745',
                color: '#ffffff',
                transform: 'none',
                transition: 'all 0.1s ease',
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
            >
              🔊 Falar
            </button>
          </div>

          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
          >
            {layoutTeclado.map((linha, lIndex) => (
              <div
                key={lIndex}
                style={{
                  display: 'flex',
                  gap: '8px',
                  justifyContent: 'center'
                }}
              >
                {linha.map((tecla, cIndex) => {
                  const estaSelecionada =
                    linhaSel === lIndex && colSel === cIndex;
                  let labelTecla = tecla;
                  if (tecla === 'CAPS')
                    labelTecla = isCapslock ? '⬆ MAIÚS' : '⬇ minús';
                  else if (!isCapslock && /^[A-ZÇ]$/.test(tecla))
                    labelTecla = tecla.toLowerCase();

                  return (
                    <button
                      key={cIndex}
                      onClick={() => handleTeclaClick(lIndex, cIndex, tecla)}
                      style={{
                        padding: '12px 18px',
                        fontSize: '18px',
                        borderRadius: '6px',
                        border: estaSelecionada
                          ? '4px solid #ffcc00'
                          : '4px solid transparent',
                        backgroundColor: estaSelecionada
                          ? '#0056b3'
                          : '#ffffff',
                        color: estaSelecionada ? '#ffffff' : '#0a2540',
                        transition: 'all 0.1s ease',
                        fontWeight: estaSelecionada ? 'bold' : 'normal',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        cursor: 'pointer'
                      }}
                    >
                      {labelTecla}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div
            style={{
              width: '90%',
              maxWidth: '800px',
              backgroundColor: 'rgba(255, 255, 255, 0.65)',
              borderRadius: '16px',
              padding: '20px',
              marginTop: '25px',
              marginBottom: '20px',
              boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '15px',
                color: '#0a2540'
              }}
            >
              <HistoryIcon fontSize="large" />
              <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '900' }}>
                Frases Rápidas
              </h3>
            </div>

            <div
              className="historico-scrollbar"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                maxHeight: '180px',
                overflowY: 'auto',
                paddingRight: '10px'
              }}
            >
              {historico.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    color: '#0a2540',
                    fontStyle: 'italic',
                    padding: '20px 0',
                    fontSize: '18px',
                    fontWeight: 'bold'
                  }}
                >
                  Suas frases salvas aparecerão aqui depois que você falar.
                </div>
              ) : (
                historico.map((frase, index) => {
                  const isHistRow = linhaSel === layoutTeclado.length + index;
                  const isSpeakSelected = isHistRow && colSel === 0;
                  const isDeleteSelected = isHistRow && colSel === 1;

                  return (
                    <div
                      key={index}
                      id={`hist-item-${index}`}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 20px',
                        backgroundColor: isHistRow ? '#f0f8ff' : '#ffffff',
                        borderRadius: '12px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                        transition: 'all 0.1s ease'
                      }}
                    >
                      <span
                        style={{
                          fontSize: '18px',
                          fontWeight: 'bold',
                          color: '#0a2540',
                          flex: 1,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          marginRight: '15px'
                        }}
                      >
                        {frase}
                      </span>

                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            falarFrase(frase, false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '8px 16px',
                            backgroundColor: isSpeakSelected
                              ? '#0056b3'
                              : '#e0f7fa',
                            color: isSpeakSelected ? '#ffffff' : '#0056b3',
                            border: isSpeakSelected
                              ? '4px solid #ffcc00'
                              : '4px solid transparent',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            transition: 'all 0.1s ease'
                          }}
                        >
                          <VolumeUpIcon style={{ marginRight: '5px' }} /> Falar
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            removerFrase(index);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '8px 12px',
                            backgroundColor: isDeleteSelected
                              ? '#d32f2f'
                              : '#ffebee',
                            color: isDeleteSelected ? '#ffffff' : '#d32f2f',
                            border: isDeleteSelected
                              ? '4px solid #ffcc00'
                              : '4px solid transparent',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.1s ease'
                          }}
                        >
                          <DeleteIcon />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const mapStateToProps = state => ({
  output: state.board ? state.board.output : []
});

export default connect(mapStateToProps)(Home);
