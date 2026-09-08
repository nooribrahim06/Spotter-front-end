import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { apiClient } from '../../api/apiClient';
import { BitCharacter } from '../../components/landing/BitCharacter.jsx';
import styles from './ExercisesPage.module.css';

export default function ExercisesPage() {
  const [search, setSearch] = useState('');
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef();

  useEffect(() => {
    const fetchExercises = async () => {
      setLoading(true);
      try {
        const { data } = await apiClient.get('/api/exercises?search=' + search);
        setExercises(data.exercises || []);
      } catch (err) {
        console.error('Failed to fetch exercises:', err);
      }
      setLoading(false);
    };
    const delay = setTimeout(fetchExercises, 300);
    return () => clearTimeout(delay);
  }, [search]);

  useGSAP(() => {
    // Mascot and header entrance animation
    gsap.fromTo('.mascot-anim', 
      { x: -50, opacity: 0, rotate: -10 },
      { x: 0, opacity: 1, rotate: 0, duration: 0.8, ease: 'back.out(1.5)', clearProps: 'all' }
    );
    gsap.fromTo('.header-text-anim', 
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out', clearProps: 'all' }
    );

    if (exercises.length > 0 && !loading) {
      gsap.fromTo(
        '.exercise-card',
        { y: 50, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.6, stagger: 0.05, ease: 'power3.out', clearProps: 'all' }
      );
    }
  }, { dependencies: [exercises, loading], scope: containerRef });

  return (
    <div className={styles.container} ref={containerRef}>
      <div className={styles.header}>
        <div className={`${styles.mascotWrapper} mascot-anim`}>
          <BitCharacter state="letsGo" />
        </div>
        <div className={styles.headerText}>
          <h1 className={`${styles.title} header-text-anim`}>Exercises Database</h1>
          <p className={`${styles.subtitle} header-text-anim`}>Explore and find the perfect movements for your next workout.</p>
        </div>
      </div>
      
      <div className={styles.searchWrapper}>
        <input 
          type="text" 
          placeholder="Search for exercises (e.g., Squat, Bench Press)..." 
          className={styles.searchInput}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className={styles.loading}>Loading exercises...</div>
      ) : (
        <div className={styles.grid}>
          {exercises.map((ex) => (
            <div key={ex.id} className={`${styles.card} exercise-card`}>
              {ex.gifUrl && (
                <div className={styles.imageWrapper}>
                  <img src={ex.gifUrl} alt={ex.name} className={styles.image} />
                </div>
              )}
              <div className={styles.content}>
                <h3 className={styles.exerciseName}>{ex.name}</h3>
                <div className={styles.tags}>
                  <span className={`${styles.tag} ${styles.tagPrimary}`}>{ex.bodyPart}</span>
                  <span className={styles.tag}>{ex.equipment}</span>
                </div>
                <p className={styles.target}>
                  Target: <span className={styles.targetName}>{ex.targetMuscle}</span>
                </p>
                {ex.instructions && ex.instructions.length > 0 && (
                  <div className={styles.instructions}>
                    {Array.isArray(ex.instructions) ? ex.instructions.join(' ') : ex.instructions}
                  </div>
                )}
              </div>
            </div>
          ))}
          {exercises.length === 0 && !loading && (
            <div className={styles.empty}>No exercises found for "{search}"</div>
          )}
        </div>
      )}
    </div>
  );
}
