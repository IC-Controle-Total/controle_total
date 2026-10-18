import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle
} from '@material-ui/core';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';
import SaveIcon from '@material-ui/icons/Save';
import RestoreIcon from '@material-ui/icons/SettingsBackupRestore';
import WarningIcon from '@material-ui/icons/Warning';
import { DEFAULT_BOARDS, deepCopy, resolveTileLabel } from '../../../helpers';
import {
  createBoard,
  deleteBoard,
  updateBoard
} from '../../Board/Board.actions';
import {
  addBoardCommunicator,
  deleteBoardCommunicator
} from '../../Communicator/Communicator.actions';
import FormularioItem, { PreviaCard } from './FormularioItem.component';
import { CORES, obterRootBoardId } from './GerenciarCards.helpers';

import './GerenciarCards.css';

const moverItem = (lista, de, para) => {
  const nova = [...lista];
  const [item] = nova.splice(de, 1);
  nova.splice(para, 0, item);
  return nova;
};

// Versão original de uma pasta que já vem com o app (null nas criadas pelo cuidador)
const obterBoardPadrao = boardId => {
  const padroes = Object.values(DEFAULT_BOARDS).filter(Array.isArray);
  for (const lista of padroes) {
    const padrao = lista.find(b => b.id === boardId);
    if (padrao) return padrao;
  }
  return null;
};

