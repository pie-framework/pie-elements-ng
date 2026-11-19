import React, { useId } from 'react';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import { styled } from '@mui/material/styles';
import { LETTER_VARIANTS_HELP } from '@pie-element/shared-controller-utils';

/** The help text under each spelling-variant toggle, its Arabic letters marked as Arabic. */
export const LetterVariantsHelp = () => (
  <>
    {LETTER_VARIANTS_HELP.map((part, index) => (
      <React.Fragment key={index}>{typeof part === 'string' ? part : <bdi lang="ar">{part.ar}</bdi>}</React.Fragment>
    ))}
  </>
);

const HelpText: any = styled('p')(({ theme }) => ({
  margin: 0,
  maxWidth: '230px',
  color: theme.palette.text.secondary,
  fontSize: theme.typography.fontSize - 2,
}));

const ToggleContainer: any = styled('div')(({ theme }) => ({
  marginRight: theme.spacing(2.5),
}));

type LetterVariantsAreaToggleProps = {
  checked: boolean;
  /** The area's index in the markup; the accessible name counts from 1. */
  responseAreaIndex: number;
  onChange: (checked: boolean) => void;
};

/** A response area's spelling-variant toggle, named with the area's number and described by the help text. */
export const LetterVariantsAreaToggle = ({ checked, responseAreaIndex, onChange }: LetterVariantsAreaToggleProps) => {
  const helpId = useId();

  return (
    <ToggleContainer>
      <FormControlLabel
        label="Accept Arabic spelling variants"
        control={
          <Switch
            checked={checked}
            onChange={(event) => onChange(event.target.checked)}
            slotProps={{
              input: {
                'aria-label': `Accept Arabic spelling variants for response area ${responseAreaIndex + 1}`,
                'aria-describedby': helpId,
              },
            }}
          />
        }
      />
      <HelpText id={helpId}>
        <LetterVariantsHelp />
      </HelpText>
    </ToggleContainer>
  );
};

/**
 * `perChoice` with area `areaKey` set to `checked`, as a dense array: an entry that is not `true`,
 * a hole or a stored `null` included, becomes `false`.
 */
export const withAreaFold = (perChoice: unknown, areaKey: string, checked: boolean): boolean[] => {
  const current: unknown[] = Array.isArray(perChoice) ? perChoice : [];
  const index = Number(areaKey);
  const next = Array.from({ length: Math.max(current.length, index + 1) }, (_, i) => current[i] === true);

  next[index] = checked;

  return next;
};
