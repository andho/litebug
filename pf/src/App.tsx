import React from 'react';
import { Container, Box, CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';

import AdapterMoment from '@mui/lab/AdapterMoment';
import LocalizationProvider from '@mui/lab/LocalizationProvider';

import { ConfigContext, ConfigView } from './config';
import Form from './transaction/form';
import theme from './theme';
import './App.css';

function AppContainer() {
  const { fireflyPat, fireflyUrl } = React.useContext(ConfigContext); 

  if (!fireflyPat || !fireflyUrl ) {
    return <ConfigView />;
  }

  return <Form />;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterMoment}>
        <AppContainer/>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
