import React from 'react';
import { TextField, Autocomplete, Button } from '@mui/material';
import { DatePicker } from '@mui/lab';
import { useForm, useFieldArray, useWatch, Controller, useController, Control, Field } from 'react-hook-form';

import moment, { Moment } from 'moment';
import _ from 'lodash';
import { matchSorter } from 'match-sorter';

import { FireflyProvider, FireflyContext } from '../firefly/context';
import { Account, AccountType, accountRoles } from '../firefly/accounts';
import { Currency } from '../firefly/currency';
import { Budget } from '../firefly/budget';
import { Category } from '../firefly/category';
import { TransactionGroup, Transaction, storeNewTransaction, TransactionType } from '../firefly/transaction';

const defaultSourceTypes = [AccountType.Asset, AccountType.Revenue];
const defaultDestinationTypes = [AccountType.Asset, AccountType.Expense];

type FormValues = {
  transactions: {
    description: string,
    source: Account,
    destination: Account,
    amount: string,
    foreign_currency: Currency,
    foreign_amount: string,
    budget: Budget,
    category: Category,
  }[],
};

const defaults = {
  description: '',
  amount: '',
  foreign_amount: '',
};

export default function Form() {
  const { handleSubmit, control, reset, formState } = useForm<FormValues>({
    defaultValues: {
      transactions: [{
        description: '',
        amount: '',
        foreign_amount: '',
      }],
    },
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'transactions',
  });

  const onSubmit = handleSubmit((data) => {
    console.log(data);
    //const transaction: Transaction = {
    //  ...data,
    //  date: moment(),
    //  currency: {
    //    id: data.source.currency_id,
    //    name: '',
    //    code: data.source.currency_code,
    //    symbol: data.source.currency_symbol,
    //    decimal_places: data.source.currency_decimal_places,
    //  },
    //  tags: [],
    //  type: TransactionType.Transfer,
    //};
    //const transactionGroup: TransactionGroup = {
    //  id: '',
    //  transactions: [ transaction ],
    //  group_title: '',
    //};

    //storeNewTransaction(transactionGroup);
  });

  const addSplit = () => {
    append(defaults);
  };

  return (
    <FireflyProvider>
      <form onSubmit={onSubmit}>
        {fields.map((field, index) => (
          <div key={field.id}>
            <DescriptionField {...{control, index}} />
            <SourceAccountField {...{control, index}} />
            <DestinationAccountField {...{control, index}} />
            <AmountField {...{control, index}} />
            <CurrencyField {...{control, index}} name="foreign_currency" label="Foreign Currency" />
            <ForeignAmountField {...{control, index}} />
            <BudgetField {...{control, index}} />
            <CategoryField {...{control, index}} />
          </div>
        ))}
        <Button variant="outlined" onClick={addSplit}>Add another split</Button>
        <Button variant="contained" type="submit">Submit</Button>
        <RefreshButton />
      </form>
     </FireflyProvider>
  );
}

type DescriptionOption = string;

function DescriptionField({ control, index }: ControlledProps) {
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
    if (request) {
      clearTimeout(request);
    }
    return new Promise<Array<DescriptionOption>>((resolve, reject) => {
      request = setTimeout(() => {
        resolve([
        ]);
      }, 1000);
    });
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
        field.onChange(value);
      }}
      size="small"
      value={field.value}
      id="description"
      options={options}
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
          inputRef={field.ref}
          label="Description"
          error={fieldState.invalid}
        />
      )}
    />
  );
}

interface AccountFieldProps extends StandardProps {
  accountTypes: AccountType[],
  name: string,
  value: Account,
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
      options={accounts}
      getOptionLabel={account => account.name}
      groupBy={(account: Account) => {
        if (account.type === AccountType.Asset && account.account_role) {
          return 'Asset: ' + accountRoles[account.account_role];
        } else {
          return _.capitalize(account.type);
        }
      }}
      value={props.value}
      onChange={(e, value) => {
        props.onChange(value);
      }}
      disabled={props.disabled}
      autoHighlight
      autoSelect
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
  const { field, fieldState } = useController({
    control,
    name: `transactions.${index}.source` as const,
    rules: { required: true },
  });

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
    index !== 0 && [source.type]
  );

  let disabled = false;
  if (index !== 0 && source?.type === AccountType.Asset) {
    disabled = true;
  }

  return (
    <AccountField
      {...field}
      disabled={disabled}
      label="Source Account"
      accountTypes={accountTypes}
      error={fieldState.invalid}
    />
  );
}

function DestinationAccountField({ control, index }: ControlledProps) {
  const { field, fieldState } = useController({
    control,
    name: `transactions.${index}.destination` as const,
    rules: { required: true },
  });

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

  return (
    <AccountField
      {...field}
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
    rules: { required: true },
  });
  const { state: { budgets } } = React.useContext(FireflyContext);

  return (
    <Autocomplete
      size="small"
      options={budgets}
      getOptionLabel={budget => budget.name}
      onChange={(e, value) => { field.onChange(value); }}
      value={field.value}
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
    rules: { required: true },
  });
  const { state: { categories } } = React.useContext(FireflyContext);

  return (
    <Autocomplete
      size="small"
      options={categories}
      getOptionLabel={category => category.name}
      onChange={(e, value) => { field.onChange(value); }}
      value={field.value}
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

const tags = [
  { label: 'pending' },
];

function TagsField(props: StandardProps) {
  return (
    <Autocomplete
      size="small"
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

function RefreshButton() {
  const { refreshData } = React.useContext(FireflyContext);

  const onClick = () => {
    refreshData();
  };

  return (
    <Button onClick={onClick}>
      Refresh Data
    </Button>
  );
}
