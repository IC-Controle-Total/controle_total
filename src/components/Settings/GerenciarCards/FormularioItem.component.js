import React, { forwardRef, useRef, useState } from 'react';
import { readAndCompressImage } from 'browser-image-resizer';
import { Button, TextField } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import EditIcon from '@material-ui/icons/Edit';
import PhotoCameraIcon from '@material-ui/icons/PhotoCamera';
import { CORES } from './GerenciarCards.helpers';

// A foto é reduzida antes de salvar para não pesar no armazenamento do navegador
const CONFIG_IMAGEM = {
  quality: 0.8,
  maxWidth: 400,
  maxHeight: 400,
  autoRotate: true,
  debug: false,
  mimeType: 'image/jpeg'
};

const blobParaDataUrl = blob =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

// Prévia no mesmo formato dos cards da tela de Cards
export const PreviaCard = ({ nome, imagem, cor, ehPasta }) => (
  <div
    className={ehPasta ? 'gerenciar-cards-card pasta' : 'gerenciar-cards-card'}
    style={{ backgroundColor: cor }}
  >
    <div className="gerenciar-cards-card-imagem">
      {imagem ? <img src={imagem} alt="" /> : <span>Sem foto</span>}
    </div>
    <span className="gerenciar-cards-card-nome">{nome}</span>
  </div>
);

// Formulário de nome, foto e cor usado para criar e editar cards e pastas
const FormularioItem = forwardRef(
  (
    {
      id,
      valores,
      onChange,
      onSubmit,
      onCancelar,
      editando,
      ehPasta,
      erro,
      setErro
    },
    ref
  ) => {
    const [carregandoImagem, setCarregandoImagem] = useState(false);
    const inputFotoRef = useRef(null);
    const tipo = ehPasta ? 'pasta' : 'card';

    const escolherFoto = async event => {
      const arquivo = event.target.files && event.target.files[0];
      if (!arquivo) return;

      setCarregandoImagem(true);
      setErro('');
      try {
        const blob = await readAndCompressImage(arquivo, CONFIG_IMAGEM);
        const imagem = await blobParaDataUrl(blob);
        onChange({ ...valores, imagem });
      } catch (err) {
        console.error(err);
        setErro('Não foi possível carregar a foto. Tente outra imagem.');
      } finally {
        setCarregandoImagem(false);
        if (inputFotoRef.current) inputFotoRef.current.value = '';
      }
    };

    const enviar = event => {
      event.preventDefault();
      if (!valores.nome.trim()) {
        setErro(`Dê um nome para ${ehPasta ? 'a pasta' : 'o card'}.`);
        return;
      }
      if (!valores.imagem) {
        setErro(`Escolha uma foto para ${ehPasta ? 'a pasta' : 'o card'}.`);
        return;
      }
      onSubmit();
    };

    return (
      <form ref={ref} className="gerenciar-cards-formulario" onSubmit={enviar}>
        <h2>
          {editando
            ? `Editar ${tipo}`
            : ehPasta
            ? 'Criar nova pasta'
            : 'Criar novo card'}
        </h2>

        <div className="gerenciar-cards-formulario-corpo">
          <div className="gerenciar-cards-campos">
            <TextField
              id={`${id}-nome`}
              label={ehPasta ? 'Nome da pasta' : 'Nome do card'}
              placeholder={
                ehPasta ? 'Ex: Rotina da manhã' : 'Ex: Hora do banho'
              }
              variant="outlined"
              fullWidth
              value={valores.nome}
              inputProps={{ maxLength: 40 }}
              onChange={e => onChange({ ...valores, nome: e.target.value })}
            />

            <div>
              <input
                ref={inputFotoRef}
                type="file"
                accept="image/*"
                id={`${id}-foto`}
                style={{ display: 'none' }}
                onChange={escolherFoto}
              />
              <label htmlFor={`${id}-foto`}>
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
                    : valores.imagem
                    ? 'Trocar foto'
                    : 'Escolher foto'}
                </Button>
              </label>
            </div>

            <div>
              <p className="gerenciar-cards-rotulo">Cor</p>
              <div className="gerenciar-cards-cores">
                {CORES.map(cor => (
                  <button
                    key={cor.valor}
                    type="button"
                    title={cor.nome}
                    aria-label={cor.nome}
                    className={
                      valores.cor === cor.valor
                        ? 'gerenciar-cards-cor selecionada'
                        : 'gerenciar-cards-cor'
                    }
                    style={{ backgroundColor: cor.valor }}
                    onClick={() => onChange({ ...valores, cor: cor.valor })}
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
                {editando
                  ? 'Salvar alterações'
                  : ehPasta
                  ? 'Criar pasta'
                  : 'Criar card'}
              </Button>
              {editando && (
                <Button variant="outlined" onClick={onCancelar}>
                  Cancelar
                </Button>
              )}
            </div>
          </div>

          <div className="gerenciar-cards-previa">
            <p className="gerenciar-cards-rotulo">Prévia</p>
            <PreviaCard
              nome={
                valores.nome.trim() ||
                (ehPasta ? 'Nome da pasta' : 'Nome do card')
              }
              imagem={valores.imagem}
              cor={valores.cor}
              ehPasta={ehPasta}
            />
          </div>
        </div>
      </form>
    );
  }
);

export default FormularioItem;
