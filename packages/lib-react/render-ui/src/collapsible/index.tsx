// @ts-nocheck
/**
 * @synced-from pie-lib/packages/render-ui/src/collapsible/index.jsx
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @synced-date 2026-01-30
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import { styled } from '@mui/material/styles';
import Collapse from '@mui/material/Collapse';
import { renderMath } from '@pie-element/shared-math-rendering-katex';
import PropTypes from 'prop-types';

const Title: any = styled('span')(({ theme }) => ({
  color: theme.palette.primary.light,
  borderBottom: `1px dotted ${theme.palette.primary.light}`,
  cursor: 'pointer',
}));

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
    const title = this.state.expanded ? labels.visible || 'Hide' : labels.hidden || 'Show';

    return (
      <div className={className} ref={(r) => (this.root = r)}>
        <div onClick={this.toggleExpanded}>
          <Title>{title}</Title>
        </div>
        <StyledCollapse in={this.state.expanded} timeout={{ enter: 225, exit: 195 }} unmountOnExit>
          {children}
        </StyledCollapse>
      </div>
    );
  }
}

export default Collapsible;
