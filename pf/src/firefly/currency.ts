import fireflyApi from './api';
import _ from 'lodash';

import { Account } from './accounts';

export interface Currency {
  id: string;
  name: string;
  code: string;
  symbol: string;
  decimal_places: number;
}

export function fetchCurrencies(): Promise<Array<Currency>> {
  return fireflyApi.get('/api/v1/currencies')
  .then(response => response.data.data.map(
    (currency: any): Currency => {
      return {
        id: currency.id,
        ...currency.attributes,
      };
    })
  )
  .then(currencies => _.sortBy(currencies, ['code']));
}

export function currencyFromAccount(account: Account) {
  return {
    id: account.currency_id,
    name: "",
    code: account.currency_code,
    symbol: account.currency_symbol,
    decimal_places: account.currency_decimal_places,
  };
}
