import fireflyApi from './api';
import _ from 'lodash';

export interface Category {
  id: string;
  name: string;
}

export function fetchCategories(): Promise<Array<Category>> {
  return fireflyApi.get('/api/v1/categories')
  .then(response => response.data.data.map(
    (category: any): Category => {
      return {
        id: category.id,
        ...category.attributes,
      };
    })
  )
  .then(categories => _.sortBy(categories, ['name']));
}


export function getCategoryById(categories: Category[], id: string) {
  for (const category of categories) {
    if (category.id === id) {
      return category;
    }
  }


  throw new Error(`No Category with the ID: ${id}`);
}
