import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  IngestReceiptRequestFormatEnum,
  type ReceiptDto,
  type ReceiptIngestionResultDto,
} from '@elliotJHarding/meals-api';
import { queryKeys } from './keys';
import { useMealsApi } from './provider';

/**
 * The receipts list. Errors are non-fatal in the web view (an empty list is
 * acceptable), so `retry: false` plus the shared defaults surface a failure as
 * a benign empty state rather than a thrown error. Re-fetched after a
 * successful ingest.
 */
export function useReceipts() {
  const { receiptsApi } = useMealsApi();
  return useQuery<ReceiptDto[]>({
    queryKey: queryKeys.receipts,
    queryFn: async () => (await receiptsApi.getReceipts()).data,
  });
}

export type UploadState = 'idle' | 'working' | 'error';

export interface IngestReceiptInput {
  rawContent: string;
  format: IngestReceiptRequestFormatEnum;
}

/**
 * Extracts the server's user-facing message from an ingest failure
 * (`error.response.data.message`), preserving the web view's error-detail
 * extraction. Falls back to the raw error message.
 */
export function ingestErrorMessage(error: unknown): string | undefined {
  const message = (error as { response?: { data?: { message?: string } } })?.response?.data
    ?.message;
  if (message) return message;
  return error instanceof Error ? error.message : undefined;
}

/**
 * Ingests a receipt (an .eml source or pasted text). The
 * ReceiptIngestionResultDto is returned to the caller as transient view state —
 * NOT cached.
 *
 * On success it invalidates `['receipts']`, matching the web view which
 * re-fetches the list after an ingest.
 *
 * BEHAVIOUR DECISION: ingestion can create new library meals (`link.newMeal`),
 * so by rights this should also invalidate `['meals']`. The current web view
 * does NOT do that — strict parity is receipts-only. The meals invalidation is
 * left commented so the choice is explicit and reversible in one line.
 */
export function useIngestReceipt() {
  const { receiptsApi } = useMealsApi();
  const queryClient = useQueryClient();

  return useMutation<ReceiptIngestionResultDto, unknown, IngestReceiptInput>({
    mutationFn: async ({ rawContent, format }) =>
      (await receiptsApi.ingestReceipt({ rawContent, format })).data,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.receipts });
      // Ingestion can populate the meal library; enable to refresh it too:
      // void queryClient.invalidateQueries({ queryKey: queryKeys.meals });
    },
  });
}

export { IngestReceiptRequestFormatEnum };
