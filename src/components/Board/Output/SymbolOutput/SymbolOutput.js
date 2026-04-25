import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import ClearIcon from '@material-ui/icons/Clear';
import IconButton from '@material-ui/core/IconButton';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import Button from '@material-ui/core/Button';
import VolumeUpIcon from '@material-ui/icons/VolumeUp';
import Symbol from '../../Symbol';
import BackspaceButton from './BackspaceButton';
import ClearButton from './ClearButton';
import messages from '../../Board.messages';
import PhraseShare from '../PhraseShare';
/* import Scroll from './Scroll'; */
import './SymbolOutput.css';
import { injectIntl } from 'react-intl';

class SymbolOutput extends PureComponent {
  constructor(props) {
    super(props);
    this.scrollContainerRef = React.createRef();
    this.state = {
      openPhraseShareDialog: false
    };
  }

  onShareClick = () => {
    this.setState({ openPhraseShareDialog: true });
  };

  onShareClose = () => {
    this.setState({ openPhraseShareDialog: false });
  };

  handleSpeakPhrase = () => {
    const { symbols } = this.props;

    // Se não tiver nenhum card, não faz nada
    if (!symbols || symbols.length === 0) return;

    // Pega as palavras de cada card e junta tudo em uma frase com espaços
    const phraseText = symbols.map(card => card.label).join(' ');

    // Verifica se o navegador suporta a leitura de texto
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Corta qualquer fala que esteja rolando para não encavalar

      const utterance = new SpeechSynthesisUtterance(phraseText);
      utterance.lang = 'pt-BR'; // Força a voz em português brasileiro
      utterance.rate = 0.9; // Velocidade um pouquinho mais lenta pra ficar compreensível

      window.speechSynthesis.speak(utterance);
    }
  };

  static propTypes = {
    /**
     * Symbols to output
     */
    symbols: PropTypes.arrayOf(
      PropTypes.shape({
        /**
         * Image to display
         */
        image: PropTypes.string,
        /**
         * Label to display
         */
        label: PropTypes.oneOfType([PropTypes.string, PropTypes.node])
      })
    )
  };

  static defaultProps = {
    symbols: []
  };

  scrollToLastSymbol = () => {
    try {
      const lastOutputSymbol = this.scrollContainerRef.current
        ?.lastElementChild;

      if (lastOutputSymbol && lastOutputSymbol.scrollIntoView)
        lastOutputSymbol.scrollIntoView({
          inline: 'end'
        });
    } catch (err) {
      console.error('Error during autoScroll of output bar', err);
    }
  };

  componentDidMount() {
    this.scrollToLastSymbol();
  }

  componentDidUpdate(prevProps) {
    const { symbols } = this.props;
    if (prevProps.symbols.length < symbols.length) this.scrollToLastSymbol();
  }

  render() {
    const {
      intl,
      onBackspaceClick,
      onClearClick,
      getPhraseToShare,
      onCopyClick,
      onRemoveClick,
      onSwitchLiveMode,
      onWriteSymbol,
      symbols,
      navigationSettings,
      phrase,
      /* isLiveMode, */
      increaseOutputButtons,
      ...other
    } = this.props;

    const isLiveMode = false;

    const clearButtonStyle = {
      visibility: symbols.length ? 'visible' : 'hidden'
    };

    const copyButtonStyle = {
      visibility: symbols.length ? 'visible' : 'hidden'
    };

    const removeButtonStyle = {
      visibility: navigationSettings.removeOutputActive ? 'visible' : 'hidden'
    };

    const backspaceButtonStyle = {
      visibility: navigationSettings.removeOutputActive ? 'hidden' : 'visible'
    };

    return (
      <div className="SymbolOutput">
        {/* =======================================================
            1. ESQUERDA: Botão de Apagar Tudo isolado
            ======================================================= */}
        <div
          style={{ display: 'flex', alignItems: 'center', padding: '0 10px' }}
        >
          <ClearButton
            color="inherit"
            onClick={onClearClick}
            style={clearButtonStyle}
            hidden={!symbols.length}
            increaseOutputButtons={increaseOutputButtons}
          />
        </div>

        {/* =======================================================
            2. CENTRO: A nossa div dos Cards que rolam pra baixo
            ======================================================= */}
        <div
          className="SymbolOutput__cards-container"
          ref={this.scrollContainerRef}
          {...other}
        >
          {symbols.map(({ image, label, type, keyPath }, index) => (
            <div
              className={
                type === 'live'
                  ? 'LiveSymbolOutput__value'
                  : 'SymbolOutput__value'
              }
              key={index}
            >
              <Symbol
                className="SymbolOutput__symbol"
                image={image}
                keyPath={keyPath}
                label={label}
                type={'normal'}
                labelpos="Below"
                onWrite={onWriteSymbol(index)}
                intl={intl}
              />
              <div className="SymbolOutput__value__IconButton">
                <IconButton
                  color="inherit"
                  size={'small'}
                  onClick={onRemoveClick(index)}
                  disabled={!navigationSettings.removeOutputActive}
                  style={removeButtonStyle}
                >
                  <ClearIcon />
                </IconButton>
              </div>
            </div>
          ))}
        </div>

        {/* =======================================================
            3. DIREITA: Botão de Falar + Botão de Apagar Um
            ======================================================= */}
        <div
          style={{
            display: 'flex',
            marginLeft: 'auto',
            minWidth: 'fit-content',
            alignItems: 'center',
            paddingRight: '15px',
            gap: '15px' // Dá um espacinho entre o botão de falar e o de apagar
          }}
        >
          {/* NOSSO NOVO BOTÃO DE FALAR */}
          {symbols.length > 0 && (
            <Button
              variant="contained"
              onClick={this.handleSpeakPhrase}
              startIcon={<VolumeUpIcon />}
              style={{
                backgroundColor: '#4CAF50', // Verde bem chamativo e positivo
                color: 'white',
                fontWeight: 'bold',
                textTransform: 'none',
                height: '48px',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
              }}
            >
              Falar
            </Button>
          )}

          {!navigationSettings.removeOutputActive && (
            <BackspaceButton
              color="inherit"
              onClick={onBackspaceClick}
              style={backspaceButtonStyle}
              hidden={navigationSettings.removeOutputActive}
              increaseOutputButtons={increaseOutputButtons}
            />
          )}
        </div>
      </div>
    );
  }
}

export default injectIntl(SymbolOutput);
