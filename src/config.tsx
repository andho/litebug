import React from 'react';
import { TextField, Button, Box, Stack, Link,
  Typography } from '@mui/material';
import { AxiosInstance } from 'axios';
import { useNavigate } from 'react-router-dom';

import fireflyApi, { FIREFLY_CONFIG_KEY } from './firefly/api';

type Config = {
  loading: boolean,
  fireflyPat: string | null,
  fireflyUrl: string | null,
  fireflyApi: AxiosInstance,
};

const initialConfig: Config = {
  loading: true,
  fireflyPat: null,
  fireflyUrl: null,
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
  const [config, setConfig] = React.useState<Config>(initialConfig);

  const loadData = () => {
    const dataString = window.localStorage.getItem(FIREFLY_CONFIG_KEY);
    if (!dataString) {
      setConfig((current) => ({...current, loading: false}));
      return;
    }

    const data = JSON.parse(dataString) as Config;
    setConfig({...data, loading: false});
  };

  React.useEffect(() => {
    loadData();
  }, []);

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
  const [fireflyPat, setFireflyPat] = React.useState('');
  const [fireflyUrl, setFireflyUrl] = React.useState('');
  const [patError, setPatError] = React.useState<string | null>(null);
  const [urlError, setUrlError] = React.useState<string | null>(null);

  const {
    fireflyPat: configFireflyPat,
    fireflyUrl: configFireflyUrl,
    fireflyApi,
    setConfig
  } = React.useContext(ConfigContext); 

  React.useEffect(() => {
    if (configFireflyPat && configFireflyUrl) {
      //navigate('/');
    }
    setFireflyPat(configFireflyPat ?? '');
    setFireflyUrl(configFireflyUrl ?? '');
  }, [configFireflyPat, configFireflyUrl]);

  const onSubmit = () => {
    if (!fireflyPat) {
      setPatError("PAT is required");
    } else {
      setPatError(null);
    }

    if (!fireflyUrl) {
      setUrlError("Url is required");
    } else {
      setUrlError(null);
    }

    if (!fireflyPat || !fireflyUrl) {
      return;
    }

    setConfig({
      loading: false,
      fireflyUrl,
      fireflyPat,
      fireflyApi,
    });

    navigate('/');
  };
  const styles = { width: '400px' }
  return (
    <Stack alignItems='center' spacing={3} sx={{ mt: 4 }}>
      <Box sx={styles}>
        <Typography>
          Hi. Welcome to litebug, a rapid data entry interface for firefly iii.
          Fill up the form below to get started. You can find instructions to
          create a PAT token <Link href="https://docs.firefly-iii.org/firefly-iii/api/#personal-access-token">here</Link>.
        </Typography>
      </Box>
      <Box sx={styles}>
        <TextField
          name="fireflyUrl"
          label="Firefly URL"
          fullWidth
          value={fireflyUrl ?? configFireflyUrl}
          onChange={(e) => setFireflyUrl(e.target.value)}
          helperText={urlError}
        />
      </Box>
      <Box sx={styles}>
        <TextField
          name="fireflyPat"
          label="Firefly PAT"
          fullWidth
          value={fireflyPat ?? configFireflyPat}
          onChange={(e) => setFireflyPat(e.target.value)}
          multiline
          minRows="12"
          maxRows="12"
          helperText={patError}
        />
      </Box>
      <Box sx={styles}>
        <Button fullWidth variant="contained" onClick={onSubmit}>Save</Button>
      </Box>
      <Box sx={styles}>
        <Button
          fullWidth
          disabled={!configFireflyPat || !configFireflyUrl}
          variant="contained"
          color="error"
          onClick={() => { navigate('/')}}
        >
          Cancel
        </Button>
      </Box>
    </Stack>
  );
}
