import React from 'react';
import { Autocomplete, TextField, } from '@mui/material';
import { useController } from 'react-hook-form';

import { ControlledProps } from './common';

export function ForeignAmountField({ control, index }: ControlledProps) {
  const { field, fieldState } = useController({
    control,
    name: `transactions.${index}.foreign_amount` as const,
  });
  return (
    <TextField
      size="small"
      onChange={(value) => { field.onChange(value); }}
      value={field.value}
      error={fieldState.invalid}
      label="Foreign Amount"
    />
  );
}
