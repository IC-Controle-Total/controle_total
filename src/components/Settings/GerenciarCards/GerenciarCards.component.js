import React, { useRef, useState } from 'react';
import { connect } from 'react-redux';
import shortid from 'shortid';
import { readAndCompressImage } from 'browser-image-resizer';
import { Button, TextField } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import PhotoCameraIcon from '@material-ui/icons/PhotoCamera';
import { createTile, editTiles, deleteTiles } from '../../Board/Board.actions';

import './GerenciarCards.css';

// Mesmas cores usadas nos cards padrão da tela de Cards
const CORES = [
  { nome: 'Azul', valor: 'rgb(187, 222, 251)' },
  { nome: 'Amarelo', valor: 'rgb(255, 241, 118)' },
  { nome: 'Verde', valor: 'rgb(200, 230, 201)' },
  { nome: 'Laranja', valor: 'rgb(255, 224, 178)' },
  { nome: 'Rosa', valor: 'rgb(248, 187, 208)' },
  { nome: 'Branco', valor: 'rgb(255, 255, 255)' }
];

// A foto é reduzida antes de salvar para não pesar no armazenamento do navegador
const CONFIG_IMAGEM = {
  quality: 0.8,
  maxWidth: 400,
  maxHeight: 400,
  autoRotate: true,
  debug: false,
  mimeType: 'image/jpeg'
};

const FORMULARIO_VAZIO = {
  id: null,
  nome: '',
  imagem: '',
  cor: CORES[0].valor
};

