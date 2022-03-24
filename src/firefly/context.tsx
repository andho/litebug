import React from 'react';
import { fetchAccounts } from './accounts';
import { fetchCurrencies } from './currency';
import { fetchBudgets } from './budget';
import { fetchCategories } from './category';
import reducer, { FireflyGlobalData, FireflyActionType } from './reducer';

export interface FireflyContextInterface {
  state: {
    loading: boolean,
    initialLoad: boolean,
    data: FireflyGlobalData,
  },
  refreshData: () => void,
}

export const initialState: FireflyContextInterface = {
  state: {
    loading: false,
    initialLoad: true,
    data: {
      accounts: [],
      currencies: [],
      budgets: [],
      categories: [],
    },
  },
  refreshData: () => {}
};

const GLOBAL_DATA_KEY = 'global-data';

export const FireflyContext = React.createContext<FireflyContextInterface>(initialState);

export const FireflyProvider: React.FC<{}> = ({ children, ...props }) => {
  const [data, dispatch] = React.useReducer(reducer, initialState.state.data);
  const [loading, setLoading] = React.useState(true);
  const [initialLoad, setInitialLoad] = React.useState(true);

  const refreshData = React.useCallback(() => {
    return Promise.all([
      fetchAccounts().then(accounts => {
        dispatch({ type: FireflyActionType.UpdateAccounts, accounts });
      }),
      fetchCurrencies().then(currencies => {
        dispatch({ type: FireflyActionType.UpdateCurrencies, currencies });
      }),
      fetchBudgets().then(budgets => {
        dispatch({ type: FireflyActionType.UpdateBudgets, budgets });
      }),
      fetchCategories().then(categories => {
        dispatch({ type: FireflyActionType.UpdateCategories, categories });
      }),
    ]).then(() => {
      setLoading(false);
      setInitialLoad(false);
    }).catch((error) => {
      console.log(error);
    });
  }, [dispatch, setLoading, setInitialLoad]);

  const loadFromStorage = React.useCallback(() => {
    setLoading(true);

    const storedString = window.localStorage.getItem(GLOBAL_DATA_KEY);
    if (typeof storedString !== 'string') {
      refreshData();
      return;
    }

    const data = JSON.parse(storedString) as FireflyGlobalData;
    if (data.accounts.length === 0 ||
      data.currencies.length === 0 ||
      data.budgets.length === 0 ||
      data.categories.length === 0
    ) {
      refreshData();
      return;
    }

    dispatch({ type: FireflyActionType.UpdateAll, data });
    setLoading(false);
    setInitialLoad(false);
  }, [setLoading, dispatch, setInitialLoad, refreshData]);

  React.useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  React.useEffect(() => {
    window.localStorage.setItem(GLOBAL_DATA_KEY, JSON.stringify(data));
  }, [data]);

  const state = {
    loading,
    initialLoad,
    data,
  };

  return (
    <FireflyContext.Provider value={{ state, refreshData }}>
      { children }
    </FireflyContext.Provider>
  );
}
