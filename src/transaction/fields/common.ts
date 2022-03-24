import { Control, } from 'react-hook-form';
import { Account, AccountType, accountRoles, getAccountById } from '../../firefly/accounts';
import { Currency, } from '../../firefly/currency';
import { Budget, getBudgetById } from '../../firefly/budget';
import { Category, getCategoryById } from '../../firefly/category';
import {
  RawTransaction,
  TransactionGroup,
  storeNewTransaction,
  TransactionAutocomplete,
  transactionAutocomplete,
  fetchTransactionById,
  getTransactionType,
} from '../../firefly/transaction';

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

export interface StandardProps {
  id?: string;
  label?: string;
}

export type ControlledProps = {
  control: Control<FormValues>,
  index: number,
};
