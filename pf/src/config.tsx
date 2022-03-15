import React from 'react';
import { TextField, Button } from '@mui/material';
import { AxiosInstance } from 'axios';

import fireflyApi, { FIREFLY_CONFIG_KEY } from './firefly/api';

type Config = {
  fireflyPat: string | null,
  fireflyUrl: string | null,
  fireflyApi: AxiosInstance,
};

const initialConfig: Config = {
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
      return;
    }

    const data = JSON.parse(dataString) as Config;
    setConfig(data);
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
      fireflyUrl,
      fireflyPat,
      fireflyApi,
    });
  };
  return (
    <>
      <TextField
        name="fireflyUrl"
        label="Firefly URL"
        value={fireflyUrl ?? configFireflyUrl}
        onChange={(e) => setFireflyUrl(e.target.value)}
      />
      <TextField
        name="fireflyPat"
        label="Firefly PAT"
        value={fireflyPat ?? configFireflyPat}
        onChange={(e) => setFireflyPat(e.target.value)}
        multiline
        minRows="3"
      />
      <Button onClick={onSubmit}>Save</Button>
    </>
  );
}