const blobParaDataUrl = blob =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const GerenciarCards = ({ rootBoardId, cards, dispatch }) => {
  const [formulario, setFormulario] = useState(FORMULARIO_VAZIO);
  const [carregandoImagem, setCarregandoImagem] = useState(false);
  const [erro, setErro] = useState('');
  const inputFotoRef = useRef(null);
  const formularioRef = useRef(null);

  const editando = formulario.id !== null;

  const limparFormulario = () => {
    setFormulario(FORMULARIO_VAZIO);
    setErro('');
    if (inputFotoRef.current) inputFotoRef.current.value = '';
  };

  const escolherFoto = async event => {
    const arquivo = event.target.files && event.target.files[0];
    if (!arquivo) return;

    setCarregandoImagem(true);
    setErro('');
    try {
      const blob = await readAndCompressImage(arquivo, CONFIG_IMAGEM);
      const imagem = await blobParaDataUrl(blob);
      setFormulario(prev => ({ ...prev, imagem }));
    } catch (err) {
      console.error(err);
      setErro('Não foi possível carregar a foto. Tente outra imagem.');
    } finally {
      setCarregandoImagem(false);
    }
  };

  const salvarCard = event => {
    event.preventDefault();
    const nome = formulario.nome.trim();

    if (!nome) {
      setErro('Dê um nome para o card.');
      return;
    }
    if (!formulario.imagem) {
      setErro('Escolha uma foto para o card.');
      return;
    }

    if (editando) {
      const cardOriginal = cards.find(card => card.id === formulario.id);
      dispatch(
        editTiles(
          [
            {
              ...cardOriginal,
              label: nome,
              image: formulario.imagem,
              backgroundColor: formulario.cor
            }
          ],
          rootBoardId
        )
      );
    } else {
      dispatch(
        createTile(
          {
            id: shortid.generate(),
            label: nome,
            image: formulario.imagem,
            backgroundColor: formulario.cor,
            personalizado: true
          },
          rootBoardId
        )
      );
    }

    limparFormulario();
  };

  const editarCard = card => {
    setFormulario({
      id: card.id,
      nome: card.label || '',
      imagem: card.image || '',
      cor: card.backgroundColor || CORES[0].valor
    });
    setErro('');
    if (formularioRef.current) {
      formularioRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const excluirCard = card => {
    const confirmou = window.confirm(`Excluir o card "${card.label}"?`);
    if (!confirmou) return;

    dispatch(deleteTiles([card.id], rootBoardId));
    if (formulario.id === card.id) limparFormulario();
  };

  return (
    <div className="gerenciar-cards">
      <form
        ref={formularioRef}
        className="gerenciar-cards-formulario"
        onSubmit={salvarCard}
      >
        <h2>{editando ? 'Editar card' : 'Criar novo card'}</h2>

        <div className="gerenciar-cards-formulario-corpo">
          <div className="gerenciar-cards-campos">
            <TextField
              id="gerenciar-cards-nome"
              label="Nome do card"
              placeholder="Ex: Hora do banho"
              variant="outlined"
              fullWidth
              value={formulario.nome}
              inputProps={{ maxLength: 40 }}
              onChange={e =>
                setFormulario({ ...formulario, nome: e.target.value })
              }
            />

            <div>
              <input
                ref={inputFotoRef}
                type="file"
                accept="image/*"
                id="gerenciar-cards-foto"
                style={{ display: 'none' }}
                onChange={escolherFoto}
              />
              <label htmlFor="gerenciar-cards-foto">
                <Button
                  variant="outlined"
                  color="primary"
                  component="span"
                  startIcon={<PhotoCameraIcon />}
                  disabled={carregandoImagem}
                  className="gerenciar-cards-botao-foto"
                >
                  {carregandoImagem
                    ? 'Carregando...'
                    : formulario.imagem
                    ? 'Trocar foto'
                    : 'Escolher foto'}
                </Button>
              </label>
            </div>

            <div>
              <p className="gerenciar-cards-rotulo">Cor do card</p>
              <div className="gerenciar-cards-cores">
                {CORES.map(cor => (
                  <button
                    key={cor.valor}
                    type="button"
                    title={cor.nome}
                    aria-label={cor.nome}
                    className={
                      formulario.cor === cor.valor
                        ? 'gerenciar-cards-cor selecionada'
                        : 'gerenciar-cards-cor'
                    }
                    style={{ backgroundColor: cor.valor }}
                    onClick={() =>
                      setFormulario({ ...formulario, cor: cor.valor })
                    }
                  />
                ))}
              </div>
            </div>

            {erro && <p className="gerenciar-cards-erro">{erro}</p>}

            <div className="gerenciar-cards-acoes">
              <Button
                type="submit"
                variant="contained"
                startIcon={editando ? <EditIcon /> : <AddIcon />}
                className="gerenciar-cards-botao-salvar"
                disabled={carregandoImagem}
              >
                {editando ? 'Salvar alterações' : 'Criar card'}
              </Button>
              {editando && (
                <Button variant="outlined" onClick={limparFormulario}>
                  Cancelar
                </Button>
              )}
            </div>
          </div>

          <div className="gerenciar-cards-previa">
            <p className="gerenciar-cards-rotulo">Prévia</p>
            <div
              className="gerenciar-cards-card"
              style={{ backgroundColor: formulario.cor }}
            >
              <div className="gerenciar-cards-card-imagem">
                {formulario.imagem ? (
                  <img src={formulario.imagem} alt="" />
                ) : (
                  <span>Sem foto</span>
                )}
              </div>
              <span className="gerenciar-cards-card-nome">
                {formulario.nome.trim() || 'Nome do card'}
              </span>
            </div>
          </div>
        </div>
      </form>

      <h2 className="gerenciar-cards-titulo-lista">
        Cards criados ({cards.length})
      </h2>

      {cards.length === 0 ? (
        <p className="gerenciar-cards-vazio">
          Nenhum card criado ainda. Os cards criados aqui aparecem no final da
          tela de Cards.
        </p>
      ) : (
        <div className="gerenciar-cards-lista">
          {cards.map(card => (
            <div key={card.id} className="gerenciar-cards-item">
              <div
                className="gerenciar-cards-card"
                style={{ backgroundColor: card.backgroundColor }}
              >
                <div className="gerenciar-cards-card-imagem">
                  <img src={card.image} alt="" />
                </div>
                <span className="gerenciar-cards-card-nome">{card.label}</span>
              </div>
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
    </div>
  );
};

const mapStateToProps = state => {
  const { communicators, activeCommunicatorId } = state.communicator;
  const communicator = communicators.find(c => c.id === activeCommunicatorId);
  const rootBoardId = communicator ? communicator.rootBoard : 'root';
  const rootBoard = state.board.boards.find(b => b.id === rootBoardId);

  return {
    rootBoardId,
    cards: rootBoard ? rootBoard.tiles.filter(tile => tile.personalizado) : []
  };
};

export default connect(mapStateToProps)(GerenciarCards);
