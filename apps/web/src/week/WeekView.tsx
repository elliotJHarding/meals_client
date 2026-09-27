import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { formatDate } from '../api/client';
import { useWeekPlans } from './useWeekPlans';
import DayBlock from './DayBlock';

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
  const { planFor, loading, saveState, addEntry, removeEntry } = useWeekPlans(weekStart);

  const changeWeek = (to: Date, dir: number) => {
    setDirection(dir);
    setWeekStart(to);
  };

  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekEnd = weekDates[6];
  const todayKey = formatDate(new Date());
  const onCurrentWeek = weekDates.some((date) => formatDate(date) === todayKey);

  const range =
    weekStart.getMonth() === weekEnd.getMonth()
      ? `${weekStart.getDate()}–${weekEnd.getDate()} ${weekStart.getFullYear()}`
      : `${weekStart.getDate()} ${MONTHS[weekStart.getMonth()].slice(0, 3)} – ${weekEnd.getDate()} ${MONTHS[weekEnd.getMonth()].slice(0, 3)} ${weekEnd.getFullYear()}`;

  return (
    <div className="page">
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
          <span className="week-range smallcaps">{range}</span>
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
            key={formatDate(weekStart)}
            custom={direction}
            variants={weekVariants}
            initial="enter"
            animate="centre"
            exit="exit"
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {weekDates.map((date) => (
              <DayBlock
                key={formatDate(date)}
                date={date}
                plan={planFor(date)}
                isToday={formatDate(date) === todayKey}
                onAdd={(text) => addEntry(date, text)}
                onRemove={(entryIndex) => removeEntry(date, entryIndex)}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
