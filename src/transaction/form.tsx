import React from 'react';
import { TextField, Autocomplete, Button, Box,
  Grid, Paper,
  AppBar, Typography, Divider, IconButton, Toolbar,
  ToggleButton, ToggleButtonGroup } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsIcon from '@mui/icons-material/Settings';
import { DatePicker } from '@mui/lab';
import { useForm, useFieldArray, useWatch, useController, Control, } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import _ from 'lodash';
import currency from 'currency.js';

import { nord } from '../theme';

import { FireflyContext } from '../firefly/context';
import { Account, AccountType, accountRoles, getAccountById } from '../firefly/accounts';
import { Currency, } from '../firefly/currency';
import { Budget, getBudgetById } from '../firefly/budget';
import { Category, getCategoryById } from '../firefly/category';
import {
  RawTransaction,
  TransactionGroup,
  storeNewTransaction,
  TransactionAutocomplete,
  transactionAutocomplete,
  fetchTransactionById,
  getTransactionType,
} from '../firefly/transaction';

const defaultSourceTypes = [AccountType.Asset, AccountType.Revenue];
const defaultDestinationTypes = [AccountType.Asset, AccountType.Expense];

const sx = {
  maxWidth: '100%',
};

type TransactionValues = {
  description: string,
  source: Account | null,
  destination: Account | null,
  amount: string,
  foreign_currency: Currency | null,
  foreign_amount: string | null,
  budget: Budget | null,
  category: Category | null,
  taxRate: boolean,
};

type FormValues = {
  transactions: TransactionValues[];
  taxFormula: string;
  transactionDate: Date;
  group_title: string;
};

const defaults = {
  description: '',
  source: null,
  destination: null,
  amount: '',
  foreign_currency: null,
  foreign_amount: '',
  budget: null,
  category: null,
  taxRate: true,
};

