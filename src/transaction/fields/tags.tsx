import React from 'react';
import { Autocomplete, TextField, } from '@mui/material';

import { StandardProps, } from './common';

const tags = [
  { label: 'pending' },
];

export function TagsField(props: StandardProps) {
  return (
    <Autocomplete
      size="small"
      options={tags}
      renderInput={(params) => <TextField {...params} label={props.label || props.id} />}
    />
  );
}
