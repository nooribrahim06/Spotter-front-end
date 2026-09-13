import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useActiveWorkout, useTrainingHistory } from '../useTraining.js';
import { workoutName } from '../training.domain.js';
import { Bit, Button, Elapsed, ErrorNotice, Loading, Modal, Icon } from './TrainingUI.jsx';
import WorkoutMetadataDialog from './WorkoutMetadataDialog.jsx';
import ExerciseBrowser from './ExerciseBrowser.jsx';
import HistoryList from './HistoryList.jsx';
import s from '../Training.module.css';

export default function TrainingHome() {
  const active = useActiveWorkout(), history = useTrainingHistory({ limit: 3, page: 1 });
  const [start, setStart] = useState(false), [browse, setBrowse] = useState(false);
  useEffect(() => { document.title = 'Training — Spotter'; }, []);
  const workout = active.data;
  const completed = workout?.exercises.filter(row => row.completed).length || 0;
  return <div className={s.page}>
    <header className={s.pageHeader}><div><p className={s.eyebrow}>YOUR JOURNEY</p><h1>Training<span>.</span></h1></div><Link to="/app/training/history" className={s.textLink}>Your training<Icon name="arrow" /></Link></header>
    {active.isPending ? <Loading /> : active.isError ? <ErrorNotice error={active.error} retry={active.refetch} /> : <section className={`${s.hero} ${workout ? s.liveHero : ''}`}>
      <div className={s.heroCopy}><p className={s.heroEyebrow}>{workout ? <><span className={s.liveDot} /> SESSION IN PROGRESS</> : 'SHOW UP FOR YOURSELF'} </p>
        <h2>{workout ? <>Still with you.<br /><span>Keep moving.</span></> : <>Ready<br />to <span>move?</span></>}</h2>
        {workout ? <><h3>{workoutName(workout)}</h3><p className={s.heroMeta}><Elapsed startedAt={workout.startedAt} /> · {completed} of {workout.exercises.length} completed</p><Link className={`${s.button} ${s.coral}`} to={`/app/training/workouts/${workout.id}`}>Continue workout<Icon /></Link></> : <><p>Start where you are.<br />We’ll take it one movement at a time.</p><Button variant="coral" onClick={() => setStart(true)}>Start workout<Icon /></Button></>}
      </div>
      <div className={s.heroArt}><div className={s.orbit} /><span className={s.artLabel}>{workout ? 'IN YOUR CORNER.' : 'LET’S GO.'}</span><Bit /><span className={s.artFootnote}>YOUR PACE. YOUR PROGRESS.</span></div>
      <div className={s.heroFooter}><span>01 / SHOW UP</span><span>02 / FIND YOUR RHYTHM</span><span>03 / MAKE IT COUNT</span></div>
    </section>}
    <div className={s.homeBento}>
      <section className={s.recent}><div className={s.sectionHeader}><div><p className={s.eyebrow}>THE WORK YOU PUT IN</p><h2>Recent training</h2></div><Link className={s.textLink} to="/app/training/history" aria-label="View all training">View all<Icon /></Link></div>
        {history.isPending ? <Loading compact /> : history.isError ? <ErrorNotice error={history.error} retry={history.refetch} /> : history.data.items.length ? <HistoryList workouts={history.data.items} /> : <div className={s.firstSession}><span className={s.firstSessionMark}>01</span><div><h3>Your story starts with a session.</h3><p>The movements you make today will find a home here.</p></div></div>}
      </section>
      <section className={s.discovery}><span className={s.discoveryIcon}><Icon name="movement" /></span><p className={s.eyebrow}>EXPLORE MOVEMENT</p><h2>Find your<br /> next move.</h2><p>A familiar favorite. Something new.<br />Get to know the movements.</p><Button variant="secondary" onClick={() => setBrowse(true)}>Browse exercises<Icon /></Button></section>
    </div>
    <p className={s.signature}>YOUR JOURNEY. <span>YOUR COMMUNITY.</span> YOUR COACH.</p>
    {start && <WorkoutMetadataDialog onClose={() => setStart(false)} />}
    {browse && <Modal title="Find your next move." wide onClose={() => setBrowse(false)}><ExerciseBrowser /></Modal>}
  </div>;
}

