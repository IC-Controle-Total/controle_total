import React, { useRef, useState } from 'react';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { Button } from '@material-ui/core';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import FolderIcon from '@material-ui/icons/Folder';
import {
  createTile,
  deleteBoard,
  deleteTiles,
  editTiles,
  updateBoard
} from '../../Board/Board.actions';
import { deleteBoardCommunicator } from '../../Communicator/Communicator.actions';
import FormularioItem, { PreviaCard } from './FormularioItem.component';
import EscolherPastaDialog from './EscolherPastaDialog.component';
import {
  CORES,
  criarPasta,
  obterConteudoDaPasta,
  obterPastas,
  obterRootBoardId
} from './GerenciarCards.helpers';

import './GerenciarCards.css';

const FORMULARIO_VAZIO = {
  nome: '',
  imagem: '',
  cor: CORES[0].valor,
  pastaMaeId: ''
};

const GerenciarPastas = ({
  rootBoardId,
  pastas,
  pastasDisponiveis,
  boards,
  dispatch
}) => {
  const [formulario, setFormulario] = useState(FORMULARIO_VAZIO);
  // Pasta que está sendo editada (null quando está criando uma nova)
  const [pastaEditada, setPastaEditada] = useState(null);
  const [pastaParaMover, setPastaParaMover] = useState(null);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [dialogoPastaMae, setDialogoPastaMae] = useState(false);
  const formularioRef = useRef(null);
  const pastaMaeId = formulario.pastaMaeId || rootBoardId;
  const pastaMaeSelecionada = pastasDisponiveis.find(
    pasta => pasta.boardId === pastaMaeId
  );
  const pastaMaeNome = pastaMaeSelecionada
    ? pastaMaeSelecionada.caminho.join(' / ')
    : 'Tela inicial';
  const pastasBloqueadas = new Set(
    pastaParaMover
      ? obterConteudoDaPasta(boards, pastaParaMover.boardId).boardIds
      : []
  );
  const destinosParaMover = pastasDisponiveis.filter(
    pasta => !pastasBloqueadas.has(pasta.boardId)
  );

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
          pastaEditada.parentBoardId
        )
      );
      dispatch(updateBoard({ ...pastaEditada.board, name: nome }));
      setAviso(`Pasta "${nome}" atualizada.`);
    } else {
      const pastaMae = pastasDisponiveis.find(
        pasta => pasta.boardId === pastaMaeId
      );
      const local = pastaMae ? pastaMae.caminho.join(' / ') : 'Tela inicial';

      criarPasta(dispatch, pastaMaeId, {
        nome,
        imagem: formulario.imagem,
        cor: formulario.cor
      });
      setAviso(
        `Pasta "${nome}" criada em "${local}". ` +
          'Agora você já pode colocar cards nela pela aba "Criar cards".'
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
    const conteudo = obterConteudoDaPasta(boards, pasta.boardId);
    const mensagem =
      conteudo.cards > 0 || conteudo.subpastas > 0
        ? `Excluir a pasta "${pasta.nome}"? ` +
          `Os ${conteudo.cards} card(s) e ${conteudo.subpastas} subpasta(s) ` +
          'dentro dela também serão excluídos.'
        : `Excluir a pasta "${pasta.nome}"?`;
    if (!window.confirm(mensagem)) return;

    dispatch(deleteTiles([pasta.tile.id], pasta.parentBoardId));
    dispatch(deleteBoard(conteudo.boardIds));
    conteudo.boardIds.forEach(boardId =>
      dispatch(deleteBoardCommunicator(boardId))
    );
    if (pastaEditada && conteudo.boardIds.includes(pastaEditada.boardId)) {
      limparFormulario();
    }
  };

  const abrirMoverPasta = pasta => {
    setAviso('');
    setPastaParaMover(pasta);
  };

  const moverPasta = destinoBoardId => {
    if (!pastaParaMover) return;

    const pasta = pastaParaMover;
    const pastasDaArvore = new Set(
      obterConteudoDaPasta(boards, pasta.boardId).boardIds
    );
    if (pastasDaArvore.has(destinoBoardId)) {
      setErro(
        'Uma pasta não pode ser colocada dentro dela mesma ou de uma subpasta.'
      );
      setPastaParaMover(null);
      return;
    }

    const destino = pastasDisponiveis.find(
      item => item.boardId === destinoBoardId
    );
    const local = destino ? destino.caminho.join(' / ') : 'Tela inicial';

    if (destinoBoardId !== pasta.parentBoardId) {
      dispatch(deleteTiles([pasta.tile.id], pasta.parentBoardId));
      dispatch(createTile(pasta.tile, destinoBoardId));
      if (pastaEditada && pastaEditada.boardId === pasta.boardId) {
        limparFormulario();
      }
      setAviso(`Pasta "${pasta.nome}" movida para "${local}".`);
    } else {
      setAviso(`A pasta "${pasta.nome}" já está em "${local}".`);
    }

    setPastaParaMover(null);
  };

  return (
    <div className="gerenciar-cards">
      <FormularioItem
        ref={formularioRef}
        id="gerenciar-pastas"
        valores={formulario}
        onChange={setFormulario}
        pastaMaeNome={pastaMaeNome}
        onSelecionarPastaMae={() => setDialogoPastaMae(true)}
        onSubmit={salvarPasta}
        onCancelar={limparFormulario}
        editando={!!pastaEditada}
        ehPasta
        erro={erro}
        setErro={setErro}
      />

      <EscolherPastaDialog
        open={dialogoPastaMae}
        titulo="Onde criar esta pasta?"
        rootBoardId={rootBoardId}
        pastas={pastasDisponiveis}
        pastaAtual={pastaMaeId}
        mostrarOpcaoNovaPasta={false}
        onEscolher={novoPastaMaeId => {
          setFormulario(formularioAtual => ({
            ...formularioAtual,
            pastaMaeId: novoPastaMaeId
          }));
          setDialogoPastaMae(false);
        }}
        onFechar={() => setDialogoPastaMae(false)}
      />

      <EscolherPastaDialog
        open={!!pastaParaMover}
        titulo={
          pastaParaMover
            ? `Onde colocar a pasta "${pastaParaMover.nome}"?`
            : 'Onde colocar esta pasta?'
        }
        rootBoardId={rootBoardId}
        pastas={destinosParaMover}
        pastaAtual={pastaParaMover && pastaParaMover.parentBoardId}
        mostrarOpcaoNovaPasta={false}
        onEscolher={moverPasta}
        onFechar={() => setPastaParaMover(null)}
      />

      {aviso && <p className="gerenciar-cards-aviso">{aviso}</p>}

      <h2 className="gerenciar-cards-titulo-lista">
        Pastas criadas ({pastas.length})
      </h2>

      {pastas.length === 0 ? (
        <p className="gerenciar-cards-vazio">
          Nenhuma pasta criada ainda. As pastas criadas aqui aparecem na tela de
          Cards, dentro do local escolhido.
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
                Local:{' '}
                {pasta.caminhoPai.length
                  ? pasta.caminhoPai.join(' / ')
                  : 'Tela inicial'}
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
                  color="primary"
                  startIcon={<FolderIcon />}
                  onClick={() => abrirMoverPasta(pasta)}
                >
                  Mudar pasta
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
  boards: state.board.boards,
  pastasDisponiveis: obterPastas(state, intl),
  // Só as pastas criadas pelo cuidador podem ser editadas aqui
  pastas: obterPastas(state, intl).filter(pasta => pasta.tile.personalizado)
});

export default injectIntl(connect(mapStateToProps)(GerenciarPastas));
