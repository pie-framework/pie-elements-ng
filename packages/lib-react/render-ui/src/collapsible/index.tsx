// @ts-nocheck

import React from 'react';
import { styled } from '@mui/material/styles';
import Collapse from '@mui/material/Collapse';
import { renderMath } from '@pie-element/shared-math-rendering-mathjax';
import PropTypes from 'prop-types';
import * as color from '../color.js';

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
  };

  static defaultProps = {
    labels: {},
  };

  state = {
    expanded: false,
  };

  // Random rather than a counter or useId: each element bundles its own copy of this
  // module and mounts its own React root, so neither is unique on a page.
  panelId = `pie-collapsible-${Math.random().toString(36).slice(2, 10)}`;

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
    const { labels, children, className } = this.props;
    const { expanded } = this.state;
    const title = expanded ? labels.visible || 'Hide' : labels.hidden || 'Show';

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
