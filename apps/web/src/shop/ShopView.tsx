import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ReceiptDto,
  ReceiptIngestionResultDto,
  IngestReceiptRequestFormatEnum,
} from '@elliotJHarding/meals-api';
import { getReceipts, ingestReceipt } from '../api/receipts';

type UploadState = 'idle' | 'working' | 'error';

export default function ShopView() {
  const [receipts, setReceipts] = useState<ReceiptDto[]>([]);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [result, setResult] = useState<ReceiptIngestionResultDto | null>(null);
  const [pasting, setPasting] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getReceipts().then(setReceipts).catch(console.error);
  }, []);

  const ingest = async (rawContent: string, format: IngestReceiptRequestFormatEnum) => {
    setUploadState('working');
    setResult(null);
    try {
      const outcome = await ingestReceipt(rawContent, format);
      setResult(outcome);
      setUploadState('idle');
      setPasting(false);
      setPastedText('');
      getReceipts().then(setReceipts).catch(console.error);
    } catch (error: unknown) {
      console.error('Ingestion failed', error);
      const detail = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
      setErrorMessage(detail ?? 'Something went wrong reading the receipt');
      setUploadState('error');
    }
  };

  const onFileChosen = async (file: File | undefined) => {
    if (!file) {
      return;
    }
    const content = await file.text();
    await ingest(content, IngestReceiptRequestFormatEnum.EML);
  };

  return (
    <div className="page">
      <header className="week-header">
        <h1 className="display">Shop</h1>
      </header>
      <p className="week-subtitle smallcaps">drop in the order email after each shop</p>

      {uploadState === 'working' ? (
        <div className="upload-card working">
          <span className="display working-text">reading the receipt…</span>
          <span className="smallcaps">linking it to your week</span>
        </div>
      ) : pasting ? (
        <div className="upload-card">
          <textarea
            autoFocus
            value={pastedText}
            placeholder="paste the order email text here"
            onChange={(event) => setPastedText(event.target.value)}
            rows={8}
          />
          <div className="upload-actions">
            <button className="pill" onClick={() => setPasting(false)}>cancel</button>
            <button
              className="pill primary"
              disabled={pastedText.trim().length === 0}
              onClick={() => ingest(pastedText, IngestReceiptRequestFormatEnum.TEXT)}
            >
              ingest
            </button>
          </div>
        </div>
      ) : (
        <div className="upload-card">
          <button className="pill primary" onClick={() => fileInputRef.current?.click()}>
            upload order email (.eml)
          </button>
          <button className="pill" onClick={() => setPasting(true)}>
            or paste the email text
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".eml,message/rfc822"
            hidden
            onChange={(event) => onFileChosen(event.target.files?.[0])}
          />
        </div>
      )}

      {uploadState === 'error' && <p className="upload-error">{errorMessage}</p>}

      <AnimatePresence>
        {result && (
          <motion.section
            className="ingestion-result"
            initial="hidden"
            animate="shown"
            variants={{ shown: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } } }}
          >
            <motion.h2
              className="display"
              variants={{ hidden: { opacity: 0, y: 8 }, shown: { opacity: 1, y: 0 } }}
            >
              {result.receipt?.groceryItems?.length ?? 0} items ·{' '}
              {result.receipt?.total != null ? `£${result.receipt.total.toFixed(2)}` : 'receipt read'}
            </motion.h2>
            {(result.linkedMeals ?? []).map((link) => (
              <motion.div
                className="linked-meal"
                key={`${link.date}-${link.mealName}`}
                variants={{ hidden: { opacity: 0, x: -12 }, shown: { opacity: 1, x: 0 } }}
              >
                <div className="linked-meal-head">
                  <span className="name">{link.mealName}</span>
                  {link.newMeal && <span className="tag">new in library</span>}
                </div>
                <span className="smallcaps">
                  {link.ingredientsAdded ?? 0} ingredients learned
                  {link.confidence ? ` · ${link.confidence} confidence` : ''}
                </span>
              </motion.div>
            ))}
            {(result.unlinkedItems ?? []).length > 0 && (
              <motion.p
                className="unlinked-summary smallcaps"
                variants={{ hidden: { opacity: 0 }, shown: { opacity: 1 } }}
              >
                {(result.unlinkedItems ?? []).length} items not tied to meals (snacks, staples, household)
              </motion.p>
            )}
          </motion.section>
        )}
      </AnimatePresence>

      {receipts.length > 0 && (
        <section className="receipt-history">
          <h2 className="smallcaps">past shops</h2>
          {receipts.map((receipt) => (
            <div className="receipt-row" key={receipt.id}>
              <span className="date">{receipt.orderDate ? String(receipt.orderDate) : '—'}</span>
              <span className="items">{receipt.groceryItems?.length ?? 0} items</span>
              <span className="total">
                {receipt.total != null ? `£${receipt.total.toFixed(2)}` : ''}
              </span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
