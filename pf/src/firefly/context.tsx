import React from 'react';
import { fetchAccounts } from './accounts';
import { fetchCurrencies } from './currency';
import { fetchBudgets } from './budget';
import { fetchCategories } from './category';
import reducer, { FireflyGlobalData, FireflyActionType } from './reducer';

export interface FireflyContextInterface {
  state: FireflyGlobalData,
  refreshData: () => void,
}

export const initialState: FireflyContextInterface = {
  state: {
    loading: false,
    accounts: [],
    currencies: [],
    budgets: [],
    categories: [],
  },
  refreshData: () => {}
};

export const FireflyContext = React.createContext<FireflyContextInterface>(initialState);

export const FireflyProvider: React.FC<{}> = ({ children, ...props }) => {
  const [state, dispatch] = React.useReducer(reducer, initialState.state);
  const refreshData = () => {
    fetchAccounts()
      .then(accounts => {
        dispatch({ type: FireflyActionType.UpdateAccounts, accounts });
      });
    fetchCurrencies().then(currencies => {
      dispatch({ type: FireflyActionType.UpdateCurrencies, currencies });
    });
    fetchBudgets().then(budgets => {
      dispatch({ type: FireflyActionType.UpdateBudgets, budgets });
    });
    fetchCategories().then(categories => {
      dispatch({ type: FireflyActionType.UpdateCategories, categories });
    });
  };

  return (
    <FireflyContext.Provider value={{ state, refreshData }}>
      { children }
    </FireflyContext.Provider>
  );
}
