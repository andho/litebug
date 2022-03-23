import { createTheme } from '@mui/material/styles';

const style = {
  palette: {
    palette: {
      background: {
        default: '#434C5E',
      },
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          fontSize: '1rem',
        },
      },
    },
  },
};

export const nord = {
  background: '#434C5E',
  container: '#4C566A',
  field: '#3B4252',
  text: '#ECEFF4',
  textLight: '#9298A6',
  frosted: [
    '#8FBCBB',
    '#88C0D0',
    '#81A1C1',
    '#5E81AC',
  ],
  aurora: [
    '#BF616A',
    '#D08770',
    '#EBCB8B',
    '#A3BE8C',
    '#B48EAD',
  ],
};


export default createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#434C5E',
    },
    primary: {
      main: '#A3BE8C',
    },
    error: {
      main: nord.aurora[0],
    },
    text: {
      primary: '#ECEFF4',
    },
  },
  components: {
    MuiFormControl: {
      defaultProps: {
        sx: {
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
      styleOverrides: {

      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: nord.field,
          borderRadius: 14,
          borderColor: nord.field,
        },
        notchedOutline: {
          border: 0,
        },
      },
    },
  },
});
