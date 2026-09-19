import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTrainingHistory } from '../useTraining.js';
import { dateRange, fieldErrors } from '../training.domain.js';
import { Bit, Button, Field, ErrorNotice, Loading, Pagination, Icon } from './TrainingUI.jsx';
import HistoryList from './HistoryList.jsx';
import { validCalendarDate } from '../../daily-summary/daily-summary.domain.js';
import s from '../Training.module.css';

export default function TrainingHistory() {
  const [params] = useSearchParams();
  const day = validCalendarDate(params.get('date')) ? params.get('date') : '';
  const [from, setFrom] = useState(day), [to, setTo] = useState(day), [page, setPage] = useState(1);
  const range = dateRange(from, to);
  const query = useTrainingHistory({ ...range.params, page, limit: 10 }, !range.error);
  const errors = fieldErrors(query.error, ['from', 'to']);
  useEffect(() => { document.title = 'Your training — Spotter'; }, []);
  return <div className={s.page}>
    <Link className={s.textLink} to="/app/training"><Icon name="back" />Training</Link>
    <header className={s.pageHeader}><div><p className={s.eyebrow}>YOUR JOURNEY / THE WORK YOU PUT IN</p><h1>Your training<span>.</span></h1><p className={s.muted}>Every session is part of your story.</p></div></header>
    <div className={s.historyFilters}><Field label="From" error={errors.from} type="date" value={from} onChange={event => { setFrom(event.target.value); setPage(1); }} /><Field label="To" error={errors.to} type="date" value={to} min={from || undefined} onChange={event => { setTo(event.target.value); setPage(1); }} />{(from || to) && <Button variant="textButton" onClick={() => { setFrom(''); setTo(''); setPage(1); }}>Clear dates</Button>}</div>
    {range.error ? <ErrorNotice error={range.error} /> : query.isPending ? <Loading /> : query.isError ? <ErrorNotice error={query.error} retry={query.refetch} /> : query.data.items.length ? <><HistoryList workouts={query.data.items} /><Pagination pagination={query.data.pagination} busy={query.isFetching} onPage={setPage} /></> : <div className={s.empty}><Bit mood="point" /><h2>{from || to ? 'A quieter stretch.' : 'Your next chapter starts here.'}</h2><p>{from || to ? 'No sessions in this date range. Try widening the view.' : 'Start a workout and make your first mark.'}</p><Link className={`${s.button} ${s.primary}`} to="/app/training">Back to training<Icon /></Link></div>}
  </div>;
}

