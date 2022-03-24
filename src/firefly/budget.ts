import fireflyApi from './api';
import _ from 'lodash';

export interface Budget {
  id: string;
  active: boolean;
  name: string;
}

export function fetchBudgets(): Promise<Array<Budget>> {
  return fireflyApi.get('/api/v1/budgets')
  .then(response => response.data.data.map(
    (budget: any): Budget => {
      return {
        id: budget.id,
        ...budget.attributes,
      };
    })
  )
  .then(budgets => _.sortBy(budgets, ['name']));
}

export function getBudgetById(budgets: Budget[], id: string) {
  for (const budget of budgets) {
    if (budget.id === id) {
      return budget;
    }
  }


  throw new Error(`No Budget with the ID: ${id}`);
}