export default function Form() {
  const {
    state: {
      data: {
        accounts,
        budgets,
        categories,
      },
    },
    refreshData,
  } = React.useContext(FireflyContext);
  const navigate = useNavigate();

  const { handleSubmit, control, reset, setValue, setFocus } = useForm<FormValues>({
    defaultValues: {
      transactions: [{...defaults}],
      transactionDate: new Date(),
      taxFormula: 'taxInclusive',
      group_title: '',
    },
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'transactions',
  });

  const onSubmit = handleSubmit((data) => {
    const firstSource = data.transactions[0].source;
    const firstDestination = data.transactions[0].destination;
    if (firstSource === null || firstDestination === null) {
      console.error("The source or destination on the first transaction is not set");
    } else {
      const taxFormula = data.taxFormula === 'taxInclusive' ? taxInclusiveFormula : taxExclusiveFormula;
      const transactions = data.transactions.map(transaction => ({
        source: firstSource as Account,
        destination: transaction.destination as Account,
        description: transaction.description,
        foreign_currency: null,
        foreign_amount: null,
        budget: transaction.budget,
        category: transaction.category,
        amount: ""+taxFormula(transaction).afterTax.value,
        date: data.transactionDate,
        currency: {
          id: transaction.source?.currency_id ?? firstSource.currency_id,
          name: '',
          code: transaction.source?.currency_code ?? firstSource.currency_code,
          symbol: transaction.source?.currency_symbol ?? firstSource.currency_symbol,
          decimal_places: transaction.source?.currency_decimal_places ?? firstSource.currency_decimal_places,
        } as Currency,
        tags: transaction.taxRate ? ['gst-inclusive'] : [],
        type: getTransactionType(transaction.source || firstSource, transaction.destination || firstDestination),
      }));
      const transactionGroup: TransactionGroup = {
        id: '',
        transactions: transactions,
        group_title: data.group_title,
      };

      const transactionDate = data.transactionDate;
      storeNewTransaction(transactionGroup).then(() => {
        reset();
        setValue('transactionDate', transactionDate);
      });
    }
  });

  const addSplit = () => {
    append({...defaults});
  };

  React.useEffect(() => {
    setFocus('transactions.0.description');
  }, [setFocus]);

  const onRefresh = () => {
    refreshData();
  };

  const loadTransaction = (transactionId: string, description: string, index: number) => {
    fetchTransactionById(transactionId).then(transaction => {
      const theTransaction = transaction.data.attributes.transactions.filter(
        (transaction: RawTransaction) => {
          if (transaction.description === description) {
            return true;
          }

          return false;
        }
      )[0]
      const source = getAccountById(accounts, theTransaction.source_id);
      const destination = getAccountById(accounts, theTransaction.destination_id);
      setValue(`transactions.${index}.source`, source);
      setValue(`transactions.${index}.destination`, destination);

      if (theTransaction.budget_id !== '0') {
        try {
          const budget = getBudgetById(budgets, theTransaction.budget_id);
          setValue(`transactions.${index}.budget`, budget);
        } catch (e) {
          console.error(e);
        }
      }

      if (theTransaction.category_id !== '0') {
        try {
          const category = getCategoryById(categories, theTransaction.category_id);
          setValue(`transactions.${index}.category`, category);
        } catch (e) {
          console.error(e);
        }
      }

      setValue(`transactions.${index}.amount`, Number(theTransaction.amount).toString());
    });
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, m: 2 }}>
            LiteBug
          </Typography>
          <IconButton onClick={()=>{navigate('/config')}} aria-label="Config">
            <SettingsIcon />
          </IconButton>
          <IconButton onClick={onRefresh} aria-label="Refresh Data">
            <RefreshIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <form onSubmit={onSubmit}>
        <Box sx={{
          flexDirection: 'row',
          display: 'flex',
        }}>
          <Box sx={{
            maxWidth: 400,
          }}>
            <Box sx={{
              m: 2
            }}>
              <Box sx={{
                p: 2
              }}>
                <GroupTitleField control={control} />
                <DateField control={control} />
              </Box>
              <TaxFormulaField control={control} />
              <Divider sx={{ my: 1 }} />
              <Summary control={control} />
              <Button fullWidth sx={{ mt: 2 }} variant="contained" type="submit">Submit</Button>
            </Box>
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Box
              sx={{
                flexDirection: 'column',
                  display: 'flex',
                  margin: 2,
              }}
            >
            {fields.map((field, index) => (
              <Paper elevation={1} sx={{
                backgroundColor: nord.container,
                p: 2,
                mt: index === 0 ? 0 : 2,
              }}>
                <Grid container rowSpacing={2} columnSpacing={2} key={field.id} sx={{ alignItems: "center" }}>
                  <Grid item xs={3}>
                    <DescriptionField {...{control, index, loadTransaction}} />
                  </Grid>
                  <Grid item xs={3}>
                    <SourceAccountField {...{control, index}} />
                  </Grid>
                  <Grid item xs={3}>
                    <DestinationAccountField {...{control, index}} />
                  </Grid>
                  <Grid item xs={3}>
                    <AmountField {...{control, index}} />
                  </Grid>
                  <Grid item xs={3}>
                    <BudgetField {...{control, index}} />
                  </Grid>
                  <Grid item xs={3}>
                    <CategoryField {...{control, index}} />
                  </Grid>
                  <Grid item xs={3}>
                    <TaxRateField {...{control, index}} />
                  </Grid>
                  <Grid item xs={3} sx={{ display: 'flex', flexDirection: 'row-reverse' }}>
                    <Button
                      variant="contained"
                      onClick={() => remove(index)}
                      size="small"
                      color="error"
                    >
                      Remove
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            ))}
            </Box>
            <Box sx={{ px: 2 }}>
              <Button variant="outlined" onClick={addSplit}>Add another split</Button>
            </Box>
          </Box>
        </Box>
      </form>
    </>
  );
}

type DescriptionOption = TransactionAutocomplete | string;

type DescriptionProps = ControlledProps & {
  loadTransaction: (transactionId: string, description: string, index: number) => void;
};

