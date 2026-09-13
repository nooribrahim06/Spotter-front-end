import { useEffect, useState } from 'react';
import { Icon, Button } from './TrainingUI.jsx';
import s from '../Training.module.css';

export default function ExerciseMedia({ exercise, detail = false }) {
  const [playing, setPlaying] = useState(false), [failed, setFailed] = useState([]);
  const { previewUrl, animationUrl } = exercise.media || {};
  useEffect(() => { setPlaying(false); setFailed([]); }, [exercise.id, previewUrl, animationUrl]);
  const preview = previewUrl && !failed.includes(previewUrl) ? previewUrl : null;
  const animation = animationUrl && !failed.includes(animationUrl) ? animationUrl : null;
  const src = playing ? animation || preview : preview;

  return <div className={`${s.media} ${detail ? s.detailMedia : ''}`}>
    {src ? <img src={src} alt={`${exercise.name} ${playing ? 'demonstration' : 'preview'}`} loading="lazy" onError={() => { setFailed(values => [...values, src]); setPlaying(false); }} />
      : <div className={s.mediaPlaceholder}><Icon name="movement" />{detail && <span>{animation ? 'Movement demonstration' : 'Move at your own pace'}</span>}</div>}
    {animation && (detail || !preview) && <Button variant="mediaButton" onClick={() => setPlaying(!playing)} aria-label={`${playing ? 'Pause' : 'Play'} ${exercise.name} demonstration`}><Icon name={playing ? 'close' : 'play'} />{playing ? 'Pause' : 'Play demo'}</Button>}
  </div>;
}
