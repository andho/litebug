import React from 'react';
import { Box, Stack, Link,
  Typography, 
  Grid, 
  Paper} from '@mui/material';
import { AxiosInstance } from 'axios';
import { useNavigate } from 'react-router-dom';

import fireflyApi, { FIREFLY_CONFIG_KEY } from './firefly/api';
import { nord } from './theme';

export type Config = {
  loading: boolean,
  fireflyPat?: string,
  fireflyUrl?: string,
  fireflyApi: AxiosInstance,
  fireflyClientId?: string,
  fireflyAccessToken?: string;
  fireflyRefreshToken?: string;
};

const initialConfig: Config = {
  loading: true,
  fireflyApi: fireflyApi,
};

type ConfigProviderType = Config & {
  setConfig: (config: Config) => void,
};


export const ConfigContext = React.createContext<ConfigProviderType>({
  ...initialConfig,
  setConfig: (config: Config) => {},
});

export const ConfigProvider: React.FC<{}> = ({ children }) => {
  const [config, setConfig] = React.useState<Config>(() => {
    const dataString = window.localStorage.getItem(FIREFLY_CONFIG_KEY);
    if (!dataString) {
      return initialConfig;
    }

    return JSON.parse(dataString) as Config;
  });

  const setFireflyConfig = (config: Config) => {
    window.localStorage.setItem(FIREFLY_CONFIG_KEY, JSON.stringify(config));
    setConfig(config);
  };

  return (
    <ConfigContext.Provider value={{...config, setConfig: setFireflyConfig}}>
      { children }
    </ConfigContext.Provider>
  );
};

export function ConfigView() {
  const navigate = useNavigate();

  const styles = { width: '600px' }
  return (
    <Stack alignItems='center' spacing={3} sx={{ mt: 4 }}>
      <Box sx={styles}>
        <Typography>
          Hi. Welcome to litebug, a rapid data entry interface for firefly iii.
          Please choose an authentication method below.
        </Typography>
      </Box>
      <Grid container spacing={2} sx={styles}>
        <Grid item xs={6}>
          <Paper sx={{
            backgroundColor: nord.container,
            p: 2,
          }}>
            <Link onClick={() => navigate("/oauth")}>OAuth</Link>
          </Paper>
        </Grid>
        <Grid item xs={6}>
          <Paper sx={{
            backgroundColor: nord.container,
            p: 2,
          }}>
            <Link onClick={() => navigate("/config/pat")}>Personal Access Token (PAT)</Link>
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
}
