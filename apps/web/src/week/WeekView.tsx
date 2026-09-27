import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCalendarEvents, useCalendarAuthUrl } from '@meals_client/core';
import { formatDate } from '../api/client';
import { useWeekPlans } from './useWeekPlans';
import DayBlock from './DayBlock';

type Mode = 'meals' | 'calendar';

const mondayOf = (date: Date): Date => {
  const monday = new Date(date);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return monday;
};

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const weekVariants = {
  enter: (direction: number) => ({ x: direction * 48, opacity: 0 }),
  centre: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.22, ease: 'easeOut', staggerChildren: 0.045 },
  },
  exit: (direction: number) => ({ x: direction * -48, opacity: 0 }),
};

export default function WeekView() {
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [direction, setDirection] = useState(0);
  // Screen-level, not persisted: defaults to meals and resets on reload.
  const [mode, setMode] = useState<Mode>('meals');
  const { planFor, loading, saveState, addEntry, removeEntry } = useWeekPlans(weekStart);
  const { eventsFor, authorized } = useCalendarEvents(weekStart);

  const changeWeek = (to: Date, dir: number) => {
    setDirection(dir);
    setWeekStart(to);
  };

  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const todayKey = formatDate(new Date());
  const onCurrentWeek = weekDates.some((date) => formatDate(date) === todayKey);

  const year = weekStart.getFullYear();

  return (
    <div className="page week-page">
      <AnimatePresence>
        {saveState !== 'idle' && (
          <motion.div
            className={`saving-indicator${saveState === 'error' ? ' error' : ''}`}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            {saveState === 'saving' ? 'saving…' : 'couldn’t save'}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="week-header">
        <h1 className="display">
          {MONTHS[weekStart.getMonth()]}
          <span className="week-year">{year}</span>
        </h1>
        <nav className="week-nav">
          {/* Always in the layout so the arrows never shift; fades in and out */}
          <motion.button
            className="today-pill"
            initial={false}
            animate={onCurrentWeek ? 'hidden' : 'shown'}
            variants={{
              hidden: { opacity: 0, scale: 0.85, transitionEnd: { visibility: 'hidden' } },
              shown: { opacity: 1, scale: 1, visibility: 'visible' },
            }}
            disabled={onCurrentWeek}
            onClick={() => changeWeek(mondayOf(new Date()), weekStart < new Date() ? 1 : -1)}
          >
            today
          </motion.button>
          <button aria-label="Previous week" onClick={() => changeWeek(addDays(weekStart, -7), -1)}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
          <button aria-label="Next week" onClick={() => changeWeek(addDays(weekStart, 7), 1)}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </nav>
      </header>

      {loading ? (
        <div className="loading-page" style={{ minHeight: '40vh' }}>
          turning the page…
        </div>
      ) : (
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={`${mode}-${formatDate(weekStart)}`}
            custom={direction}
            variants={weekVariants}
            initial="enter"
            animate="centre"
            exit="exit"
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {mode === 'calendar'
              ? renderCalendar()
              : weekDates.map((date) => (
                  <DayBlock
                    key={formatDate(date)}
                    date={date}
                    mode="meals"
                    plan={planFor(date)}
                    isToday={formatDate(date) === todayKey}
                    onAdd={(text) => addEntry(date, text)}
                    onRemove={(entryIndex) => removeEntry(date, entryIndex)}
                  />
                ))}
          </motion.div>
        </AnimatePresence>
      )}

      <div className="mode-switch" role="tablist" aria-label="Show meals or calendar">
        <button
          role="tab"
          aria-selected={mode === 'meals'}
          className={mode === 'meals' ? 'active' : ''}
          onClick={() => setMode('meals')}
          aria-label="Show meals"
        >
          <MealIcon />
        </button>
        <button
          role="tab"
          aria-selected={mode === 'calendar'}
          className={mode === 'calendar' ? 'active' : ''}
          onClick={() => setMode('calendar')}
          aria-label="Show calendar"
        >
          <CalendarIcon />
        </button>
      </div>
    </div>
  );

  function renderCalendar() {
    // Tri-state: undefined while the authorised check is in flight (render
    // nothing), false → prompt to connect, true → the week's events.
    if (authorized === undefined) return null;
    if (authorized === false) return <ConnectCalendarPrompt />;
    const hasAnyEvent = weekDates.some((date) => eventsFor(date).length > 0);
    if (!hasAnyEvent) return <p className="section-note calendar-empty">No events this week</p>;
    return weekDates.map((date) => (
      <DayBlock
        key={formatDate(date)}
        date={date}
        mode="calendar"
        isToday={formatDate(date) === todayKey}
        events={eventsFor(date)}
      />
    ));
  }
}

function ConnectCalendarPrompt() {
  const calendarAuthUrl = useCalendarAuthUrl();
  const [connecting, setConnecting] = useState(false);

  const onConnect = async () => {
    setConnecting(true);
    // Full-page redirect to Google's consent screen; the server returns the
    // user to /calendar/link with a `code` exchanged by CalendarLinkCallback.
    window.location.href = await calendarAuthUrl.mutateAsync();
  };

  return (
    <div className="calendar-connect">
      <p className="section-note">
        Connect your Google Calendar so the week knows what you have on.
      </p>
      <button className="pill primary" onClick={onConnect} disabled={connecting}>
        {connecting ? 'connecting' : 'connect google calendar'}
      </button>
    </div>
  );
}

function MealIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 3v8a2 2 0 0 0 4 0V3M7 11v10" />
      <path d="M17 3c-1.5 0-2.5 1.8-2.5 4.5S15.5 12 17 12s2.5-1.8 2.5-4.5S18.5 3 17 3zM17 12v9" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 3v4M16 3v4" />
    </svg>
  );
}
