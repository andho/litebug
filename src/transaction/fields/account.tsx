import _ from "lodash";
import { useContext } from "react";
import { useController, useWatch } from "react-hook-form";
import Select from "react-select/creatable";
import { Account, accountRoles, AccountType } from "../../firefly/accounts";
import { FireflyContext } from "../../firefly/context";
import { ControlledProps, isNewOption, NewOption, StandardProps } from "./common";


const defaultSourceTypes = [AccountType.Asset, AccountType.Revenue];
const defaultDestinationTypes = [AccountType.Asset, AccountType.Expense];

interface AccountFieldProps extends StandardProps {
  accountTypes: AccountType[],
  name: string,
  value: Account | NewOption | null,
  onChange: (value: Account | NewOption | null) => void,
  error?: string,
  disabled: boolean,
}

function getGroupFromAccount(account: Account) {
  if (account.type === AccountType.Asset && account.account_role) {
    return 'Asset: ' + accountRoles[account.account_role];
  } else {
    return _.capitalize(account.type);
  }
}

function AccountField(props: AccountFieldProps) {
  const { state: { data: { accounts: accountsData } } } = useContext(FireflyContext);

  const accounts = accountsData.filter(account => props.accountTypes.includes(account.type));

  const optionsTmp: Record<string, { label: string, options: (Account | NewOption)[] }> = {};
  for (const account of accounts) {
    const group = getGroupFromAccount(account);

    if (!Object.hasOwn(optionsTmp, group)) {
      optionsTmp[group] = {
        label: group,
        options: [],
      };
    }

    optionsTmp[group]?.options.push(account);
  }
  const options = Object.values(optionsTmp);

  return (
    <Select
      options={options}
      value={props.value}
      onChange={props.onChange}
      formatCreateLabel={(value) => `New account "${value}"`}
      getOptionLabel={account => {
        if (isNewOption(account)) return account.label;
        return typeof account !== 'string' ? account.name : `Create ${account}`;
      }}
      onCreateOption={(val) => {
        props.onChange({ label: val, value: val, __isNew__: true });
      }}
      isClearable
    />
  );

  //return (
  //  <Autocomplete
  //    size="small"
  //    sx={{ ...sx }}
  //    options={accounts}
  //    getOptionLabel={account => typeof account !== 'string' ? account.name : account}
  //    groupBy={(account: Account) => {
  //      if (account.type === AccountType.Asset && account.account_role) {
  //        return 'Asset: ' + accountRoles[account.account_role];
  //      } else {
  //        return _.capitalize(account.type);
  //      }
  //    }}
  //    isOptionEqualToValue={(option, value) => {
  //      if (!value) {
  //        return false;
  //      }
  //      if (value.id === option.id) {
  //        return true;
  //      }

  //      return false;
  //    }}
  //    defaultValue={props.value}
  //    value={props.value}
  //    onChange={(e, value) => {
  //      props.onChange(value);
  //    }}
  //    disabled={props.disabled}
  //    autoHighlight
  //    renderInput={(params) => (
  //      <TextField
  //        {...params}
  //        label={props.label || props.name}
  //        error={!!props.error}
  //        helperText={props.error}
  //      />)
  //    }
  //  />
  //);
}

export function SourceAccountField({ control, index }: ControlledProps) {
  const [source, destination] = useWatch({
    name: [
      `transactions.0.source` as const,
      `transactions.0.destination` as const,
    ],
    control,
  });
  const accountTypes = (
    index === 0 && !!destination && !isNewOption(destination) && destination?.type === AccountType.Expense ? [AccountType.Asset] : defaultSourceTypes
  ) || (
    index !== 0 && !!source && !isNewOption(source) && source ? [source.type] : defaultSourceTypes
  );

  let disabled = false;
  if (index !== 0 && !!source && !isNewOption(source) && source.type === AccountType.Asset) {
    disabled = true;
  }

  const { field, fieldState } = useController({
    control,
    name: `transactions.${index}.source` as const,
    rules: { required: !disabled && 'This field is required' },
  });

  return (
    <AccountField
      value={field.value}
      name={field.name}
      onChange={field.onChange}
      disabled={disabled}
      label="Source Account"
      accountTypes={accountTypes}
      error={fieldState.error?.message}
    />
  );
}

export function DestinationAccountField({ control, index }: ControlledProps) {

  const [source, destination] = useWatch({
    name: [
      `transactions.0.source` as const,
      `transactions.0.destination` as const,
    ],
    control,
  });
  const accountTypes = !!source && !isNewOption(source) && source?.type === AccountType.Revenue ? [AccountType.Asset] : defaultDestinationTypes;

  let disabled = false;
  if (index !== 0 && source && !isNewOption(source)) {
    if (source.type === AccountType.Asset && !!destination && !isNewOption(destination) && destination.type === AccountType.Asset) {
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
      error={fieldState.error?.message}
      disabled={disabled}
    />
  );
}
