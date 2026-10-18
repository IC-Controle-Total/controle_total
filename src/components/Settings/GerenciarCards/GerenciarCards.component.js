import React, { useRef, useState } from 'react';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import shortid from 'shortid';
import { Button } from '@material-ui/core';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import FolderIcon from '@material-ui/icons/Folder';
import { createTile, editTiles, deleteTiles } from '../../Board/Board.actions';
import FormularioItem, { PreviaCard } from './FormularioItem.component';
import EscolherPastaDialog from './EscolherPastaDialog.component';
import {
  CORES,
  criarPasta,
  obterPastas,
  obterRootBoardId
} from './GerenciarCards.helpers';

import './GerenciarCards.css';

const FORMULARIO_VAZIO = { nome: '', imagem: '', cor: CORES[0].valor };

const GerenciarCards = ({
  rootBoardId,
  pastas,
  cards,
  nomesBoards,
  dispatch
}) => {
  const [formulario, setFormulario] = useState(FORMULARIO_VAZIO);
  // Card que está sendo editado (null quando está criando um novo)
  const [cardEditado, setCardEditado] = useState(null);
  // null = fechado; { card } = mudar o card de pasta; {} = novo card
  const [dialogo, setDialogo] = useState(null);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const formularioRef = useRef(null);

  const nomeDoLocal = boardId =>
    boardId === rootBoardId
      ? 'Tela inicial'
      : nomesBoards[boardId] || 'Outra pasta';

  const limparFormulario = () => {
    setFormulario(FORMULARIO_VAZIO);
    setCardEditado(null);
    setErro('');
  };

  const salvarCard = () => {
    setAviso('');
    if (!cardEditado) {
      // Antes de criar, pergunta em qual pasta o card vai ficar
      setDialogo({});
      return;
    }

    dispatch(
      editTiles(
        [
          {
            ...cardEditado.tile,
            label: formulario.nome.trim(),
            image: formulario.imagem,
            backgroundColor: formulario.cor
          }
        ],
        cardEditado.boardId
      )
    );
    setAviso(`Card "${formulario.nome.trim()}" atualizado.`);
    limparFormulario();
  };

  const colocarNaPasta = (boardId, nomeLocal = nomeDoLocal(boardId)) => {
    if (dialogo.card) {
      const { tile, boardId: boardAnterior } = dialogo.card;
      if (boardId !== boardAnterior) {
        dispatch(deleteTiles([tile.id], boardAnterior));
        dispatch(createTile(tile, boardId));
      }
      setAviso(`Card "${tile.label}" agora está em: ${nomeLocal}.`);
    } else {
      const nome = formulario.nome.trim();
      dispatch(
        createTile(
          {
            id: shortid.generate(),
            label: nome,
            image: formulario.imagem,
            backgroundColor: formulario.cor,
            personalizado: true
          },
          boardId
        )
      );
      setAviso(`Card "${nome}" criado em: ${nomeLocal}.`);
      limparFormulario();
    }
    setDialogo(null);
  };

  const criarPastaENela = nome => {
    const imagem = dialogo.card ? dialogo.card.tile.image : formulario.imagem;
    const boardId = criarPasta(dispatch, rootBoardId, {
      nome,
      imagem,
      cor: CORES[0].valor
    });
    colocarNaPasta(boardId, nome);
  };

  const editarCard = card => {
    setCardEditado(card);
    setFormulario({
      nome: card.tile.label || '',
      imagem: card.tile.image || '',
      cor: card.tile.backgroundColor || CORES[0].valor
    });
    setErro('');
    setAviso('');
    if (formularioRef.current) {
      formularioRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const excluirCard = card => {
    const confirmou = window.confirm(`Excluir o card "${card.tile.label}"?`);
    if (!confirmou) return;

    dispatch(deleteTiles([card.tile.id], card.boardId));
    if (cardEditado && cardEditado.tile.id === card.tile.id) {
      limparFormulario();
    }
  };

  return (
    <div className="gerenciar-cards">
      <FormularioItem
        ref={formularioRef}
        id="gerenciar-cards"
        valores={formulario}
        onChange={setFormulario}
        onSubmit={salvarCard}
        onCancelar={limparFormulario}
        editando={!!cardEditado}
        erro={erro}
        setErro={setErro}
      />

      {aviso && <p className="gerenciar-cards-aviso">{aviso}</p>}

      <h2 className="gerenciar-cards-titulo-lista">
        Cards criados ({cards.length})
      </h2>

      {cards.length === 0 ? (
        <p className="gerenciar-cards-vazio">
          Nenhum card criado ainda. Ao criar um card você escolhe em qual pasta
          da tela de Cards ele vai aparecer.
        </p>
      ) : (
        <div className="gerenciar-cards-lista">
          {cards.map(card => (
            <div key={card.tile.id} className="gerenciar-cards-item">
              <PreviaCard
                nome={card.tile.label}
                imagem={card.tile.image}
                cor={card.tile.backgroundColor}
              />
              <span className="gerenciar-cards-local">
                <FolderIcon fontSize="small" />
                {nomeDoLocal(card.boardId)}
              </span>
              <div className="gerenciar-cards-item-acoes">
                <Button
                  size="small"
                  variant="outlined"
                  color="primary"
                  startIcon={<EditIcon />}
                  onClick={() => editarCard(card)}
                >
                  Editar
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="primary"
                  startIcon={<FolderIcon />}
                  onClick={() => setDialogo({ card })}
                >
                  Mudar pasta
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  className="gerenciar-cards-botao-excluir"
                  startIcon={<DeleteIcon />}
                  onClick={() => excluirCard(card)}
                >
                  Excluir
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <EscolherPastaDialog
        open={!!dialogo}
        titulo={
          dialogo && dialogo.card
            ? `Para onde mover o card "${dialogo.card.tile.label}"?`
            : 'Onde colocar este card?'
        }
        rootBoardId={rootBoardId}
        pastas={pastas}
        pastaAtual={dialogo && dialogo.card ? dialogo.card.boardId : null}
        onEscolher={colocarNaPasta}
        onCriarPasta={criarPastaENela}
        onFechar={() => setDialogo(null)}
      />
    </div>
  );
};

const mapStateToProps = (state, { intl }) => {
  const pastas = obterPastas(state, intl);
  const nomesBoards = {};
  const cards = [];

  state.board.boards.forEach(board => {
    nomesBoards[board.id] = board.name;
    (board.tiles || []).forEach(tile => {
      if (tile.personalizado && !tile.loadBoard) {
        cards.push({ tile, boardId: board.id });
      }
    });
  });
  // Nome da pasta como aparece na tela de Cards
  pastas.forEach(pasta => {
    nomesBoards[pasta.boardId] = pasta.nome;
  });

  return {
    rootBoardId: obterRootBoardId(state),
    pastas,
    cards,
    nomesBoards
  };
};

export default injectIntl(connect(mapStateToProps)(GerenciarCards));
