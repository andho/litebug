import fireflyApi from './api';
import _ from 'lodash';

export enum AccountType {
  Asset = 'asset',
  Expense = 'expense',
  Revenue = 'revenue',
  Cash = 'cash',
  InitialBalance = 'initial-balance',
}

export enum AccountRole {
  CashWalletAsset = 'cashWalletAsset',
  DefaultAsset = 'defaultAsset',
  SavingAsset = 'savingAsset',
}

export const accountRoles = {
  [AccountRole.DefaultAsset]: 'Normal',
  [AccountRole.CashWalletAsset]: 'Cash wallet',
  [AccountRole.SavingAsset]: 'Saving',
};


export interface Account {
  id: string;
  active: boolean;
  order: number;
  name: string;
  type: AccountType;
  account_role: AccountRole | null;
  currency_id: string;
  currency_code: string;
  currency_symbol: string;
  currency_decimal_places: number;
  current_balance: string;
  current_balance_date: Date;
}

export function fetchAccounts(): Promise<Array<Account>> {
  return fireflyApi.get('/api/v1/accounts')
  .then(response => response.data.data.map(
    (account: any): Account => {
      return {
        id: account.id,
        ...account.attributes,
      };
    })
  )
  .then(accounts => accounts.filter((account: Account) => {
    return [AccountType.Asset, AccountType.Revenue, AccountType.Expense].includes(account.type);
  }))
  .then(accounts => _.sortBy(accounts, ['type', 'account_role', 'order']));
}

let accounts: Account[] = [];

export function getAccounts(): Account[] {
  return accounts;
}

export function refreshData() {
  fetchAccounts().then(newAccounts => {
    accounts = newAccounts;
  });
}

export function getAccountById(accounts: Account[], id: string) {
  for (const account of accounts) {
    if (account.id === id) {
      return account;
    }
  }

  throw new Error(`No Account with the ID: ${id}`);
}
