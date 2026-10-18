import shortid from 'shortid';
import { resolveTileLabel } from '../../../helpers';
import { createBoard, createTile } from '../../Board/Board.actions';
import { addBoardCommunicator } from '../../Communicator/Communicator.actions';

// Mesmas cores usadas nos cards padrão da tela de Cards
export const CORES = [
  { nome: 'Azul', valor: 'rgb(187, 222, 251)' },
  { nome: 'Amarelo', valor: 'rgb(255, 241, 118)' },
  { nome: 'Verde', valor: 'rgb(200, 230, 201)' },
  { nome: 'Laranja', valor: 'rgb(255, 224, 178)' },
  { nome: 'Rosa', valor: 'rgb(248, 187, 208)' },
  { nome: 'Branco', valor: 'rgb(255, 255, 255)' }
];

export const obterRootBoardId = state => {
  const { communicators, activeCommunicatorId } = state.communicator;
  const communicator = communicators.find(c => c.id === activeCommunicatorId);
  return communicator ? communicator.rootBoard : 'root';
};

// Pastas que aparecem na tela inicial de Cards (padrão e personalizadas)
export const obterPastas = (state, intl) => {
  const rootBoardId = obterRootBoardId(state);
  const rootBoard = state.board.boards.find(b => b.id === rootBoardId);
  if (!rootBoard) return [];

  return rootBoard.tiles
    .filter(tile => tile.loadBoard)
    .map(tile => {
      const board = state.board.boards.find(b => b.id === tile.loadBoard);
      return board
        ? {
            tile,
            board,
            boardId: board.id,
            nome: resolveTileLabel(tile, intl) || board.name || 'Pasta'
          }
        : null;
    })
    .filter(Boolean);
};

// Cria o board da pasta e o card de pasta na tela inicial. Retorna o id do board.
export const criarPasta = (dispatch, rootBoardId, { nome, imagem, cor }) => {
  const boardId = shortid.generate();

  dispatch(
    createBoard({
      id: boardId,
      name: nome,
      tiles: [],
      isPublic: false,
      hidden: false,
      email: '',
      author: ''
    })
  );
  dispatch(addBoardCommunicator(boardId));
  dispatch(
    createTile(
      {
        id: shortid.generate(),
        label: nome,
        image: imagem,
        backgroundColor: cor,
        loadBoard: boardId,
        personalizado: true
      },
      rootBoardId
    )
  );

  return boardId;
};
