import {
  ReceiptsApi,
  ReceiptDto,
  ReceiptIngestionResultDto,
  IngestReceiptRequestFormatEnum,
} from '@elliotJHarding/meals-api';
import { axiosInstance, baseUrl, configuration } from './client';

const api = new ReceiptsApi(configuration, baseUrl, axiosInstance);

export async function getReceipts(): Promise<ReceiptDto[]> {
  const response = await api.getReceipts();
  return response.data;
}

export async function ingestReceipt(
  rawContent: string,
  format: IngestReceiptRequestFormatEnum,
): Promise<ReceiptIngestionResultDto> {
  const response = await api.ingestReceipt({ rawContent, format });
  return response.data;
}
