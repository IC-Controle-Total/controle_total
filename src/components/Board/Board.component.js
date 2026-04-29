import React, { Component } from 'react';
import PropTypes from 'prop-types';
import keycode from 'keycode';
import classNames from 'classnames';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import { Scanner, Scannable } from 'react-scannable';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Alert from '@material-ui/lab/Alert';

import FixedGrid from '../FixedGrid';
import Grid from '../Grid';
import Symbol from './Symbol';
import OutputContainer from './Output';
import Navbar from './Navbar';
import EditToolbar from './EditToolbar';
import Tile from './Tile';
import EmptyBoard from './EmptyBoard';
import CommunicatorToolbar from '../Communicator/CommunicatorToolbar';
import { DISPLAY_SIZE_GRID_COLS } from '../Settings/Display/Display.constants';
import NavigationButtons from '../NavigationButtons';
import EditGridButtons from '../EditGridButtons';
import { DEFAULT_ROWS_NUMBER, DEFAULT_COLUMNS_NUMBER } from './Board.constants';

import { Link } from 'react-router-dom';

import messages from './Board.messages';

import './Board.css';
import BoardTour from './BoardTour/BoardTour';
import ScrollButtons from '../ScrollButtons';
import { NAVIGATION_BUTTONS_STYLE_SIDES } from '../Settings/Navigation/Navigation.constants';
import ImprovePhraseOutput from './ImprovePhraseOutput';
import { resolveTileLabel, resolveBoardName } from '../../helpers';

