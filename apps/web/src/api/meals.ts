import { MealsApi, MealDto } from '@elliotJHarding/meals-api';
import { axiosInstance, baseUrl, configuration } from './client';

const api = new MealsApi(configuration, baseUrl, axiosInstance);

export async function getAllMeals(): Promise<MealDto[]> {
  const response = await api.getAllMeals();
  return response.data;
}
