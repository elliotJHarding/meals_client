import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MealDto } from '@elliotJHarding/meals-api';
import { getAllMeals } from '../api/meals';

const listVariants = {
  shown: { transition: { staggerChildren: 0.04 } },
};

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  shown: { opacity: 1, y: 0 },
};

export default function LibraryView() {
  const [meals, setMeals] = useState<MealDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    getAllMeals()
      .then((all) => setMeals([...all].sort((a, b) => a.name.localeCompare(b.name))))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="loading-page">leafing through…</div>;
  }

  return (
    <div className="page">
      <header className="week-header">
        <h1 className="display">Library</h1>
      </header>
      <p className="week-subtitle smallcaps">
        {meals.length === 0 ? 'nothing in here yet' : `${meals.length} meals you cook`}
      </p>

      {meals.length === 0 ? (
        <div className="empty-state">
          <p className="display">An empty larder.</p>
          <p>
            Meals you write into the week will gather here on their own — no
            filing required.
          </p>
        </div>
      ) : (
        <motion.div
          className="library-list"
          variants={listVariants}
          initial="hidden"
          animate="shown"
        >
          {meals.map((meal) => {
            const expanded = expandedId === meal.id;
            const ingredients = meal.ingredients ?? [];
            const details = [
              meal.serves != null ? `serves ${meal.serves}` : null,
              meal.effort?.toLowerCase(),
              meal.prepTimeMinutes != null ? `${meal.prepTimeMinutes} min` : null,
            ]
              .filter(Boolean)
              .join(' · ');
            return (
              <motion.button
                key={meal.id}
                className={`meal-card${expanded ? ' expanded' : ''}`}
                variants={rowVariants}
                onClick={() => setExpandedId(expanded ? null : meal.id ?? null)}
              >
                <div className="row">
                  {meal.image?.url && <img src={meal.image.url} alt="" loading="lazy" />}
                  <h3>{meal.name}</h3>
                  <span className="leader" aria-hidden="true" />
                  {ingredients.length > 0 && (
                    <span className="count">{ingredients.length}</span>
                  )}
                </div>
                <AnimatePresence>
                  {expanded && ingredients.length > 0 && (
                    <motion.div
                      className="ingredients"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {details && <span className="smallcaps details">{details}</span>}
                      <ul>
                        {ingredients.map((ingredient) => (
                          <li key={ingredient.id ?? ingredient.name}>{ingredient.name}</li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
