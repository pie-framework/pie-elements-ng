// @ts-nocheck

import React from 'react';
import { styled } from '@mui/material/styles';
import Collapse from '@mui/material/Collapse';
import { renderMath } from '@pie-element/shared-math-rendering-mathjax';
import { catalogs } from '../i18n/index.js';
import PropTypes from 'prop-types';
import * as color from '../color.js';
import { createUniqueId } from '../unique-id.js';

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

/** The catalog keys of each variant's collapsed (`hidden`) and expanded (`visible`) label. */
const VARIANT_LABELS = {
  teacherInstructions: { hidden: 'showTeacherInstructions', visible: 'hideTeacherInstructions' },
  rationale: { hidden: 'showRationale', visible: 'hideRationale' },
};

const DEFAULT_LABELS = { hidden: 'show', visible: 'hide' };

export class Collapsible extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    children: PropTypes.object,
    /** Labels that replace the variant's, each on its own. */
    labels: PropTypes.shape({
      visible: PropTypes.string,
      hidden: PropTypes.string,
    }),
    /** What the panel holds, which picks the toggle's labels; without one they read "Show" and "Hide". */
    variant: PropTypes.oneOf(Object.keys(VARIANT_LABELS)),
    /** The locale the toggle's labels follow. */
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

  /** Re-renders once the item language's catalog lands, for an element that did not preload it. */
  relabel = () => this.forceUpdate();

  componentDidMount() {
    renderMath(this.root);
  }

  componentDidUpdate() {
    renderMath(this.root);
  }

  render() {
    const { labels, children, className, language, variant } = this.props;
    const { expanded } = this.state;
    const i18n = catalogs.forLocale(language, this.relabel);
    const keys = VARIANT_LABELS[variant] ?? DEFAULT_LABELS;
    const title = expanded ? labels.visible || i18n.t(keys.visible) : labels.hidden || i18n.t(keys.hidden);

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
