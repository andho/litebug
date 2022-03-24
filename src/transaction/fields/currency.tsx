import React from 'react';
import { Autocomplete, TextField, } from '@mui/material';

import { StandardProps, ControlledProps } from './common';
import { useController } from 'react-hook-form';

import { FireflyContext } from '../../firefly/context';

type CurrencyProps = StandardProps & ControlledProps & {
  name: 'foreign_currency',
};

export default function CurrencyField({ control, label, index }: CurrencyProps) {
  const { field, fieldState } = useController({
    control,
    name: `transactions.${index}.foreign_currency` as const,
  });
  const { state: { data: { currencies } } } = React.useContext(FireflyContext);

  // TODO: filter out the currency of the currently selected source account

  return (
    <Autocomplete
      size="small"
      options={currencies}
      getOptionLabel={currency => currency.name}
      onChange={(e, value) => { field.onChange(value); }}
      value={field.value}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Foreign Currency"
          error={fieldState.invalid}
        />)
      }
    />
  );
}
