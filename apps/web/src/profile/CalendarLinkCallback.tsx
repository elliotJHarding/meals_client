import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLinkCalendar } from '@meals_client/core';

// Where Google sends the user back after the consent screen. We exchange the
// `code` for a linked calendar, then return to the profile. The ref guards
// against React's double-invoke in dev exchanging the code twice.
export default function CalendarLinkCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState(false);
  const exchanged = useRef(false);
  const linkCalendar = useLinkCalendar();

  useEffect(() => {
    if (exchanged.current) return;
    exchanged.current = true;

    const code = searchParams.get('code');
    if (!code) {
      setError(true);
      return;
    }

    // useLinkCalendar decodes the code and invalidates the calendar queries on
    // success, so the profile reflects the new link when we navigate back.
    linkCalendar
      .mutateAsync(code)
      .then(() => navigate('/profile', { replace: true }))
      .catch(() => setError(true));
  }, [searchParams, navigate]);

  return (
    <div className="loading-page">
      {error ? 'could not link your calendar' : 'linking your calendar…'}
    </div>
  );
}
