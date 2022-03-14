import React from 'react';
import { TextField, Autocomplete, Button, Box, Checkbox,
  RadioGroup, Radio, FormControlLabel } from '@mui/material';
import { DatePicker } from '@mui/lab';
import { useForm, useFieldArray, useWatch, Controller, useController, Control, Field } from 'react-hook-form';

import moment, { Moment } from 'moment';
import _ from 'lodash';
import currency from 'currency.js';

import { FireflyContext } from '../firefly/context';
import { Account, AccountType, accountRoles, getAccountById } from '../firefly/accounts';
import { Currency, getCurrencyById } from '../firefly/currency';
import { Budget, getBudgetById } from '../firefly/budget';
import { Category, getCategoryById } from '../firefly/category';
import {
  RawTransaction,
  TransactionGroup,
  Transaction,
  storeNewTransaction,
  TransactionType,
  TransactionAutocomplete,
  transactionAutocomplete,
  fetchTransactionById,
  getTransactionType,
} from '../firefly/transaction';

const defaultSourceTypes = [AccountType.Asset, AccountType.Revenue];
const defaultDestinationTypes = [AccountType.Asset, AccountType.Expense];

const sx = {
  width: 300,
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
      accounts,
      currencies,
      budgets,
      categories,
    },
    refreshData,
  } = React.useContext(FireflyContext);

  const { handleSubmit, control, reset, formState, setValue } = useForm<FormValues>({
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
    console.log(data);
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

      console.log(transactionGroup);
      storeNewTransaction(transactionGroup).then(() => reset());
    }
  });

  const addSplit = () => {
    append({...defaults});
  };

  const onRefresh = () => {
    refreshData();
  };

  React.useEffect(() => {
    refreshData();
  }, []);

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
    <form onSubmit={onSubmit}>
      <Box sx={{ flexDirection: 'column', display: 'flex' }}>
      {fields.map((field, index) => (
        <Box key={field.id} sx={{ flexDirection: 'row', display: 'flex' }}>
          <DescriptionField {...{control, index, loadTransaction}} />
          <SourceAccountField {...{control, index}} />
          <DestinationAccountField {...{control, index}} />
          <AmountField {...{control, index}} />
          <BudgetField {...{control, index}} />
          <CategoryField {...{control, index}} />
          <TaxRate {...{control, index}} />
          <Button
            variant="contained"
            onClick={() => remove(index)}
            size="small"
          >
            Remove
          </Button>
        </Box>
      ))}
      </Box>
      <Button variant="outlined" onClick={addSplit}>Add another split</Button>
      <Button variant="contained" type="submit">Submit</Button>
      <Button onClick={onRefresh}>
        Refresh Data
      </Button><br />
      <GroupTitleField control={control} />
      <DateField control={control} />
      <TaxFormula control={control} />
      <Summary control={control} />
    </form>
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

  let request: ReturnType<typeof setTimeout>;
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
      autoSelect
      renderInput={(params) => (
        <TextField
          {...params}
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
  const { state: { accounts: accountsData } }: { state: { accounts: Account[] } } = React.useContext(FireflyContext);

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

const currencies = [
  { code: 'MVR', shortName: 'Rufiya', name: 'Maldivian Rufiya', label: 'MVR' }
];

type CurrencyProps = StandardProps & ControlledProps & {
  name: 'foreign_currency',
};

function CurrencyField({ control, label, index }: CurrencyProps) {
  const { field, fieldState } = useController({
    control,
    name: `transactions.${index}.foreign_currency` as const,
  });
  const { state: { currencies } } = React.useContext(FireflyContext);

  // TODO: filter out the currency of the currently selected source account

  return (
    <Autocomplete
      size="small"
      sx={{ ...sx }}
      options={currencies}
      getOptionLabel={currency => currency.name}
      onChange={(e, value) => { field.onChange(value); }}
      value={field.value}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Foreign Currency"
          error={fieldState.invalid}
        />)
      }
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
  const { state: { budgets } } = React.useContext(FireflyContext);

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
  const { state: { categories } } = React.useContext(FireflyContext);

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

const tags = [
  { label: 'pending' },
];

function TagsField(props: StandardProps) {
  return (
    <Autocomplete
      size="small"
      sx={{ ...sx }}
      options={tags}
      renderInput={(params) => <TextField {...params} label={props.label || props.id} />}
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
      onChange={(value) => { field.onChange(value); }}
      value={field.value}
      error={fieldState.invalid}
      label="Amount"
    />
  );
}

function ForeignAmountField({ control, index }: ControlledProps) {
  const { field, fieldState } = useController({
    control,
    name: `transactions.${index}.foreign_amount` as const,
  });
  return (
    <TextField
      size="small"
      onChange={(value) => { field.onChange(value); }}
      value={field.value}
      error={fieldState.invalid}
      label="Foreign Amount"
    />
  );
}

function TaxRate({ control, index }: ControlledProps) {
  const { field } = useController({
    control,
    name: `transactions.${index}.taxRate` as const,
  });

  return (
    <Checkbox
      checked={field.value}
      onChange={(e, value) => field.onChange(value)}
      inputProps={{ 'aria-label': 'controlled' }}
    />
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
      label="Date"
      value={field.value}
      onChange={field.onChange}
      renderInput={(params) => (
        <TextField
          {...params}
          error={fieldState.invalid}
        />
      )}
    />
  );
}

function TaxFormula({ control }: { control: Control<FormValues> }) {
  const { field } = useController({
    control,
    name: 'taxFormula',
  });

  return (
    <RadioGroup
      row
      name="taxType"
      value={field.value}
      onChange={(e, value) => field.onChange(value)}
    >
      <FormControlLabel
        value="taxInclusive"
        control={<Radio />}
        label="Tax Inclusive"
        labelPlacement="bottom"
      />
      <FormControlLabel
        value="taxExclusive"
        control={<Radio />}
        label="Tax Exclusive"
        labelPlacement="bottom"
      />
    </RadioGroup>
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

  const { gross, tax, total } = transactions.reduce((acc, transaction) => {
    return {
      gross: acc.gross.add(transaction.beforeTax),
      tax: acc.tax.add(transaction.tax),
      total: acc.total.add(transaction.afterTax),
    };
  }, { gross: currency(0), tax: currency(0), total: currency(0) });

  return (
    <>
      <div>
        {transactions.map((transaction, index) => (
          <div key={index}>
            <span>{transaction.description}</span>&nbsp;
            <span>{transaction.beforeTax.value}</span>&nbsp;
            <span>{transaction.tax.value}</span>&nbsp;
            <span>{transaction.afterTax.value}</span>&nbsp;
          </div>
        ))}
      </div>
      <div>Total: 
        <span>{gross.value}</span>&nbsp;
        <span>{tax.value}</span>&nbsp;
        <span>{total.value}</span>&nbsp;
      </div>
    </>
  );
}

function GroupTitleField({ control }: { control: Control<FormValues> }) {
  const transactions = useWatch({
    control,
    name: 'transactions',
  });
  console.log(transactions.length);
  const { field, fieldState } = useController({
    control,
    name: 'group_title',
    rules: { required: transactions.length > 1 },
  });

  return (
    <TextField
      value={field.value || ''}
      onChange={(e) => field.onChange(e.target.value)}
      error={fieldState.invalid}
    />
  );
}
