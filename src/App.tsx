import React from 'react';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { Routes, Route, useNavigate, } from 'react-router-dom';

import AdapterMoment from '@mui/lab/AdapterMoment';
import LocalizationProvider from '@mui/lab/LocalizationProvider';

import { ConfigContext, ConfigView } from './config';
import Form from './transaction/form';
import theme from './theme';
import './App.css';

function AppContainer() {
  return (
    <Routes>
      <Route path="/" element={<AuthRequired><Form /></AuthRequired>} />
      <Route path="/config" element={<ConfigView />} />
    </Routes>
  );
}

const AuthRequired = ({ children }: { children: JSX.Element }) => {
  const { loading, fireflyPat, fireflyUrl } = React.useContext(ConfigContext); 
  const navigate = useNavigate();

  React.useEffect(() => {
    console.log(loading, fireflyPat, fireflyUrl);
    if (!loading && (!fireflyPat || !fireflyUrl)) {
      navigate('/config');
    }
  }, [loading, fireflyPat, fireflyUrl, navigate]);

  if (loading) {
    return <div>Please wait</div>;
  }

  return children;
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
