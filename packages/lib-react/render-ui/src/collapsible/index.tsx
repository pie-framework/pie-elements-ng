// @ts-nocheck

import React from 'react';
import { styled } from '@mui/material/styles';
import Collapse from '@mui/material/Collapse';
import { renderMath } from '@pie-element/shared-math-rendering-mathjax';
import Translator from '@pie-lib/translator';
import PropTypes from 'prop-types';
import * as color from '../color.js';
import { createUniqueId } from '../unique-id.js';

const { translator } = Translator;

// --pie-tertiary is the theming contract's link-text token, held to 4.5:1 against
// --pie-background in every scheme; --pie-primary carries no text-contrast guarantee.
const Toggle: any = styled('button')({
  display: 'inline-block',
  minHeight: '24px',
  padding: 0,
  border: 0,
  background: 'transparent',
  font: 'inherit',
  textAlign: 'inherit',
  color: color.tertiary(),
  cursor: 'pointer',
});

const Title: any = styled('span')({
  borderBottom: '1px dotted currentColor',
});

const StyledCollapse: any = styled(Collapse)(({ theme }) => ({
  paddingTop: theme.spacing(2),
}));

export class Collapsible extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    children: PropTypes.object,
    labels: PropTypes.shape({
      visible: PropTypes.string,
      hidden: PropTypes.string,
    }),
    /** The item language, which the default "Show" and "Hide" labels follow. */
    language: PropTypes.string,
  };

  static defaultProps = {
    labels: {},
  };

  state = {
    expanded: false,
  };

  panelId = createUniqueId('pie-collapsible');

  toggleExpanded: any = () => {
    this.setState((state) => ({ expanded: !state.expanded }));
  };

  componentDidMount() {
    renderMath(this.root);
  }

  componentDidUpdate() {
    renderMath(this.root);
  }

  render() {
    const { labels, children, className, language } = this.props;
    const { expanded } = this.state;
    const title = expanded
      ? labels.visible || translator.t('common:hide', { lng: language })
      : labels.hidden || translator.t('common:show', { lng: language });

    return (
      <div className={className} ref={(r) => (this.root = r)}>
        <div>
          <Toggle type="button" aria-expanded={expanded} aria-controls={this.panelId} onClick={this.toggleExpanded}>
            <Title>{title}</Title>
          </Toggle>
        </div>
        <div id={this.panelId}>
          <StyledCollapse in={expanded} timeout={{ enter: 225, exit: 195 }} unmountOnExit>
            {children}
          </StyledCollapse>
        </div>
      </div>
    );
  }
}

export default Collapsible;
