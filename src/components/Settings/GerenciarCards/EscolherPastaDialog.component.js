import React, { useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField
} from '@material-ui/core';
import HomeIcon from '@material-ui/icons/Home';
import CreateNewFolderIcon from '@material-ui/icons/CreateNewFolder';

const NOVA_PASTA = 'nova-pasta';

// Pergunta em qual pasta o card deve ficar: tela inicial, pasta existente ou
// uma pasta nova.
const EscolherPastaDialog = ({
  open,
  titulo,
  rootBoardId,
  pastas,
  pastaAtual,
  onEscolher,
  onCriarPasta,
  onFechar
}) => {
  const [escolha, setEscolha] = useState(null);
  const [nomeNovaPasta, setNomeNovaPasta] = useState('');
  const [erro, setErro] = useState('');

  useEffect(
    () => {
      if (open) {
        setEscolha(pastaAtual || null);
        setNomeNovaPasta('');
        setErro('');
      }
    },
    [open, pastaAtual]
  );

  const confirmar = () => {
    if (!escolha) {
      setErro('Escolha onde o card vai ficar.');
      return;
    }
    if (escolha === NOVA_PASTA) {
      const nome = nomeNovaPasta.trim();
      if (!nome) {
        setErro('Dê um nome para a nova pasta.');
        return;
      }
      onCriarPasta(nome);
      return;
    }
    onEscolher(escolha);
  };

  const classeOpcao = id =>
    escolha === id
      ? 'escolher-pasta-opcao selecionada'
      : 'escolher-pasta-opcao';

  return (
    <Dialog open={open} onClose={onFechar} maxWidth="md" fullWidth>
      <DialogTitle>{titulo}</DialogTitle>
      <DialogContent>
        <div className="escolher-pasta-grade">
          <button
            type="button"
            className={classeOpcao(rootBoardId)}
            onClick={() => setEscolha(rootBoardId)}
          >
            <div className="escolher-pasta-icone">
              <HomeIcon fontSize="large" />
            </div>
            <span>Tela inicial (sem pasta)</span>
          </button>

          {pastas.map(pasta => (
            <button
              key={pasta.boardId}
              type="button"
              className={classeOpcao(pasta.boardId)}
              style={{ backgroundColor: pasta.tile.backgroundColor }}
              onClick={() => setEscolha(pasta.boardId)}
            >
              <div className="escolher-pasta-icone">
                {pasta.tile.image && <img src={pasta.tile.image} alt="" />}
              </div>
              <span>{pasta.nome}</span>
            </button>
          ))}

          <button
            type="button"
            className={classeOpcao(NOVA_PASTA) + ' nova'}
            onClick={() => setEscolha(NOVA_PASTA)}
          >
            <div className="escolher-pasta-icone">
              <CreateNewFolderIcon fontSize="large" />
            </div>
            <span>Criar pasta nova</span>
          </button>
        </div>

        {escolha === NOVA_PASTA && (
          <div className="escolher-pasta-nova">
            <TextField
              id="escolher-pasta-nome"
              label="Nome da nova pasta"
              placeholder="Ex: Rotina da manhã"
              variant="outlined"
              fullWidth
              autoFocus
              value={nomeNovaPasta}
              inputProps={{ maxLength: 40 }}
              onChange={e => setNomeNovaPasta(e.target.value)}
            />
            <p>
              A pasta usa a foto deste card como capa. Dá para trocar depois na
              aba "Criar pastas".
            </p>
          </div>
        )}

        {erro && <p className="gerenciar-cards-erro">{erro}</p>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onFechar}>Cancelar</Button>
        <Button
          variant="contained"
          className="gerenciar-cards-botao-salvar"
          onClick={confirmar}
        >
          Confirmar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EscolherPastaDialog;
