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

// Pastas acessíveis na tela de Cards, incluindo subpastas em qualquer nível.
export const obterPastas = (state, intl) => {
  const rootBoardId = obterRootBoardId(state);
  const boardsById = new Map(
    state.board.boards.map(board => [board.id, board])
  );
  const rootBoard = boardsById.get(rootBoardId);
  if (!rootBoard) return [];

  const pastas = [];
  const visitados = new Set([rootBoardId]);

  const visitarBoard = (board, caminhoPai, ancestrais) => {
    (board.tiles || []).forEach(tile => {
      if (!tile.loadBoard || ancestrais.has(tile.loadBoard)) return;

      const pastaBoard = boardsById.get(tile.loadBoard);
      if (!pastaBoard || visitados.has(pastaBoard.id)) return;

      const nome = resolveTileLabel(tile, intl) || pastaBoard.name || 'Pasta';
      const caminho = [...caminhoPai, nome];
      pastas.push({
        tile,
        board: pastaBoard,
        boardId: pastaBoard.id,
        parentBoardId: board.id,
        nome,
        caminho,
        caminhoPai,
        profundidade: caminhoPai.length
      });

      visitados.add(pastaBoard.id);
      const novosAncestrais = new Set(ancestrais);
      novosAncestrais.add(pastaBoard.id);
      visitarBoard(pastaBoard, caminho, novosAncestrais);
    });
  };

  visitarBoard(rootBoard, [], new Set([rootBoardId]));
  return pastas;
};

// Retorna todos os boards de uma pasta e suas subpastas para exclusão em cascata.
export const obterConteudoDaPasta = (boards, boardId) => {
  const boardsById = new Map(boards.map(board => [board.id, board]));
  const boardIds = [];
  const visitados = new Set();
  let cards = 0;
  let subpastas = 0;

  const visitar = id => {
    if (visitados.has(id)) return;
    visitados.add(id);
    boardIds.push(id);

    const board = boardsById.get(id);
    (board?.tiles || []).forEach(tile => {
      if (!tile.loadBoard) {
        cards += 1;
        return;
      }

      if (!visitados.has(tile.loadBoard)) {
        subpastas += 1;
        visitar(tile.loadBoard);
      }
    });
  };

  visitar(boardId);
  return { boardIds, cards, subpastas };
};

// Cria o board da pasta e adiciona seu card ao board pai selecionado.
export const criarPasta = (dispatch, parentBoardId, { nome, imagem, cor }) => {
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
      parentBoardId
    )
  );

  return boardId;
};
