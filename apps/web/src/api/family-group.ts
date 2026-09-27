import { FamilyGroupApi, FamilyGroupDto } from '@elliotJHarding/meals-api';
import { axiosInstance, baseUrl, configuration } from './client';

const api = new FamilyGroupApi(configuration, baseUrl, axiosInstance);

export async function getFamilyGroup(): Promise<FamilyGroupDto> {
  const response = await api.getFamilyGroup();
  return response.data;
}

// The server returns the new group's uuid as a bare JSON string (not a
// FamilyGroupDto, despite the generated type), so surface it as the uuid.
export async function createFamilyGroup(): Promise<string> {
  const response = await api.createFamilyGroup();
  return response.data as unknown as string;
}

export async function joinFamilyGroup(uuid: string): Promise<FamilyGroupDto> {
  const response = await api.joinFamilyGroup(uuid);
  return response.data;
}
