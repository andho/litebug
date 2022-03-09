import fireflyApi from './api';
import _ from 'lodash';
import moment, { Moment } from 'moment';

import { Account, AccountType } from './accounts';
import { Budget } from './budget';
import { Category } from './category';
import { Currency } from './currency';

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
  source: Account;
  destination: Account;
  date: Moment;
  currency: Currency;
  amount: string;
  foreign_currency: Currency | null;
  foreign_amount: string | null;
  budget: Budget;
  category: Category;
  tags: string[];
  type: TransactionType;
}

export interface TransactionGroup {
  id: string;
  group_title: string | null;
  transactions: Transaction[];
}

export function storeNewTransaction(transactionGroup: TransactionGroup) {
  const data = {
    transactions: transactionGroup.transactions.map((t: Transaction) => ({
      amount: t.amount,
      destination_id: t.destination.id,
      destination_name: t.destination.name,
      souce_id: t.source.id,
      source_name: t.source.name,
      budget_id: t.budget.id,
      category_name: t.category.name,
      date: t.date.format('YYYY-MM-DD'),
      description: t.description,
      tags: t.tags,
      type: t.type,
      book_date: "",
      due_date: "",
      interest_date: "",
      internal_reference: "",
      invoice_date: "",
      notes: "",
      payment_date: "",
      process_date: "",
    })),
  };

  return fireflyApi.post('/api/v1/transactions', data);
}