export class Board extends Component {
  static propTypes = {
    board: PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      tiles: PropTypes.arrayOf(PropTypes.object)
    }),
    className: PropTypes.string,
    disableBackButton: PropTypes.bool,
    onDeleteClick: PropTypes.func,
    onFocusTile: PropTypes.func,
    onTileClick: PropTypes.func,
    onSaveBoardClick: PropTypes.func,
    editBoardTitle: PropTypes.func,
    onLockNotify: PropTypes.func,
    onScannerActive: PropTypes.func,
    onRequestPreviousBoard: PropTypes.func,
    onRequestToRootBoard: PropTypes.func,
    selectedTileIds: PropTypes.arrayOf(PropTypes.string),
    displaySettings: PropTypes.object,
    navigationSettings: PropTypes.object,
    scannerSettings: PropTypes.object,
    userData: PropTypes.object,
    deactivateScanner: PropTypes.func,
    navHistory: PropTypes.arrayOf(PropTypes.string),
    emptyVoiceAlert: PropTypes.bool,
    offlineVoiceAlert: PropTypes.bool,
    onBoardTypeChange: PropTypes.func,
    isFixedBoard: PropTypes.bool,
    onAddRemoveColumn: PropTypes.func,
    onAddRemoveRow: PropTypes.func,
    onLayoutChange: PropTypes.func,
    isRootBoardTourEnabled: PropTypes.bool,
    isUnlockedTourEnabled: PropTypes.bool,
    disableTour: PropTypes.func,
    copiedTiles: PropTypes.arrayOf(PropTypes.object),
    setIsScroll: PropTypes.func,
    isScroll: PropTypes.bool,
    totalRows: PropTypes.number
  };

  static defaultProps = {
    displaySettings: {
      uiSize: 'Standard',
      labelPosition: 'Below',
      shareShowActive: false,
      hideOutputActive: false
    },
    navigationSettings: {},
    scannerSettings: { active: false, delay: 2000, strategy: 'automatic' },
    selectedTileIds: [],
    emptyVoiceAlert: false,
    userData: {}
  };

  constructor(props) {
    super(props);

    this.state = {
      openTitleDialog: false,
      titleDialogValue: props.board && props.board.name ? props.board.name : '',
      arduinoZone: 2, // 0 = Branca, 1 = Preta, 2 = Grade
      arduinoTopIndex: 0, // Qual botão das barras está focado
      arduinoFocusedIndex: 0 // Estado para o Teclado/Arduino saber qual card está selecionado
    };

    this.boardContainerRef = React.createRef();
    this.fixedBoardContainerRef = React.createRef();
  }

  componentDidMount() {
    if (this.props.scannerSettings.active) {
      this.props.onScannerActive();
    }
    // Liga a audição do teclado (Arduino) quando a tela carrega
    window.addEventListener('keydown', this.handleArduinoKeys);
  }

  componentWillUnmount() {
    // Desliga a audição do teclado se o usuário sair da prancha
    window.removeEventListener('keydown', this.handleArduinoKeys);
  }

  // ==== MÁGICA DA NAVEGAÇÃO MULTI-ZONAS DO ARDUINO ====
  handleArduinoKeys = event => {
    if (this.props.isSelecting || this.state.openTitleDialog) return;

    // Bloqueia a barra de rolagem nativa para TODAS as setas
    if (
      ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(event.key)
    ) {
      event.preventDefault();
    }

    let { arduinoZone, arduinoTopIndex, arduinoFocusedIndex } = this.state;
    const { board } = this.props;

    // Placas de identificação (IDs)
    const zone0Buttons = ['btn-limpar', 'btn-falar', 'btn-apagar-um']; // Zona 0: Barra Branca
    const zone1Buttons = ['btn-home', 'btn-tela-cheia']; // Zona 1: Barra Preta

    // Injeta visual azul nos botões do topo
    const updateTopVisuals = (zone, index) => {
      [...zone0Buttons, ...zone1Buttons].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.style.outline = 'none';
          el.style.transform = 'none';
        }
      });

      let activeId = null;
      if (zone === 0) activeId = zone0Buttons[index];
      if (zone === 1) activeId = zone1Buttons[index];

      if (activeId) {
        const activeEl = document.getElementById(activeId);
        if (activeEl) {
          // === NOSSA NOVA REGRA EXCLUSIVA PARA A TELA CHEIA ===
          if (activeId === 'btn-tela-cheia') {
            activeEl.style.outline = '4px solid #0055ff'; // Borda um pouco mais fina
            activeEl.style.outlineOffset = '-4px'; // O SEGREDO: Joga a borda pra DENTRO do botão!
            activeEl.style.borderRadius = '5px';
            activeEl.style.transform = 'none'; // Não deixa o botão crescer pra não vazar da tela
          } else {
            // Regra padrão para os outros botões da barra branca e preta
            activeEl.style.outline = '6px solid #0055ff';
            activeEl.style.outlineOffset = '2px';
            activeEl.style.borderRadius = '5px';
            activeEl.style.transform = 'scale(1.05)';
          }

          activeEl.style.transition = '0.2s';
        }
      }
    };

    // --- ZONA 2: A GRADE DE CARDS ---
    if (arduinoZone === 2) {
      updateTopVisuals(2, 0); // Limpa as barras de cima
      const tiles = board ? board.tiles : [];
      if (!tiles || tiles.length === 0) return;

      let colsCount = 6;
      if (board.isFixed && board.grid)
        colsCount = parseInt(board.grid.columns, 10);
      const maxIndex = tiles.length - 1;

      if (event.key === 'ArrowRight') {
        arduinoFocusedIndex =
          arduinoFocusedIndex + 1 > maxIndex ? 0 : arduinoFocusedIndex + 1;
      } else if (event.key === 'ArrowLeft') {
        arduinoFocusedIndex =
          arduinoFocusedIndex - 1 < 0 ? maxIndex : arduinoFocusedIndex - 1;
      } else if (event.key === 'ArrowDown') {
        let nextIndex = arduinoFocusedIndex + colsCount;
        arduinoFocusedIndex = nextIndex > maxIndex ? maxIndex : nextIndex;
      } else if (event.key === 'ArrowUp') {
        let prevIndex = arduinoFocusedIndex - colsCount;
        if (prevIndex < 0) {
          // Passou do teto? Sobe pra Barra Preta!
          this.setState({ arduinoZone: 1, arduinoTopIndex: 0 });
          updateTopVisuals(1, 0);
          return;
        } else {
          arduinoFocusedIndex = prevIndex;
        }
      } else if (event.key === 'Enter') {
        const tileToClick = tiles[arduinoFocusedIndex];
        if (tileToClick) {
          this.handleTileClick(tileToClick);
          if (tileToClick.loadBoard)
            this.setState({ arduinoFocusedIndex: 0, arduinoZone: 2 });
        }
      }
      this.setState({ arduinoFocusedIndex });
    }
    // --- ZONA 1: BARRA PRETA ---
    else if (arduinoZone === 1) {
      if (event.key === 'ArrowDown') {
        this.setState({ arduinoZone: 2 }); // Desce pra Grade
        updateTopVisuals(2, 0);
      } else if (event.key === 'ArrowUp') {
        this.setState({ arduinoZone: 0, arduinoTopIndex: 0 }); // Sobe pra Barra Branca
        updateTopVisuals(0, 0);
      } else if (event.key === 'ArrowRight') {
        arduinoTopIndex = (arduinoTopIndex + 1) % zone1Buttons.length;
        this.setState({ arduinoTopIndex });
        updateTopVisuals(1, arduinoTopIndex);
      } else if (event.key === 'ArrowLeft') {
        arduinoTopIndex =
          arduinoTopIndex - 1 < 0
            ? zone1Buttons.length - 1
            : arduinoTopIndex - 1;
        this.setState({ arduinoTopIndex });
        updateTopVisuals(1, arduinoTopIndex);
      } else if (event.key === 'Enter') {
        const btn = document.getElementById(zone1Buttons[arduinoTopIndex]);
        if (btn) btn.click();
      }
    }
    // --- ZONA 0: BARRA BRANCA ---
    else if (arduinoZone === 0) {
      if (event.key === 'ArrowDown') {
        this.setState({ arduinoZone: 1, arduinoTopIndex: 0 }); // Desce pra Barra Preta
        updateTopVisuals(1, 0);
      } else if (event.key === 'ArrowRight') {
        arduinoTopIndex = (arduinoTopIndex + 1) % zone0Buttons.length;
        this.setState({ arduinoTopIndex });
        updateTopVisuals(0, arduinoTopIndex);
      } else if (event.key === 'ArrowLeft') {
        arduinoTopIndex =
          arduinoTopIndex - 1 < 0
            ? zone0Buttons.length - 1
            : arduinoTopIndex - 1;
        this.setState({ arduinoTopIndex });
        updateTopVisuals(0, arduinoTopIndex);
      } else if (event.key === 'Enter') {
        const btn = document.getElementById(zone0Buttons[arduinoTopIndex]);
        if (btn) btn.click();
      }
    }
  };

  handleTileClick = tile => {
    const { onTileClick, isSelecting } = this.props;

    if (tile.loadBoard && !isSelecting) {
      const boardComponentRef = this.props.board.isFixed
        ? 'fixedBoardContainerRef'
        : 'boardContainerRef';
      this[boardComponentRef].current.scrollTop = 0;
    }
    onTileClick(tile);
  };

  handleTileFocus = tileId => {
    const { onFocusTile, board } = this.props;
    onFocusTile(tileId, board.id);
  };

  handleBoardKeyUp = event => {
    const { onRequestPreviousBoard } = this.props;

    if (event.keyCode === keycode('esc')) {
      onRequestPreviousBoard();
    }
  };

  handleBoardTitleClick = () => {
    if (!this.props.userData.email) {
      return false;
    }
    this.setState({
      openTitleDialog: true,
      titleDialogValue: this.props.board.name
    });
  };

  handleBoardTitleChange = event => {
    const { value: titleDialogValue } = event.target;
    this.setState({ titleDialogValue });
  };

  handleBoardTitleSubmit = async () => {
    if (this.state.titleDialogValue.length) {
      try {
        await this.props.editBoardTitle(this.state.titleDialogValue);
      } catch (e) {}
    }
    this.handleBoardTitleClose();
  };

  handleBoardTitleClose = () => {
    this.setState({
      openTitleDialog: false,
      titleDialogValue: this.props.board.name || this.props.board.id || ''
    });
  };

  renderTiles(tiles) {
    const {
      isSelecting,
      isSaving,
      selectedTileIds,
      displaySettings
    } = this.props;

    const focusedIndex = this.state.arduinoFocusedIndex || 0;

    return tiles.map((tileToRender, index) => {
      const tile = {
        ...tileToRender,
        label: resolveTileLabel(tileToRender, this.props.intl)
      };
      const isSelected = selectedTileIds.includes(tile.id);
      const variant = Boolean(tile.loadBoard) ? 'folder' : 'button';

      // Checa se este card é o que está sendo mirado pelo Arduino
      const isArduinoFocused =
        focusedIndex === index && !isSelecting && this.state.arduinoZone === 2;

      // Visual agressivo para o Cboard não conseguir esconder:
      const tileStyle = isArduinoFocused
        ? {
            transform: 'scale(1.05)',
            transition: '0.2s',
            zIndex: 999,
            position: 'relative',
            outline: '6px solid #0055ff' /* Azul forte e grosso! */,
            outlineOffset:
              '2px' /* Joga a linha um pouquinho pra fora do card */,
            borderRadius: '5px'
          }
        : { transition: '0.2s' };

      return (
        <div key={tile.id}>
          <Tile
            style={tileStyle}
            backgroundColor={tile.backgroundColor}
            borderColor={isArduinoFocused ? '#0000FF' : tile.borderColor} // Borda Azul se focado
            variant={variant}
            onClick={e => {
              e.stopPropagation();
              this.handleTileClick(tile);
            }}
            onFocus={() => {
              this.handleTileFocus(tile.id);
            }}
          >
            <Symbol
              image={tile.image}
              label={tile.label}
              keyPath={tile.keyPath}
              labelpos={displaySettings.labelPosition}
            />

            {isSelecting && !isSaving && (
              <div className="CheckCircle">
                {isSelected && (
                  <CheckCircleIcon className="CheckCircle__icon" />
                )}
              </div>
            )}
          </Tile>
        </div>
      );
    });
  }

  renderTileFixedBoard = tileToRender => {
    const tile = {
      ...tileToRender,
      label: resolveTileLabel(tileToRender, this.props.intl)
    };
    const {
      isSelecting,
      isSaving,
      selectedTileIds,
      displaySettings,
      board
    } = this.props;

    const isSelected = selectedTileIds.includes(tile.id);
    const variant = Boolean(tile.loadBoard) ? 'folder' : 'button';

    // Acha o Index deste card para pranchas fixas
    const index = board.tiles.findIndex(t => t.id === tile.id);
    const focusedIndex = this.state.arduinoFocusedIndex || 0;
    const isArduinoFocused = focusedIndex === index && !isSelecting;

    const tileStyle = isArduinoFocused
      ? {
          transform: 'scale(1.05)',
          transition: '0.2s',
          zIndex: 10,
          position: 'relative',
          boxShadow: '0 0 15px rgba(0,0,255,0.6)'
        }
      : { transition: '0.2s' };

    return (
      <Tile
        style={tileStyle}
        backgroundColor={tile.backgroundColor}
        borderColor={isArduinoFocused ? '#0000FF' : tile.borderColor}
        variant={variant}
        onClick={e => {
          e.stopPropagation();
          this.handleTileClick(tile);
        }}
        onFocus={() => {
          this.handleTileFocus(tile.id);
        }}
        id={tile.id}
      >
        <Symbol
          image={tile.image}
          label={tile.label}
          keyPath={tile.keyPath}
          labelpos={displaySettings.labelPosition}
        />

        {isSelecting && !isSaving && (
          <div className="CheckCircle">
            {isSelected && <CheckCircleIcon className="CheckCircle__icon" />}
          </div>
        )}
      </Tile>
    );
  };

  render() {
    const {
      board,
      intl,
      userData,
      disableBackButton,
      isLocked,
      isSaving,
      isSelectAll,
      isSelecting,
      isFixedBoard,
      onAddClick,
      onDeleteClick,
      onEditClick,
      onSaveBoardClick,
      onSelectAllToggle,
      onSelectClick,
      onLockClick,
      onLockNotify,
      onRequestPreviousBoard,
      onRequestToRootBoard,
      onBoardTypeChange,
      selectedTileIds,
      navigationSettings,
      deactivateScanner,
      publishBoard,
      emptyVoiceAlert,
      offlineVoiceAlert,
      onAddRemoveRow,
      onAddRemoveColumn,
      onTileDrop,
      onLayoutChange,
      isRootBoardTourEnabled,
      isUnlockedTourEnabled,
      disableTour,
      onCopyTiles,
      onPasteTiles,
      setIsScroll,
      isScroll,
      totalRows,
      changeDefaultBoard,
      improvedPhrase,
      speak
    } = this.props;

    const tiles = this.renderTiles(board.tiles);
    const cols = DISPLAY_SIZE_GRID_COLS[this.props.displaySettings.uiSize];
    const isLoggedIn = !!userData.email;
    const isNavigationButtonsOnTheSide =
      navigationSettings.navigationButtonsStyle === undefined ||
      navigationSettings.navigationButtonsStyle ===
        NAVIGATION_BUTTONS_STYLE_SIDES;

    return (
      <Scanner
        active={this.props.scannerSettings.active}
        iterationInterval={this.props.scannerSettings.delay}
        strategy={this.props.scannerSettings.strategy}
        onDeactivation={deactivateScanner}
      >
        <div
          className={classNames('Board', {
            'is-locked': this.props.isLocked
          })}
        >
          <BoardTour
            isLocked={isLocked}
            isRootBoardTourEnabled={isRootBoardTourEnabled}
            isUnlockedTourEnabled={isUnlockedTourEnabled}
            disableTour={disableTour}
            intl={intl}
            onDefaultBoardOptionClick={changeDefaultBoard}
          />
          <Scannable>
            <div
              className={classNames('Board__output', {
                hidden: this.props.displaySettings.hideOutputActive
              })}
            >
              <OutputContainer />
            </div>
          </Scannable>

          <Navbar
            className="Board__navbar"
            disabled={disableBackButton || isSelecting || isSaving}
            isLocked={isLocked}
            isScannerActive={this.props.scannerSettings.active}
            onBackClick={onRequestPreviousBoard}
            onLockClick={onLockClick}
            onDeactivateScannerClick={deactivateScanner}
            onLockNotify={onLockNotify}
            title={resolveBoardName(board, intl)}
            board={board}
            userData={userData}
            publishBoard={publishBoard}
            showNotification={this.props.showNotification}
          />
          {emptyVoiceAlert && (
            <Alert variant="filled" severity="error">
              {intl.formatMessage(messages.emptyVoiceAlert)}
            </Alert>
          )}
          {offlineVoiceAlert && (
            <Alert
              variant="filled"
              severity="warning"
              action={
                <Button
                  size="small"
                  variant="outlined"
                  style={{ color: 'white', borderColor: 'white' }}
                  component={Link}
                  to="/settings/speech"
                >
                  {intl.formatMessage(messages.offlineChangeVoice)}
                </Button>
              }
            >
              {intl.formatMessage(messages.offlineVoiceAlert)}
            </Alert>
          )}

          <CommunicatorToolbar
            className="Board__communicator-toolbar"
            isSelecting={isSelecting || isSaving}
          />

          <EditToolbar
            board={board}
            onBoardTitleClick={this.handleBoardTitleClick}
            className="Board__edit-toolbar"
            isSelectAll={isSelectAll}
            isSelecting={isSelecting}
            isSaving={isSaving}
            isLoggedIn={isLoggedIn}
            onAddClick={onAddClick}
            isFixedBoard={isFixedBoard}
            onDeleteClick={onDeleteClick}
            onEditClick={onEditClick}
            onSaveBoardClick={onSaveBoardClick}
            onSelectAllToggle={onSelectAllToggle}
            onSelectClick={onSelectClick}
            selectedItemsCount={selectedTileIds.length}
            onBoardTypeChange={onBoardTypeChange}
            onCopyTiles={onCopyTiles}
            onPasteTiles={onPasteTiles}
            copiedTiles={this.props.copiedTiles}
          />
          <div className="BoardSideButtonsContainer">
            {navigationSettings.caBackButtonActive && (
              <NavigationButtons
                active={
                  navigationSettings.caBackButtonActive &&
                  !isSelecting &&
                  (!isSaving || isNavigationButtonsOnTheSide) &&
                  !this.props.scannerSettings.active
                }
                navHistory={this.props.navHistory}
                previousBoard={onRequestPreviousBoard}
                toRootBoard={onRequestToRootBoard}
                isSaving={isSaving}
                isNavigationButtonsOnTheSide={isNavigationButtonsOnTheSide}
              />
            )}
            <Scannable>
              <div
                id="BoardTilesContainer"
                className={classNames('Board__tiles', {
                  ScrollButtonsOnTheSides:
                    navigationSettings.bigScrollButtonsActive &&
                    isNavigationButtonsOnTheSide
                })}
                onKeyUp={this.handleBoardKeyUp}
                ref={this.boardContainerRef}
              >
                {!board.isFixed &&
                  (tiles.length ? (
                    <Grid
                      board={board}
                      edit={isSelecting && !isSaving}
                      cols={cols}
                      onLayoutChange={onLayoutChange}
                      setIsScroll={setIsScroll}
                      isBigScrollBtns={
                        navigationSettings.bigScrollButtonsActive
                      }
                    >
                      {tiles}
                    </Grid>
                  ) : (
                    <EmptyBoard />
                  ))}

                {board.isFixed && (
                  <FixedGrid
                    order={board.grid ? board.grid.order : []}
                    items={board.tiles}
                    columns={
                      board.grid ? board.grid.columns : DEFAULT_COLUMNS_NUMBER
                    }
                    rows={board.grid ? board.grid.rows : DEFAULT_ROWS_NUMBER}
                    dragAndDropEnabled={isSelecting}
                    renderItem={this.renderTileFixedBoard}
                    onItemDrop={onTileDrop}
                    fixedRef={this.fixedBoardContainerRef}
                    setIsScroll={setIsScroll}
                    isBigScrollBtns={navigationSettings.bigScrollButtonsActive}
                    isNavigationButtonsOnTheSide={isNavigationButtonsOnTheSide}
                  />
                )}

                <EditGridButtons
                  active={
                    isFixedBoard && isSelecting && !isSaving ? true : false
                  }
                  columns={
                    board.grid ? board.grid.columns : DEFAULT_COLUMNS_NUMBER
                  }
                  rows={board.grid ? board.grid.rows : DEFAULT_ROWS_NUMBER}
                  onAddRemoveRow={onAddRemoveRow}
                  onAddRemoveColumn={onAddRemoveColumn}
                  moveColsButtonToLeft={
                    navigationSettings.bigScrollButtonsActive &&
                    isNavigationButtonsOnTheSide
                  }
                />
              </div>
            </Scannable>

            {navigationSettings.bigScrollButtonsActive && (
              <ScrollButtons
                active={
                  navigationSettings.bigScrollButtonsActive &&
                  (!isSaving || isNavigationButtonsOnTheSide) &&
                  !this.props.scannerSettings.active &&
                  (isScroll || isNavigationButtonsOnTheSide)
                }
                isScroll={isScroll}
                isSaving={isSaving}
                boardContainer={
                  board.isFixed
                    ? this.fixedBoardContainerRef
                    : this.boardContainerRef
                }
                totalRows={totalRows}
                boardId={board.id}
                isNavigationButtonsOnTheSide={isNavigationButtonsOnTheSide}
              />
            )}
          </div>
          {navigationSettings.improvePhraseActive && (
            <ImprovePhraseOutput
              improvedPhrase={improvedPhrase}
              speak={speak}
            />
          )}
          <Dialog
            open={this.state.openTitleDialog}
            aria-labelledby="board-dialog-title"
            onSubmit={this.handleBoardTitleSubmit}
            onClose={this.handleBoardTitleClose}
          >
            <DialogTitle id="board-dialog-title">
              {intl.formatMessage(messages.editTitle)}
            </DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                id="board title"
                label={intl.formatMessage(messages.boardTitle)}
                type="text"
                fullWidth
                value={this.state.titleDialogValue}
                onChange={this.handleBoardTitleChange}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={this.handleBoardTitleClose} color="primary">
                {intl.formatMessage(messages.boardEditTitleCancel)}
              </Button>
              <Button
                onClick={this.handleBoardTitleSubmit}
                color="primary"
                variant="contained"
              >
                {intl.formatMessage(messages.boardEditTitleAccept)}
              </Button>
            </DialogActions>
          </Dialog>
        </div>
      </Scanner>
    );
  }
}

export default Board;