// Organiza a disposição dos cards e pastas da tela de Cards. As mudanças
// ficam num rascunho e só valem depois de "Salvar disposição".
const OrganizarCards = ({
  intl,
  boards,
  rootBoardId,
  dispatch,
  onAlteracoesPendentes
}) => {
  // Pastas abertas, da tela inicial até a atual
  const [caminho, setCaminho] = useState([
    { boardId: rootBoardId, nome: 'Tela inicial' }
  ]);
  const [rascunho, setRascunho] = useState(null);
  const [excluidos, setExcluidos] = useState([]);
  const [arrastando, setArrastando] = useState(null);
  const [editado, setEditado] = useState(null);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [confirmandoRestauro, setConfirmandoRestauro] = useState(false);

  const atual = caminho[caminho.length - 1];
  const board = boards.find(b => b.id === atual.boardId);
  const tiles = rascunho || (board ? board.tiles : []);
  const pendente = rascunho !== null;

  useEffect(
    () => {
      if (onAlteracoesPendentes) onAlteracoesPendentes(pendente);
    },
    [pendente, onAlteracoesPendentes]
  );

  const nomeDoTile = tile => resolveTileLabel(tile, intl) || 'Sem nome';

  const podeDescartar = () =>
    !pendente ||
    window.confirm('Há alterações não salvas nesta pasta. Descartar?');

  const descartar = () => {
    setRascunho(null);
    setExcluidos([]);
  };

  const irPara = novoCaminho => {
    if (!podeDescartar()) return;
    descartar();
    setAviso('');
    setCaminho(novoCaminho);
  };

  const abrirPasta = tile =>
    irPara([...caminho, { boardId: tile.loadBoard, nome: nomeDoTile(tile) }]);

  const mover = (de, para) => {
    if (para < 0 || para >= tiles.length || de === para) return;
    setRascunho(moverItem(tiles, de, para));
    setAviso('');
  };

  const excluir = tile => {
    const mensagem = tile.loadBoard
      ? `Excluir a pasta "${nomeDoTile(
          tile
        )}" da tela de Cards? Os cards dentro dela deixam de aparecer.`
      : `Excluir o card "${nomeDoTile(tile)}"?`;
    if (!window.confirm(mensagem)) return;

    setRascunho(tiles.filter(t => t.id !== tile.id));
    setExcluidos([...excluidos, tile]);
    setAviso('');
  };

  const abrirEdicao = tile => {
    setErro('');
    setEditado({
      tile,
      valores: {
        nome: nomeDoTile(tile),
        imagem: tile.image || '',
        cor: tile.backgroundColor || CORES[0].valor
      }
    });
  };

  const aplicarEdicao = () => {
    const { tile, valores } = editado;
    const nome = valores.nome.trim();
    const novoTile = {
      ...tile,
      label: nome,
      image: valores.imagem,
      backgroundColor: valores.cor
    };
    // A fala usa a vocalização antes do nome; com o nome novo ela ficaria velha
    if (nome !== nomeDoTile(tile)) delete novoTile.vocalization;

    setRascunho(tiles.map(t => (t.id === tile.id ? novoTile : t)));
    setEditado(null);
    setAviso('');
  };

  const salvar = () => {
    dispatch(updateBoard({ ...board, tiles: rascunho }));

    // Pastas criadas pelo cuidador levam junto o board com os cards delas
    excluidos
      .filter(tile => tile.loadBoard && tile.personalizado)
      .forEach(tile => {
        dispatch(deleteBoard([tile.loadBoard]));
        dispatch(deleteBoardCommunicator(tile.loadBoard));
      });

    // Mantém o nome do board das pastas renomeadas igual ao do card da pasta
    rascunho
      .filter(tile => tile.loadBoard && tile.label)
      .forEach(tile => {
        const pasta = boards.find(b => b.id === tile.loadBoard);
        if (pasta && pasta.name !== tile.label) {
          dispatch(updateBoard({ ...pasta, name: tile.label }));
        }
      });

    descartar();
    setAviso('Disposição salva. A tela de Cards já mostra a nova organização.');
  };

  const boardPadrao = obterBoardPadrao(atual.boardId);

  const restaurarPadrao = () => {
    const tilesPadrao = deepCopy(boardPadrao.tiles);

    // Pastas padrão que tiveram o board apagado voltam também
    tilesPadrao
      .filter(
        tile => tile.loadBoard && !boards.some(b => b.id === tile.loadBoard)
      )
      .forEach(tile => {
        const pastaPadrao = obterBoardPadrao(tile.loadBoard);
        if (pastaPadrao) {
          dispatch(createBoard(deepCopy(pastaPadrao)));
          dispatch(addBoardCommunicator(pastaPadrao.id));
        }
      });

    // Os cards e pastas criados pelo cuidador continuam, no final
    const criados = board.tiles.filter(tile => tile.personalizado);
    dispatch(updateBoard({ ...board, tiles: [...tilesPadrao, ...criados] }));

    descartar();
    setConfirmandoRestauro(false);
    setAviso(
      `"${
        atual.nome
      }" voltou ao padrão. A tela de Cards já mostra a organização original.`
    );
  };

  if (!board) {
    return (
      <p className="gerenciar-cards-vazio">
        Não foi possível encontrar esta pasta.
      </p>
    );
  }

  return (
    <div className="gerenciar-cards">
      <div className="organizar-barra">
        <nav className="organizar-caminho" aria-label="Pasta atual">
          {caminho.map((parte, i) =>
            i < caminho.length - 1 ? (
              <span key={parte.boardId}>
                <button
                  type="button"
                  className="organizar-caminho-link"
                  onClick={() => irPara(caminho.slice(0, i + 1))}
                >
                  {parte.nome}
                </button>
                <span className="organizar-caminho-separador">›</span>
              </span>
            ) : (
              <strong key={parte.boardId}>{parte.nome}</strong>
            )
          )}
        </nav>

        <div className="gerenciar-cards-acoes">
          {boardPadrao && (
            <Button
              variant="outlined"
              startIcon={<RestoreIcon />}
              onClick={() => setConfirmandoRestauro(true)}
            >
              Restaurar padrão
            </Button>
          )}
          {pendente && (
            <Button variant="outlined" onClick={descartar}>
              Descartar
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            className="gerenciar-cards-botao-salvar"
            disabled={!pendente}
            onClick={salvar}
          >
            Salvar disposição
          </Button>
        </div>
      </div>

      <p className="organizar-dica">
        Arraste os cards ou use as setas para mudar a posição. A ordem aqui é a
        mesma da tela de Cards.
      </p>

      {pendente && (
        <p className="organizar-pendente">
          Alterações não salvas. Clique em "Salvar disposição" para aplicar na
          tela de Cards.
        </p>
      )}
      {aviso && <p className="gerenciar-cards-aviso">{aviso}</p>}

      {tiles.length === 0 ? (
        <p className="gerenciar-cards-vazio">Esta pasta está vazia.</p>
      ) : (
        <div className="organizar-grade">
          {tiles.map((tile, index) => (
            <div
              key={tile.id}
              className={
                arrastando === index
                  ? 'gerenciar-cards-item organizar-item arrastando'
                  : 'gerenciar-cards-item organizar-item'
              }
              draggable
              onDragStart={() => setArrastando(index)}
              onDragEnd={() => setArrastando(null)}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                if (arrastando !== null) mover(arrastando, index);
                setArrastando(null);
              }}
            >
              <span className="organizar-posicao">{index + 1}</span>
              <PreviaCard
                nome={nomeDoTile(tile)}
                imagem={tile.image}
                cor={tile.backgroundColor}
                ehPasta={!!tile.loadBoard}
              />
              <div className="organizar-setas">
                <Button
                  size="small"
                  variant="outlined"
                  aria-label="Mover para trás"
                  disabled={index === 0}
                  onClick={() => mover(index, index - 1)}
                >
                  <ArrowBackIcon fontSize="small" />
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  aria-label="Mover para frente"
                  disabled={index === tiles.length - 1}
                  onClick={() => mover(index, index + 1)}
                >
                  <ArrowForwardIcon fontSize="small" />
                </Button>
              </div>
              <div className="gerenciar-cards-item-acoes">
                {tile.loadBoard && (
                  <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    startIcon={<FolderOpenIcon />}
                    onClick={() => abrirPasta(tile)}
                  >
                    Abrir
                  </Button>
                )}
                <Button
                  size="small"
                  variant="outlined"
                  color="primary"
                  startIcon={<EditIcon />}
                  onClick={() => abrirEdicao(tile)}
                >
                  Editar
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  className="gerenciar-cards-botao-excluir"
                  aria-label={`Excluir ${nomeDoTile(tile)}`}
                  onClick={() => excluir(tile)}
                >
                  <DeleteIcon fontSize="small" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={confirmandoRestauro}
        onClose={() => setConfirmandoRestauro(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <span className="organizar-restaurar-titulo">
            <WarningIcon className="organizar-restaurar-icone" />
            Restaurar "{atual.nome}" ao padrão?
          </span>
        </DialogTitle>
        <DialogContent>
          <p className="organizar-restaurar-texto">
            Os cards que já vinham no app voltam para a posição, o nome, a foto
            e a cor originais. Os que foram excluídos voltam a aparecer.
          </p>
          <p className="organizar-restaurar-texto">
            Os cards e pastas que você criou não são apagados: eles ficam no
            final.
          </p>
          {pendente && (
            <p className="organizar-restaurar-texto forte">
              As alterações não salvas nesta pasta serão perdidas.
            </p>
          )}
          <p className="organizar-restaurar-texto forte">
            Essa ação não pode ser desfeita.
          </p>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmandoRestauro(false)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            className="organizar-botao-restaurar"
            startIcon={<RestoreIcon />}
            onClick={restaurarPadrao}
          >
            Restaurar padrão
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!editado}
        onClose={() => setEditado(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogContent>
          {editado && (
            <FormularioItem
              id="organizar"
              valores={editado.valores}
              onChange={valores => setEditado({ ...editado, valores })}
              onSubmit={aplicarEdicao}
              onCancelar={() => setEditado(null)}
              editando
              ehPasta={!!editado.tile.loadBoard}
              erro={erro}
              setErro={setErro}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const mapStateToProps = state => ({
  boards: state.board.boards,
  rootBoardId: obterRootBoardId(state)
});

export default injectIntl(connect(mapStateToProps)(OrganizarCards));
