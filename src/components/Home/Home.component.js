import React from 'react';
import { useHistory } from 'react-router-dom';
import { Button } from '@material-ui/core';
import KeyboardIcon from '@material-ui/icons/Keyboard';
import VolumeUpIcon from '@material-ui/icons/VolumeUp';
import './Home.css';

export default function Home() {
  const history = useHistory();

  return (
    <div className="home-container">
      <h1 className="home-title">Controle Total</h1>

      <div className="home-button-group">
        <Button
          variant="contained"
          className="home-button"
          startIcon={<KeyboardIcon />}
          onClick={() => history.push('/board/main')}
        >
          Teclado
        </Button>

        <Button
          variant="contained"
          className="home-button"
          startIcon={<VolumeUpIcon />}
          onClick={() => history.push('/board/cards')}
        >
          Cards
        </Button>
      </div>
    </div>
  );
}
