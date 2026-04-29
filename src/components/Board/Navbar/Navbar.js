import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import classNames from 'classnames';
import { Scannable } from 'react-scannable';
import { IconButton, Button } from '@material-ui/core';
import ScannerDeactivateIcon from '@material-ui/icons/ExploreOff';
import HomeIcon from '@material-ui/icons/Home';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import FullScreenButton from '../../UI/FullScreenButton';
import { isCordova } from '../../../cordova-util';
import './Navbar.css';
import { injectIntl } from 'react-intl';

export class Navbar extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      backButton: false,
      deactivateScannerButton: false
    };
  }

  onScannableFocus = property => () => {
    if (!this.state[property]) {
      this.setState({ [property]: true });
    }
  };

  onScannableBlur = property => () => {
    if (this.state[property]) {
      this.setState({ [property]: false });
    }
  };

  handleHomeOrBackClick = () => {
    const { disabled, onBackClick, history } = this.props;

    if (disabled) {
      history.push('/');
    } else {
      if (onBackClick) onBackClick();
    }
  };

  render() {
    const {
      className,
      disabled,
      isScannerActive,
      onDeactivateScannerClick
    } = this.props;

    return (
      <div className={classNames('Navbar', className)}>
        <div className="Navbar__group Navbar__group--start">
          <div className={this.state.backButton ? 'scanner__focused' : ''}>
            <Scannable
              onFocus={this.onScannableFocus('backButton')}
              onBlur={this.onScannableBlur('backButton')}
            >
              {/* === NOSSO ID btn-home AQUI === */}
              <Button
                id="btn-home"
                color="inherit"
                onClick={this.handleHomeOrBackClick}
                startIcon={disabled ? <HomeIcon /> : <ArrowBackIcon />}
                style={{ textTransform: 'none', marginLeft: '8px' }}
              />
            </Scannable>
          </div>
          {isScannerActive && (
            <div
              className={
                this.state.deactivateScannerButton ? 'scanner__focused' : ''
              }
            >
              <IconButton
                className="Navbar__deactivateScanner"
                onClick={onDeactivateScannerClick}
              >
                <ScannerDeactivateIcon />
              </IconButton>
            </div>
          )}
        </div>

        <div className="Navbar__group Navbar__group--end">
          <React.Fragment>
            {/* === NOSSO ID btn-tela-cheia AQUI (envolvido em uma div para garantir que o contorno e o clique funcionem) === */}
            {!isCordova() && (
              <div
                id="btn-tela-cheia"
                onClick={e => {
                  const btn = e.currentTarget.querySelector('button');
                  if (btn) btn.click();
                }}
              >
                <FullScreenButton />
              </div>
            )}
          </React.Fragment>
        </div>
      </div>
    );
  }
}

Navbar.propTypes = {
  className: PropTypes.string,
  disabled: PropTypes.bool,
  onBackClick: PropTypes.func,
  isScannerActive: PropTypes.bool,
  onDeactivateScannerClick: PropTypes.func,
  history: PropTypes.object.isRequired
};

export default withRouter(injectIntl(Navbar));
