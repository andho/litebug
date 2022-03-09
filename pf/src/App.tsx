import React from 'react';
import { Container, Box, CssBaseline } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import AdapterMoment from '@mui/lab/AdapterMoment';
import LocalizationProvider from '@mui/lab/LocalizationProvider';

import { FireflyProvider } from './firefly/context';
import Form from './transaction/form';
import './App.css';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <FireflyProvider>
      <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterMoment}>
          <Form/>
        </LocalizationProvider>
      </FireflyProvider>
    </ThemeProvider>
  );
}

export default App;