function DescriptionField({ control, index, loadTransaction }: DescriptionProps) {
  const [inputValue, setInputValue] = React.useState('');
  const [options, setOptions] = React.useState<Array<DescriptionOption>>([]);
  const [loading, setLoading] = React.useState(false);
  const { field, fieldState } = useController({
    control,
    name: `transactions.${index}.description` as const,
    rules: { required: true },
  });

  const loadOptions = (input: string) => {
    return transactionAutocomplete(input);
  };

  const inputHandler = (input: string) => {
    if (input.length >= 3) {
      setLoading(true);
      setOptions([]);
      loadOptions(input).then((options: DescriptionOption[]) => {
        setOptions(options);
        setLoading(false);
      });
    }
    setInputValue(input);
  };

  return (
    <Autocomplete
      onChange={(e, value) => {
        if (typeof value !== 'string' && value !== null) {
          loadTransaction(value.transaction_group_id, value.description, index);
          field.onChange(value.description);
          return;
        }
        field.onChange(value);
      }}
      size="small"
      sx={{ ...sx }}
      value={field.value}
      id="description"
      options={options}
      getOptionLabel={transaction => {
        if (typeof transaction !== 'string') {
          return transaction.description;
        } else {
          return transaction;
        }
      }}
      loading={loading}
      inputValue={inputValue}
      onInputChange={(e, newInputValue) => {
        inputHandler(newInputValue);
      }}
      filterOptions={x => x}
      freeSolo
      autoHighlight
      renderInput={(params) => (
        <TextField
          {...params}
          inputRef={field.ref}
          label="Description"
          error={fieldState.invalid}
          helperText={fieldState.error?.message}
        />
      )}
    />
  );
}

interface AccountFieldProps extends StandardProps {
  accountTypes: AccountType[],
  name: string,
  value: Account | null,
  onChange: (value: Account | null) => void,
  error: any | null,
  disabled: boolean,
}

function AccountField(props: AccountFieldProps) {
  const { state: { data: { accounts: accountsData } } } = React.useContext(FireflyContext);

  const accounts = accountsData.filter(account => props.accountTypes.includes(account.type));

  return (
    <Autocomplete
      size="small"
      sx={{ ...sx }}
      options={accounts}
      getOptionLabel={account => account.name}
      groupBy={(account: Account) => {
        if (account.type === AccountType.Asset && account.account_role) {
          return 'Asset: ' + accountRoles[account.account_role];
        } else {
          return _.capitalize(account.type);
        }
      }}
      isOptionEqualToValue={(option, value) => {
        if (!value) {
          return false;
        }
        if (value.id === option.id) {
          return true;
        }

        return false;
      }}
      defaultValue={props.value}
      value={props.value}
      onChange={(e, value) => {
        props.onChange(value);
      }}
      disabled={props.disabled}
      autoHighlight
      renderInput={(params) => (
        <TextField
          {...params}
          label={props.label || props.name}
          error={props.error}
        />)
      }
    />
  );
}

type ControlledProps = {
  control: Control<FormValues>,
  index: number,
};

function SourceAccountField({ control, index }: ControlledProps) {

  const [source, destination] = useWatch({
    name: [
      `transactions.0.source` as const,
      `transactions.0.destination` as const,
    ],
    control,
  });
  const accountTypes = (
    index === 0 && destination?.type === AccountType.Expense ? [AccountType.Asset] : defaultSourceTypes
  ) || (
    index !== 0 && source && [source.type]
  );

  let disabled = false;
  if (index !== 0 && source?.type === AccountType.Asset) {
    disabled = true;
  }

  const { field, fieldState } = useController({
    control,
    name: `transactions.${index}.source` as const,
    rules: { required: !disabled },
  });

  return (
    <AccountField
      value={field.value}
      name={field.name}
      onChange={field.onChange}
      disabled={disabled}
      label="Source Account"
      accountTypes={accountTypes}
      error={fieldState.invalid}
    />
  );
}

