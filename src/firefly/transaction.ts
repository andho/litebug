import fireflyApi from './api';
import moment, { Moment } from 'moment';

import { Account, AccountType } from './accounts';
import { Budget } from './budget';
import { Category } from './category';
import { Currency } from './currency';
import { isNewOption } from '../transaction/fields/common';

export enum TransactionType {
  Transfer = 'transfer',
  Withdrawal = 'withdrawal',
  Deposit = 'deposit',
}

export interface RawTransaction {
  transaction_journal_id: number;
  type: TransactionType;
  date: Moment;
  order: number;
  currency_id: string;
  currency_code: string;
  currency_name: string;
  currency_symbol: string;
  currency_decimal_places: number;
  foreign_currency_id: string;
  foreign_currency_code: string | null;
  foreign_currency_symbol: string | null;
  foreign_currency_decimal_places: number;
  amount: string;
  foreign_amount: string;
  description: string;
  source_id: string;
  source_name: string;
  source_type: AccountType;
  destination_id: string;
  destination_name: string;
  destination_type: AccountType;
  budget_id: string;
  budget_name: string | null;
  category_id: string;
  category_name: string | null;
  tags: string[];
}

export interface Transaction {
  description: string;
  source: Account | string | null;
  destination: Account | string | null;
  date: Date;
  currency?: Currency;
  amount: string;
  foreign_currency: Currency | null;
  foreign_amount: string | null;
  budget: Budget | null;
  category: Category | null;
  tags: string[];
}

export interface TransactionGroup {
  id: string;
  group_title: string | null;
  transactions: Transaction[];
}

function firstNonNull(account: Account | string, ...accounts: (Account | string | null)[]) {
  for (const account of accounts) {
    if (!account) {
      continue;
    }

    if (typeof account === 'string') {
      return account;
    }

    return account;
  }

  return account;
}

function accountId(account: Account | string, ...accounts: (Account | string | null)[]) {
  const nonNull = firstNonNull(account, ...accounts);

  return typeof nonNull === 'string' ? undefined : nonNull.id;
}

function accountName(account: Account | string, ...accounts: (Account | string | null)[]) {
  const nonNull = firstNonNull(account, ...accounts);

  return typeof nonNull === 'string' ? nonNull : nonNull.name;
}

export async function storeNewTransaction(transactionGroup: TransactionGroup) {
  const firstSource = transactionGroup.transactions[0].source;
  const firstDestination = transactionGroup.transactions[0].destination;
  if (firstSource === null || firstDestination === null) {
    throw new Error("Source or destination missing in the first transaction");
  }

  const data = {
    transactions: transactionGroup.transactions.map((t: Transaction) => ({
      amount: t.amount,
      destination_id: accountId(firstDestination, t.destination),
      destination_name: accountName(firstDestination, t.destination),
      souce_id: accountId(firstSource, t.source),
      source_name: accountName(firstSource, t.source),
      budget_id: t.budget?.id,
      category_name: t.category?.name,
      date: moment(t.date).format('YYYY-MM-DD'),
      description: t.description,
      tags: t.tags,
      book_date: "",
      due_date: "",
      interest_date: "",
      internal_reference: "",
      invoice_date: "",
      notes: "",
      payment_date: "",
      process_date: "",
      type: getTransactionType(t.source || firstSource, t.destination || firstDestination),
    })),
    error_if_duplicate: false,
    apply_rules: false,
    fire_webhooks: true,
    group_title: transactionGroup.group_title,
  };

  return fireflyApi.post('/api/v1/transactions', data);
}

export interface TransactionAutocomplete {
  id: string;
  transaction_group_id: string;
  name: string;
  description: string;
}

export function transactionAutocomplete(query: string) {
  return fireflyApi.get('/api/v1/autocomplete/transactions', {
    params: {
      query,
      limit: 10,
    },
  })
  .then(response => response.data.map(
    (transaction: any): TransactionAutocomplete => {
      return {
        ...transaction,
      };
    }
  ));
};

export function fetchTransactionById(id: string) {
  return fireflyApi.get(`/api/v1/transactions/${id}`)
  .then(response => {
    return response.data;
  });
}

export function getTransactionType(source: Account | string, destination: Account | string) {
  if (typeof source !== 'string' && source.type === AccountType.Asset) {
    if (typeof destination !== 'string' && destination.type === AccountType.Asset) {
      return TransactionType.Transfer;
    }

    return TransactionType.Withdrawal;
  }

  return TransactionType.Deposit;
}
