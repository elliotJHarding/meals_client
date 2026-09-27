import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarEventDto, PlanDto } from '@elliotJHarding/meals-api';

type DayBlockProps = {
  date: Date;
  isToday: boolean;
  mode: 'meals' | 'calendar';
  plan?: PlanDto;
  onAdd?: (text: string) => void;
  onRemove?: (index: number) => void;
  // Pre-grouped and sorted for this day (see eventsFor); only used in calendar mode.
  events?: CalendarEventDto[];
};

const DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const eventTime = (time: Date): string =>
  new Date(time).toLocaleTimeString('en-gb', { hour: '2-digit', minute: '2-digit', hour12: false });

export default function DayBlock({ date, plan, isToday, mode, onAdd, onRemove, events = [] }: DayBlockProps) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (adding) {
      inputRef.current?.focus();
    }
  }, [adding]);

  const commit = () => {
    const text = draft.trim();
    setDraft('');
    setAdding(false);
    if (text.length > 0) {
      onAdd?.(text);
    }
  };

  const planMeals = plan?.planMeals ?? [];

  return (
    <motion.section
      layout
      className={`day-block${isToday ? ' today' : ''}`}
      variants={{
        enter: { opacity: 0, y: 8 },
        centre: { opacity: 1, y: 0 },
      }}
    >
      <div className="day-label">
        <span className="dow">{DOW[date.getDay()]}</span>
        <span className="num">{date.getDate()}</span>
      </div>

      {mode === 'calendar' ? (
        <div className="entries">
          <AnimatePresence initial={false}>
            {events.map((event, index) => (
              <motion.div
                layout
                className="event-chip"
                key={`${event.name}-${index}`}
                style={{ background: event.colour, color: event.textColour }}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 24, transition: { duration: 0.16 } }}
              >
                {!event.allDay && event.time != null && (
                  <span className="event-time">{eventTime(event.time)}</span>
                )}
                <span className="event-name">{event.name}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
      <div className="entries">
        <AnimatePresence initial={false}>
          {planMeals.map((planMeal, index) => (
            <motion.div
              layout
              className="entry-row"
              key={planMeal.id ?? `${planMeal.freeText}-${index}`}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 24, transition: { duration: 0.16 } }}
            >
              {planMeal.meal != null && <span className="linked-dot" title="In your library" />}
              <span className="text">{planMeal.freeText ?? planMeal.meal?.name}</span>
              <button
                className="remove"
                aria-label="Remove entry"
                onClick={() => onRemove?.(index)}
              >
                ×
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {adding ? (
          <motion.div layout className="entry-row" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <input
              ref={inputRef}
              value={draft}
              placeholder="what's cooking?"
              onChange={(event) => setDraft(event.target.value)}
              onBlur={commit}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  commit();
                }
                if (event.key === 'Escape') {
                  setDraft('');
                  setAdding(false);
                }
              }}
            />
          </motion.div>
        ) : (
          <motion.button layout className="add-entry" onClick={() => setAdding(true)}>
            <span className="plus">+</span>
            <span>{planMeals.length === 0 ? 'add a meal' : 'add another'}</span>
          </motion.button>
        )}
      </div>
      )}
    </motion.section>
  );
}
