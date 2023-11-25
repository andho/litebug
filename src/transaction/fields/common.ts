import { Control, } from 'react-hook-form';
import { Account } from '../../firefly/accounts';
import { Currency, } from '../../firefly/currency';
import { Budget } from '../../firefly/budget';
import { Category } from '../../firefly/category';

export type TransactionValues = {
  description: string,
  source: Account | NewOption | null,
  destination: Account | NewOption | null,
  amount: string,
  foreign_currency: Currency | null,
  foreign_amount: string | null,
  budget: Budget | null,
  category: Category | null,
  taxRate: boolean,
};

export type FormValues = {
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

export type NewOption = {
  label: string;
  value: string;
  __isNew__: true;
}

export function isNewOption(value: NewOption | Account): value is NewOption {
  return '__isNew__' in value;
}
