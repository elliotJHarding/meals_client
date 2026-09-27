import axios from 'axios';
import { Configuration } from '@elliotJHarding/meals-api';

export const baseUrl: string = import.meta.env.VITE_REPOSITORY_URL;

// Session cookie auth, same as the v1 client
export const axiosInstance = axios.create({
  baseURL: baseUrl,
  withCredentials: true,
});

export const configuration = new Configuration({ basePath: baseUrl });

// The generated API types date fields as Date, but the server speaks
// LocalDate (YYYY-MM-DD). All dates cross the wire as formatted strings.
export const formatDate = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const asApiDate = (date: Date): Date => formatDate(date) as unknown as Date;