function DestinationAccountField({ control, index }: ControlledProps) {

  const [source, destination] = useWatch({
    name: [
      `transactions.0.source` as const,
      `transactions.0.destination` as const,
    ],
    control,
  });
  const accountTypes = source?.type === AccountType.Revenue ? [AccountType.Asset] : defaultDestinationTypes;

  let disabled = false;
  if (index !== 0 && source) {
    if (source.type === AccountType.Asset && destination?.type === AccountType.Asset) {
      disabled = true;
    } else if (source.type === AccountType.Revenue) {
      disabled = true;
    }
  }

  const { field, fieldState } = useController({
    control,
    name: `transactions.${index}.destination` as const,
    rules: { required: !disabled },
  });

  return (
    <AccountField
      value={field.value}
      name={field.name}
      onChange={field.onChange}
      label="Destination Account"
      accountTypes={accountTypes}
      error={fieldState.invalid}
      disabled={disabled}
    />
  );
}

interface StandardProps {
  id?: string;
  label?: string;
}

function BudgetField({ control, index }: ControlledProps) {
  const { field, fieldState } = useController({
    control,
    name: `transactions.${index}.budget` as const,
  });
  const { state: { data: { budgets } } } = React.useContext(FireflyContext);

  return (
    <Autocomplete
      size="small"
      sx={{ ...sx }}
      options={budgets}
      getOptionLabel={budget => budget.name}
      onChange={(e, value) => { field.onChange(value); }}
      value={field.value}
      autoHighlight
      autoSelect
      renderInput={(params) => (
        <TextField
          {...params}
          label="Budget"
          error={fieldState.invalid}
        />)
      }
    />
  );
}

function CategoryField({ control, index }: ControlledProps) {
  const { field, fieldState } = useController({
    control,
    name: `transactions.${index}.category` as const,
  });
  const { state: { data: { categories } } } = React.useContext(FireflyContext);

  return (
    <Autocomplete
      size="small"
      sx={{ ...sx }}
      options={categories}
      getOptionLabel={category => category.name}
      onChange={(e, value) => { field.onChange(value); }}
      value={field.value}
      autoHighlight
      autoSelect
      renderInput={(params) => (
        <TextField
          {...params}
          label="Category"
          error={fieldState.invalid}
        />)
      }
    />
  );
}

function AmountField({ control, index }: ControlledProps) {
  const { field, fieldState } = useController({
    control,
    name: `transactions.${index}.amount` as const,
    rules: { required: true },
  });
  return (
    <TextField
      size="small"
      fullWidth
      onChange={(value) => { field.onChange(value); }}
      value={field.value}
      error={fieldState.invalid}
      label="Amount"
    />
  );
}

type TaxRateOptions = 'taxed' | 'zero-rated';

function TaxRateField({ control, index }: ControlledProps) {
  const { field } = useController({
    control,
    name: `transactions.${index}.taxRate` as const,
  });

  const handleChange = (value: TaxRateOptions) => {
    console.log('Changed to ', value);
    field.onChange(value==='taxed' ? true : false);
  };

  console.log(field.value);
  return (
    <ToggleButtonGroup
      value={field.value ? 'taxed' : 'zero-rated'}
      exclusive
      onChange={(e, value) => handleChange(value)}
      aria-label="Tax Rate"
      size="small"
    >
      <ToggleButton value="taxed" aria-label="Taxed">
        Taxed
      </ToggleButton>
      <ToggleButton value="zero-rated" aria-label="Zero Rated">
        Zero Rated
      </ToggleButton>
    </ToggleButtonGroup>
  );
}

function DateField({ control }: { control: Control<FormValues> }) {
  const { field, fieldState } = useController({
    control,
    name: 'transactionDate',
    rules: { required: true },
  });

  return (
    <DatePicker
      label="Transaction Date"
      value={field.value}
      onChange={field.onChange}
      renderInput={(params) => (
        <TextField
          {...params}
          size="small"
          fullWidth
          sx={{ mt: 2 }}
          error={fieldState.invalid}
        />
      )}
    />
  );
}

