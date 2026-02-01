// @ts-nocheck
/**
 * @synced-from pie-lib/packages/charting/src/tool-menu.jsx
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { color } from '@pie-lib/render-ui';

import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Translator from '@pie-lib/translator';

const { translator } = Translator;

const StyledMiniButton: any = styled(Button)(({ theme, selected, disabled }) => ({
  color: color.text(),
  border: `1px solid ${color.secondary()}`,
  fontSize: theme.typography.fontSize,
  ...(selected && {
    backgroundColor: color.background(),
    '& span': {
      color: color.primaryDark(),
    },
  }),
  ...(!selected &&
    !disabled && {
      '& span': {
        color: color.primary(),
      },
      backgroundColor: color.background(),
    }),
  ...(disabled && {
    '& span': {
      color: color.primary(),
    },
    backgroundColor: color.disabled(),
  }),
}));

export const MiniButton = (props) => {
  const { disabled, selected, value, onClick } = props;

  return (
    <StyledMiniButton
      size="small"
      disabled={disabled}
      selected={selected}
      color={selected ? 'secondary' : 'default'}
      value={value}
      key={value}
      variant="outlined"
      onClick={onClick}
    >
      {value}
    </StyledMiniButton>
  );
};
MiniButton.propTypes = {
  disabled: PropTypes.bool,
  className: PropTypes.string,
  selected: PropTypes.bool,
  value: PropTypes.string,
  onClick: PropTypes.func,
};

export class ToolMenu extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    addCategory: PropTypes.func,
    disabled: PropTypes.bool,
    language: PropTypes.string,
  };

  static defaultProps = {};

  render() {
    const { className, disabled, addCategory, language } = this.props;

    return (
      <div className={className}>
        {!disabled && (
          <MiniButton value={translator.t('charting.addCategory', { lng: language })} onClick={addCategory} />
        )}
      </div>
    );
  }
}

export default ToolMenu;
