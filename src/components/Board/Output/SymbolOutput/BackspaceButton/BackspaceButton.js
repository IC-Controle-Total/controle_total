import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import BackspaceIcon from '@material-ui/icons/Backspace';
import { Scannable } from 'react-scannable';

export class BackspaceButton extends Component {
  static propTypes = {
    theme: PropTypes.object,
    hidden: PropTypes.bool
  };

  render() {
    const { theme, hidden, increaseOutputButtons, ...other } = this.props;

    const backspaceIconStyle =
      theme.direction === 'ltr'
        ? { color: '#1976d2' } // azul padrão Material-UI
        : { transform: 'scaleX(-1)', color: '#1976d2' };

    return (
      <Scannable disabled={hidden}>
        <IconButton
          aria-label="Backspace"
          className={
            increaseOutputButtons ? 'Output__button__lg' : 'Output__button__sm'
          }
          {...other}
          style={{ color: '#1976d2' }} // deixa o botão azul
        >
          <BackspaceIcon
            className={
              increaseOutputButtons ? 'Output__icon__lg' : 'Output__icon__sm'
            }
            style={backspaceIconStyle}
          />
        </IconButton>
      </Scannable>
    );
  }
}

export default withStyles(null, { withTheme: true })(BackspaceButton);
