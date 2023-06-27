import { Container, Typography } from '@mui/material';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ConfigContext } from '../config';

type OAuthCodeResponse = {
  token_type: 'Bearer';
  expires_in: number;
  access_token: string;
  refresh_token: string;
};

type AuthStatus = 'Init' | 'In Progress' | 'Done' | 'Error';

const OAuthHandle = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<AuthStatus>('Init');
  const config = React.useContext(ConfigContext); 
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const getCode = async () => {
      if (!config.fireflyUrl || !config.fireflyClientId) {
        return;
      }

      const code_verifier = window.sessionStorage.getItem('code_verifier');
      const code = searchParams.get('code');
      const url = `${config.fireflyUrl}/oauth/token`;
      
      try {
        setStatus('In Progress');
        const res = await axios({
          url,
          method: 'POST',
          data: {
            grant_type: 'authorization_code',
            client_id: config.fireflyClientId,
            code_verifier,
            code,
            redirect_uri: config.fireflyRedirectUri,
          },
        });

        const data = res.data as OAuthCodeResponse;

        config.setConfig({
          ...config,
          fireflyAccessToken: data.access_token,
          fireflyRefreshToken: data.refresh_token,
          fireflyPat: undefined,
        });
        setStatus('Done');
        navigate('/');
      } catch(e) {
        setStatus('Error');
      }
    };

    getCode();
  }, [searchParams, config, navigate]);

  return (
    <Container>
      <Typography>{status}</Typography>
    </Container>
  );
};

export default OAuthHandle;
