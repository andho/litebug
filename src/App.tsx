import React from 'react';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { Routes, Route, useNavigate, } from 'react-router-dom';

import { ConfigContext, ConfigView } from './config';
import Form from './transaction/form';
import theme from './theme';
import './App.css';
import Oauth from './config/oauth-config';
import OAuthHandle from './config/oauth-handle';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

function AppContainer() {
  return (
    <Routes>
      <Route path="/" element={<AuthRequired><Form /></AuthRequired>} />
      <Route path="/config" element={<ConfigView />} />
      <Route path="/oauth" element={<Oauth />} />
      <Route path="/oauth/handle" element={<OAuthHandle />} />
    </Routes>
  );
}

const AuthRequired = ({ children }: { children: JSX.Element }) => {
  const { loading, fireflyPat, fireflyUrl, fireflyAccessToken } = React.useContext(ConfigContext); 
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!loading && ((!fireflyPat && !fireflyAccessToken) || !fireflyUrl)) {
      navigate('/config');
    }
  }, [loading, fireflyPat, fireflyUrl, fireflyAccessToken, navigate]);

  if (loading) {
    return <div>Please wait</div>;
  }

  return children;
}


function App() {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppContainer/>
      </ThemeProvider>
    </LocalizationProvider>
  );
}

export default App;
