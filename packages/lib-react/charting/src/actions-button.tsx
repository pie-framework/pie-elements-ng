// @ts-nocheck

import React from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

import { color, createUniqueId } from '@pie-lib/render-ui';
import Translator from '@pie-lib/translator';

const { translator } = Translator;

const StyledActions: any = styled('div')(() => ({
  alignSelf: 'flex-end',
}));

// A native button for the role, the tab stop and Enter/Space activation, reset to the plain text
// the trigger was drawn as.
const StyledTrigger: any = styled('button')(({ theme }) => ({
  display: 'block',
  margin: 0,
  border: 0,
  background: 'none',
  font: 'inherit',
  cursor: 'pointer',
  fontSize: theme.typography.fontSize,
  // on the chart's white background whatever the theme, so its color does not follow it
  color: color.defaults.TERTIARY,
  padding: theme.spacing(1),
  // Inset: the trigger sits at the top-left corner of a foreignObject, which clips an outer ring.
  '&:focus-visible': {
    outline: `2px solid ${color.focusOutline()}`,
    outlineOffset: '-2px',
  },
}));

const StyledMenuItem: any = styled(MenuItem)(({ theme }) => ({
  fontSize: theme.typography.fontSize,
  color: color.text(),
}));

export class ActionsButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      actionsAnchorEl: null,
    };
  }

  componentWillUnmount() {
    this.setState({ actionsAnchorEl: null });
  }

  static propTypes = {
    addCategory: PropTypes.func.isRequired,
    deleteCategory: PropTypes.func.isRequired,
    language: PropTypes.string,
    categories: PropTypes.array,
  };

  // names the menu after the trigger
  triggerId = createUniqueId('chart-actions');

  menuId = createUniqueId('chart-actions-menu');

  handleActionsClick: any = (event) => {
    this.setState({ actionsAnchorEl: event.currentTarget });
  };

  handleActionsClose: any = () => {
    this.setState({ actionsAnchorEl: null });
  };

  handleAddCategory: any = () => {
    const { addCategory } = this.props;
    addCategory();
    this.handleActionsClose();
  };

  handleDeleteCategory: any = (index) => {
    const { deleteCategory } = this.props;
    deleteCategory(index);
    this.handleActionsClose();
  };

  render() {
    const { categories, language } = this.props;
    const { actionsAnchorEl } = this.state;
    const open = Boolean(actionsAnchorEl);

    const deletable = (categories || [])
      .map((category, index) => ({ category, index }))
      .filter(({ category }) => category.deletable && !category.correctness);

    return (
      <StyledActions>
        <StyledTrigger
          type="button"
          id={this.triggerId}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? this.menuId : undefined}
          onClick={this.handleActionsClick}
        >
          {translator.t('charting.actions', { lng: language })}
        </StyledTrigger>
       <Menu
          id={this.menuId}
          open={open}
          anchorEl={actionsAnchorEl}
          onClose={this.handleActionsClose}
          variant="menu"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          slotProps={{ list: { 'aria-labelledby': this.triggerId } }}
        >
          <StyledMenuItem onClick={() => this.handleAddCategory()}>
            + {translator.t('charting.add', { lng: language })}
          </StyledMenuItem>
          {deletable.map(({ category, index }) => (
            <StyledMenuItem key={index} onClick={() => this.handleDeleteCategory(index)}>
              {`${translator.t('charting.delete', { lng: language })} <${category.label ||
                translator.t('charting.newLabel', { lng: language })}>`}
            </StyledMenuItem>
          ))}
        </Menu>
      </StyledActions>
    );
  }
}

export default ActionsButton;
