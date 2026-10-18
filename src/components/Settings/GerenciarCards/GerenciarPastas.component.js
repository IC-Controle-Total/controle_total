import React, { useRef, useState } from 'react';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { Button } from '@material-ui/core';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import {
  deleteBoard,
  deleteTiles,
  editTiles,
  updateBoard
} from '../../Board/Board.actions';
import { deleteBoardCommunicator } from '../../Communicator/Communicator.actions';
import FormularioItem, { PreviaCard } from './FormularioItem.component';
import {
  CORES,
  criarPasta,
  obterPastas,
  obterRootBoardId
} from './GerenciarCards.helpers';

import './GerenciarCards.css';

const FORMULARIO_VAZIO = { nome: '', imagem: '', cor: CORES[0].valor };

const GerenciarPastas = ({ rootBoardId, pastas, dispatch }) => {
  const [formulario, setFormulario] = useState(FORMULARIO_VAZIO);
  // Pasta que está sendo editada (null quando está criando uma nova)
  const [pastaEditada, setPastaEditada] = useState(null);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const formularioRef = useRef(null);

  const limparFormulario = () => {
    setFormulario(FORMULARIO_VAZIO);
    setPastaEditada(null);
    setErro('');
  };

  const salvarPasta = () => {
    const nome = formulario.nome.trim();

    if (pastaEditada) {
      dispatch(
        editTiles(
          [
            {
              ...pastaEditada.tile,
              label: nome,
              image: formulario.imagem,
              backgroundColor: formulario.cor
            }
          ],
          rootBoardId
        )
      );
      dispatch(updateBoard({ ...pastaEditada.board, name: nome }));
      setAviso(`Pasta "${nome}" atualizada.`);
    } else {
      criarPasta(dispatch, rootBoardId, {
        nome,
        imagem: formulario.imagem,
        cor: formulario.cor
      });
      setAviso(
        `Pasta "${nome}" criada. Agora você já pode colocar cards nela pela aba "Criar cards".`
      );
    }
    limparFormulario();
  };

  const editarPasta = pasta => {
    setPastaEditada(pasta);
    setFormulario({
      nome: pasta.nome,
      imagem: pasta.tile.image || '',
      cor: pasta.tile.backgroundColor || CORES[0].valor
    });
    setErro('');
    setAviso('');
    if (formularioRef.current) {
      formularioRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const excluirPasta = pasta => {
    const quantidade = pasta.board.tiles.length;
    const mensagem =
      quantidade > 0
        ? `Excluir a pasta "${
            pasta.nome
          }"? Os ${quantidade} card(s) dentro dela também serão excluídos.`
        : `Excluir a pasta "${pasta.nome}"?`;
    if (!window.confirm(mensagem)) return;

    dispatch(deleteTiles([pasta.tile.id], rootBoardId));
    dispatch(deleteBoard([pasta.boardId]));
    dispatch(deleteBoardCommunicator(pasta.boardId));
    if (pastaEditada && pastaEditada.boardId === pasta.boardId) {
      limparFormulario();
    }
  };

  return (
    <div className="gerenciar-cards">
      <FormularioItem
        ref={formularioRef}
        id="gerenciar-pastas"
        valores={formulario}
        onChange={setFormulario}
        onSubmit={salvarPasta}
        onCancelar={limparFormulario}
        editando={!!pastaEditada}
        ehPasta
        erro={erro}
        setErro={setErro}
      />

      {aviso && <p className="gerenciar-cards-aviso">{aviso}</p>}

      <h2 className="gerenciar-cards-titulo-lista">
        Pastas criadas ({pastas.length})
      </h2>

      {pastas.length === 0 ? (
        <p className="gerenciar-cards-vazio">
          Nenhuma pasta criada ainda. As pastas criadas aqui aparecem no final
          da tela de Cards.
        </p>
      ) : (
        <div className="gerenciar-cards-lista">
          {pastas.map(pasta => (
            <div key={pasta.boardId} className="gerenciar-cards-item">
              <PreviaCard
                nome={pasta.nome}
                imagem={pasta.tile.image}
                cor={pasta.tile.backgroundColor}
                ehPasta
              />
              <span className="gerenciar-cards-local">
                {pasta.board.tiles.length} card(s)
              </span>
              <div className="gerenciar-cards-item-acoes">
                <Button
                  size="small"
                  variant="outlined"
                  color="primary"
                  startIcon={<EditIcon />}
                  onClick={() => editarPasta(pasta)}
                >
                  Editar
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  className="gerenciar-cards-botao-excluir"
                  startIcon={<DeleteIcon />}
                  onClick={() => excluirPasta(pasta)}
                >
                  Excluir
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const mapStateToProps = (state, { intl }) => ({
  rootBoardId: obterRootBoardId(state),
  // Só as pastas criadas pelo cuidador podem ser editadas aqui
  pastas: obterPastas(state, intl).filter(pasta => pasta.tile.personalizado)
});

export default injectIntl(connect(mapStateToProps)(GerenciarPastas));