function TaxFormulaField({ control }: { control: Control<FormValues> }) {
  const { field } = useController({
    control,
    name: 'taxFormula',
  });

  return (
    <ToggleButtonGroup
      value={field.value}
      exclusive
      onChange={(e, value) => field.onChange(value)}
      size="small"
      fullWidth
    >
      <ToggleButton
        value="taxInclusive"
      >Tax Inclusive</ToggleButton>
      <ToggleButton
        value="taxExclusive"
      >Tax Exclusive</ToggleButton>
    </ToggleButtonGroup>
  );
}

function taxInclusiveFormula(transaction: TransactionValues) {
  const taxRate = transaction.taxRate ? "1.06" : "1";

  const afterTax = currency(transaction.amount);
  const beforeTax = afterTax.divide(taxRate);
  const tax = afterTax.subtract(beforeTax);

  return {
    beforeTax,
    tax,
    afterTax: currency(transaction.amount),
  };
}

function taxExclusiveFormula(transaction: TransactionValues) {
  const taxRate = transaction.taxRate ? "0.06" : "0";

  const beforeTax = currency(transaction.amount);
  const tax = beforeTax.multiply(taxRate);
  const afterTax = beforeTax.add(tax);

  return {
    beforeTax,
    tax,
    afterTax,
  };
}


function Summary({ control }: { control: Control<FormValues>}) {
  const rawTransactions = useWatch({ control, name: 'transactions' });
  const taxFormulaString = useWatch({ control, name: 'taxFormula' });
  const taxFormula = taxFormulaString === 'taxInclusive' ? taxInclusiveFormula : taxExclusiveFormula;

  const transactions = rawTransactions.map(transaction => {
    const taxValues = taxFormula(transaction);
    return {
      ...transaction,
      ...taxValues,
    };
  });

  const { tax, total, } = transactions.reduce((acc, transaction) => {
    return {
      gross: acc.gross.add(transaction.beforeTax),
      tax: acc.tax.add(transaction.tax),
      total: acc.total.add(transaction.afterTax),
    };
  }, { gross: currency(0), tax: currency(0), total: currency(0) });

  return (
    <>
      <Typography variant="h6" component="h6" sx={{ mb: 1, mt: 2 }}>Summary</Typography>
      <div>
        {transactions.map((transaction, index) => (
          <Grid container 
            key={index} 
            sx={{
              backgroundColor: (index % 2)!==0 ? nord.container : '',
              px: 1,
              py: 0.5,
            }}
          >
            <Grid item xs={8}>
              <Typography variant="body1">{
                transaction.description ||
                `<Transaction ${index+1}>`
              }</Typography>
            </Grid>
            <Grid item xs={1} sx={{ textAlign: 'right' }}>
              <Typography variant="body1">{''+transaction.tax}</Typography>
            </Grid>
            <Grid item xs={3} sx={{ textAlign: 'right' }}>
              <Typography variant="body1">{''+transaction.afterTax}</Typography>
            </Grid>
          </Grid>
        ))}
      </div>
      <Divider sx={{ my: 1 }} />
      <Grid container sx={{
        px: 1,
      }}>
        <Grid item xs={8}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Total</Typography>
        </Grid>
        <Grid item xs={1} sx={{ textAlign: 'right', fontWeight: 'bold' }}>
          <Typography variant="body1">{''+tax}</Typography>
        </Grid>
        <Grid item xs={3} sx={{ textAlign: 'right', fontWeight: 'bold' }}>
          <Typography variant="body1">{''+total}</Typography>
        </Grid>
      </Grid>
    </>
  );
}

function GroupTitleField({ control }: { control: Control<FormValues> }) {
  const transactions = useWatch({
    control,
    name: 'transactions',
  });
  const { field, fieldState } = useController({
    control,
    name: 'group_title',
    rules: { required: transactions.length > 1 },
  });

  return (
    <TextField
      label="Group Title"
      size="small"
      fullWidth
      value={field.value || ''}
      onChange={(e) => field.onChange(e.target.value)}
      error={fieldState.invalid}
    />
  );
}
