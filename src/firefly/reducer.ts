import { Account } from './accounts';
import { Currency } from './currency';
import { Budget } from './budget';
import { Category } from './category';

export enum FireflyActionType {
  UpdateAccounts = 'update_accounts',
  UpdateCurrencies = 'update_currencies',
  UpdateBudgets = 'update_budgets',
  UpdateCategories = 'update_categories',
  UpdateAll = 'update_all',
}

export interface FireflyActionUpdateAccounts {
  type: FireflyActionType.UpdateAccounts,
  accounts: Account[];
}

export interface FireflyActionUpdateCurrencies {
  type: FireflyActionType.UpdateCurrencies,
  currencies: Currency[];
}

export interface FireflyActionUpdateBudgets {
  type: FireflyActionType.UpdateBudgets,
  budgets: Budget[];
}

export interface FireflyActionUpdateCategories {
  type: FireflyActionType.UpdateCategories,
  categories: Category[];
}

export interface FireflyActionUpdateAll {
  type: FireflyActionType.UpdateAll,
  data: {
    categories: Category[],
    budgets: Budget[],
    currencies: Currency[],
    accounts: Account[],
  },
};


export type FireflyAction = (
  FireflyActionUpdateAccounts |
  FireflyActionUpdateCurrencies |
  FireflyActionUpdateBudgets |
  FireflyActionUpdateCategories |
  FireflyActionUpdateAll
);

export default function reducer(state: FireflyGlobalData, action: FireflyAction): FireflyGlobalData {
  switch (action.type) {
    case FireflyActionType.UpdateAccounts:
      return {
        ...state,
        accounts: action.accounts,
      };
    case FireflyActionType.UpdateCurrencies:
      return {
        ...state,
        currencies: action.currencies,
      };
    case FireflyActionType.UpdateBudgets:
      return {
        ...state,
        budgets: action.budgets,
      };
    case FireflyActionType.UpdateCategories:
      return {
        ...state,
        categories: action.categories,
      };
    case FireflyActionType.UpdateAll:
      return {
        ...state,
        ...action.data,
      };
    default:
      return state;
  }
}

export interface FireflyGlobalData {
  accounts: Account[],
  currencies: Currency[],
  budgets: Budget[],
  categories: Category[],
}
