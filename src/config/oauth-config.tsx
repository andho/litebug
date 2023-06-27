import React from 'react';
import { TextField, Button, Box, Stack, Link,
  Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { ConfigContext } from '../config';
import { Controller, useForm } from 'react-hook-form';
import { generateCodeChallenge, generateCodeVerifier } from '../crypto';

type OAuthData = {
  fireflyUrl: string;
  fireflyClientId: string;
  fireflyRedirectUri: string;
};

export function OAuthConfigView() {
  const navigate = useNavigate();
  const config = React.useContext(ConfigContext); 
  const { control, handleSubmit } = useForm<OAuthData>({
    defaultValues: {
      fireflyUrl: config.fireflyUrl,
      fireflyClientId: config.fireflyClientId,
      fireflyRedirectUri: config.fireflyRedirectUri,
    },
  });


  const onSubmit = () => {
    handleSubmit(async (data: OAuthData) => {
      config.setConfig({
        ...config,
        loading: false,
        ...data,
      });
      const redirect_uri = encodeURIComponent(data.fireflyRedirectUri);
      const code_verifier = generateCodeVerifier();
      window.sessionStorage.setItem('code_verifier', code_verifier);
      const code_challenge = await generateCodeChallenge(code_verifier);
      window.location.assign(`${data.fireflyUrl}/oauth/authorize?response_type=code&client_id=${data.fireflyClientId}&code_challenge=${code_challenge}&code_challenge_method=S256&redirect_uri=${redirect_uri}`);
    })();
  };
  const styles = { width: '400px' }
  return (
    <Stack alignItems='center' spacing={3} sx={{ mt: 4 }}>
      <Box sx={styles}>
        <Typography>
          For OAuth you need to provide your firefly instance URL and an OAuth
          Client ID that you have created on your firefly instance.
          You can find instructions to create an OAuth Client here 
          {' '}
          <Link
            href="https://docs.firefly-iii.org/firefly-iii/api/#authentication"
            target="_blank"
            rel="noopener">
            here
          </Link>.
        </Typography>
      </Box>
      <Box sx={styles}>
        <Controller
          control={control}
          name="fireflyUrl"
          rules={{ required: "Firefly URL is required" }}
          render={({ field: { value, onChange }, fieldState: { error } }) => (
            <TextField
              name="fireflyUrl"
              label="Firefly URL"
              fullWidth
              value={value}
              onChange={onChange}
              helperText={error?.message}
              error={!!error}
            />
          )}/>
      </Box>
      <Box sx={styles}>
        <Controller
          control={control}
          name="fireflyClientId"
          rules={{ required: "Firefly Client ID is required" }}
          render={({ field: { value, onChange }, fieldState: { error } }) => (
            <TextField
              name="fireflyClientId"
              label="Firefly Client ID"
              fullWidth
              value={value}
              onChange={onChange}
              helperText={error?.message}
              error={!!error}
            />
          )}/>
      </Box>
      <Box sx={styles}>
        <Controller
          control={control}
          name="fireflyRedirectUri"
          rules={{ required: "Firefly Redirect URI is required" }}
          render={({ field: { value, onChange }, fieldState: { error } }) => (
            <TextField
              name="fireflyRedirectUri"
              label="Firefly Redirect URI"
              fullWidth
              value={value}
              onChange={onChange}
              helperText={error?.message}
              error={!!error}
            />
          )}/>
      </Box>
      <Box sx={styles}>
        <Button fullWidth variant="contained" onClick={onSubmit}>Save</Button>
      </Box>
      <Box sx={styles}>
        <Button
          fullWidth
          variant="contained"
          color="error"
          onClick={() => { navigate('/config')}}
        >
          Go back
        </Button>
      </Box>
    </Stack>
  );
}

export default OAuthConfigView;
