import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { UnifiedPoSubmissionForm, PoSubmissionMode } from '../components/po/UnifiedPoSubmissionForm';

export function CreatePoSubmissionPage() {
  const [searchParams] = useSearchParams();
  const quoteId = searchParams.get('quoteId') || undefined;
  const quoteNumber = searchParams.get('quoteNumber') || undefined;
  const initialMode = (searchParams.get('mode') as PoSubmissionMode) || (quoteId || quoteNumber ? 'AGAINST_QUOTATION' : 'AGAINST_QUOTATION');

  return (
    <div className="min-h-screen bg-[#F5EBE1] py-8 px-4 sm:px-6 lg:px-8">
      <UnifiedPoSubmissionForm
        defaultMode={initialMode}
        initialQuoteId={quoteId}
        initialQuoteNumber={quoteNumber}
      />
    </div>
  );
}
