// @ts-nocheck

import React from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Popover from '@mui/material/Popover';
import Paper from '@mui/material/Paper';

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
  color: color.tertiary(),
  padding: theme.spacing(1),
  // Inset: the trigger sits at the top-left corner of a foreignObject, which clips an outer ring.
  '&:focus-visible': {
    outline: `2px solid ${color.focusOutline()}`,
    outlineOffset: '-2px',
  },
}));

const StyledActionsPaper: any = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  '& button': {
    textTransform: 'none',
    fontSize: theme.typography.fontSize,
    color: color.text(),
    justifyContent: 'flex-start',
  },
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

  // names the popover after the trigger
  triggerId = createUniqueId('chart-actions');

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

    return (
      <StyledActions>
        <StyledTrigger
          type="button"
          id={this.triggerId}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={this.handleActionsClick}
        >
          {translator.t('charting.actions', { lng: language })}
        </StyledTrigger>
        <Popover
          key={`actions-popover-${Math.random()}`}
          open={open}
          anchorEl={actionsAnchorEl}
          onClose={this.handleActionsClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          // The popover is modal - it traps focus, closes on Escape and returns focus to the
          // trigger - so it is the dialog aria-haspopup announces.
          slotProps={{ paper: { role: 'dialog', 'aria-labelledby': this.triggerId } }}
        >
          <StyledActionsPaper>
            <Button onClick={() => this.handleAddCategory()}>
              + {translator.t('charting.add', { lng: language })}
            </Button>
            {categories.length > 0 &&
              categories.map(
                (category, index) =>
                  category.deletable &&
                  !category.correctness && (
                    <Button key={index} onClick={() => this.handleDeleteCategory(index)}>
                      {`${translator.t('charting.delete', { lng: language })} <${category.label ||
                        translator.t('charting.newLabel', { lng: language })}>`}
                    </Button>
                  ),
              )}
          </StyledActionsPaper>
        </Popover>
      </StyledActions>
    );
  }
}

export default ActionsButton;
