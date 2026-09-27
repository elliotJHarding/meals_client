import { PlansApi, PlanDto } from '@elliotJHarding/meals-api';
import { axiosInstance, baseUrl, configuration, asApiDate } from './client';

const api = new PlansApi(configuration, baseUrl, axiosInstance);

export async function getPlansInRange(start: Date, end: Date): Promise<PlanDto[]> {
  const response = await api.getPlansInRange(asApiDate(start), asApiDate(end));
  return response.data;
}

export async function createPlan(plan: PlanDto): Promise<PlanDto> {
  const response = await api.createPlan(plan);
  return response.data;
}

export async function updatePlan(id: number, plan: PlanDto): Promise<void> {
  await api.updatePlan(id, plan);
}
