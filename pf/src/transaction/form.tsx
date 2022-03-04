import React from 'react';
import { TextField, Autocomplete, Button } from '@mui/material';
import { DatePicker } from '@mui/lab';
import moment, { Moment } from 'moment';
import { FireflyProvider, FireflyContext } from '../firefly/context';
import { Account, AccountType, accountRoles } from '../firefly/accounts';
import { Currency } from '../firefly/currency';
import { Budget } from '../firefly/budget';
import { Category } from '../firefly/category';
import { TransactionGroup, Transaction, storeNewTransaction } from '../firefly/transaction';
import _ from 'lodash';

const defaultSourceTypes = [AccountType.Asset, AccountType.Revenue];
const defaultDestinationTypes = [AccountType.Asset, AccountType.Expense];

export default function Form() {
  const [date, setDate] = React.useState<Moment | null>(moment());
  const [source, setSource] = React.useState<Account | null>(null);
  const [destination, setDestination] = React.useState<Account | null>(null);
  const [currency, setCurrency] = React.useState<Currency | null>(null);
  const [budget, setBudget] = React.useState<Budget | null>(null);
  const [category, setCategory] = React.useState<Category | null>(null);
  const [amount, setAmount] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [foreignAmount, setForeingAmount] = React.useState("");

  const [sourceTypes, setSourceTypes] = React.useState<Array<AccountType>>(defaultSourceTypes);
  const [destinationTypes, setDestinationTypes] = React.useState<Array<AccountType>>(defaultDestinationTypes);

  const submitTransaction = () => {
    const transaction: Transaction = {
      date,
      source,
      destination,
      ForeignCurrency: currency,
      currency: currencyFromAccount(source),
      budget,
      category,
      amount,
      foreignAmount,
      description,
    };
    const TransactionGroup = {
      transactions: [ transaction ],
      group_title: '',
    };
    storeNewTransaction(transactionGroup);
  };

  const onSourceChange = (_: any, account: Account | null) => {
    setSource(account);
  };

  const onDestinationChange = (_: any, account: Account | null) => {
    setDestination(account);
  };

  const onCurrencyChange = (_: any, currency: Currency | null) => {
    setCurrency(currency);
  };

  const onBudgetChange = (_: any, budget: Budget | null) => setBudget(budget);
  const onCategoryChange = (_: any, category: Budget | null) => setCategory(category);

  React.useEffect(() => {
    if (source !== null) {
      if (source.type === AccountType.Asset) {
        setDestinationTypes([AccountType.Expense, AccountType.Asset]);
      } else if (source.type === AccountType.Revenue) {
        setDestinationTypes([AccountType.Asset]);
      }
    }

    if (destination !== null) {
      if (destination.type === AccountType.Expense) {
        setSourceTypes([AccountType.Asset]);
      } else if (destination.type === AccountType.Asset) {
        setSourceTypes([AccountType.Asset, AccountType.Revenue]);
      }
    }

  }, [source, destination]);

  return (
    <FireflyProvider>
      <div className="transactionForm">
        <DescriptionField />
        <AccountField id='Source' accountTypes={sourceTypes} onChange={onSourceChange} />
        <AccountField id='Destination' accountTypes={destinationTypes} onChange={onDestinationChange} />
        <DatePicker
          label="Date"
          value={date}
          onChange={(newDate) => { setDate(newDate); }}
          renderInput={(params) => <TextField {...params} />}
        />
        <TextField id="amount" label="Amount" />
        <CurrencyField id="foreignCurrency" label="Foreign Currency"
          onChange={onCurrencyChange} />
        <TextField id="foreignAmount" label="Foreign Amount" />
        <BudgetField id="budget" onChange={onBudgetChange} />
        <CategoryField id="category" />
        <Button variant="contained">Submit</Button>
        <RefreshButton />
      </div>
     </FireflyProvider>
  );
}

interface DescriptionOption {
  label: string;
}

function DescriptionField() {
  const [value, setValue] = React.useState<DescriptionOption | null>(null);
  const [inputValue, setInputValue] = React.useState('');
  const [options, setOptions] = React.useState<Array<DescriptionOption>>([]);
  const [loading, setLoading] = React.useState(false);

  let request: ReturnType<typeof setTimeout>;
  const loadOptions = (input: string) => {
    if (request) {
      clearTimeout(request);
    }
    return new Promise<Array<DescriptionOption>>((resolve, reject) => {
      request = setTimeout(() => {
        resolve([
          {label: 'stts'},
          {label: 'eses,'},
          {label: 'es,c.r'},
          {label: 'fueiwi'},
          {label: 'yfufwe'},
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
      id="description"
      options={options}
      loading={loading}
      value={value}
      onChange={(e: any, newValue: DescriptionOption | null) => {
        setValue(newValue);
      }}
      inputValue={inputValue}
      onInputChange={(e, newInputValue) => {
        inputHandler(newInputValue);
      }}
      filterOptions={x => x}
      renderInput={(params) => <TextField {...params} label="Description" />}
    />
  );
}

interface AccountFieldProps extends StandardProps {
  accountTypes: AccountType[],
}

function AccountField(props: AccountFieldProps) {
  const { state: { accounts: accountsData } } = React.useContext(FireflyContext);

  const accounts = accountsData.map(account => ({
    label: account.name,
    ...account
  })).filter((account: Account) => {
    return props.accountTypes.includes(account.type);
  });

  return (
    <Autocomplete
      options={accounts}
      groupBy={account => {
        if (account.type === AccountType.Asset && account.account_role) {
          return 'Asset: ' + accountRoles[account.account_role];
        } else {
          return _.capitalize(account.type);
        }
      }}
      onChange={props.onChange}
      renderInput={(params) => <TextField {...params} label={props.label || props.id} />}
    />
  );
}

const currencies = [
  { code: 'MVR', shortName: 'Rufiya', name: 'Maldivian Rufiya', label: 'MVR' }
];

function CurrencyField(props: StandardProps) {
  const { state: { currencies: currencyData } } = React.useContext(FireflyContext);

  const currencies = currencyData.map(currency => ({
    label: `${currency.name} (${currency.code})`,
    ...currency
  }));
  // TODO: filter out the currency of the currently selected source account

  return (
    <Autocomplete
      options={currencies}
      onChange={props.onChange}
      renderInput={(params) => <TextField {...params} label={props.label || props.id} />}
    />
  );
}

interface StandardProps {
  id: string;
  label?: string;
  onChange?: (event: any, value: any) => void;
}

function BudgetField(props: StandardProps) {
  const { state: { budgets: budgetsData } } = React.useContext(FireflyContext);

  const budgets = budgetsData.map(budget => ({
    label: budget.name,
    ...budget
  }));

  return (
    <Autocomplete
      options={budgets}
      onChange={props.onChange}
      renderInput={(params) => <TextField {...params} label={props.label || props.id} />}
    />
  );
}

function CategoryField(props: StandardProps) {
  const { state: { categories: categoriesData } } = React.useContext(FireflyContext);

  const categories = categoriesData.map(category => ({
    label: category.name,
    ...category
  }));

  return (
    <Autocomplete
      options={categories}
      onChange={props.onChange}
      renderInput={(params) => <TextField {...params} label={props.label || props.id} />}
    />
  );
}

const tags = [
  { label: 'pending' },
];

function TagsField(props: StandardProps) {
  return (
    <Autocomplete
      options={tags}
      renderInput={(params) => <TextField {...params} label={props.label || props.id} />}
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
