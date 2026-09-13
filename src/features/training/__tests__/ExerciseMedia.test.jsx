import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExerciseMedia from '../components/ExerciseMedia.jsx';

const exercise = { id: 'exercise', name: 'Bench Press', media: { previewUrl: '/preview.jpg', animationUrl: '/demo.gif' } };

describe('Exercise contract media', () => {
  it('uses exactly the supplied preview URL for a card', () => {
    render(<ExerciseMedia exercise={exercise} />);
    expect(screen.getByRole('img', { name: 'Bench Press preview' })).toHaveAttribute('src', '/preview.jpg');
    expect(document.querySelector('[src="/demo.gif"]')).toBeNull();
    expect(document.querySelector('canvas')).toBeNull();
  });
  it('starts details with a static preview and plays only the supplied animation', async () => {
    const user = userEvent.setup(); render(<ExerciseMedia exercise={exercise} detail />);
    expect(screen.getByRole('img')).toHaveAttribute('src', '/preview.jpg');
    await user.click(screen.getByRole('button', { name: 'Play Bench Press demonstration' }));
    expect(screen.getByRole('img')).toHaveAttribute('src', '/demo.gif');
    await user.click(screen.getByRole('button', { name: 'Pause Bench Press demonstration' }));
    expect(screen.getByRole('img')).toHaveAttribute('src', '/preview.jpg');
  });
  it('allows explicit playback after a failed preview without synthesizing another URL', async () => {
    const user = userEvent.setup(); render(<ExerciseMedia exercise={exercise} />);
    fireEvent.error(screen.getByRole('img'));
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Play Bench Press demonstration' }));
    expect(screen.getByRole('img')).toHaveAttribute('src', '/demo.gif');
  });
  it('does not load an animation-only entry until requested', async () => {
    const user = userEvent.setup(); render(<ExerciseMedia exercise={{ ...exercise, media: { previewUrl: null, animationUrl: '/demo.gif' } }} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Play Bench Press demonstration' }));
    expect(screen.getByRole('img')).toHaveAttribute('src', '/demo.gif');
  });
  it('shows the standard placeholder when both URLs are null', () => {
    render(<ExerciseMedia exercise={{ ...exercise, media: { previewUrl: null, animationUrl: null } }} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
  it('restores the preview if the animation fails', async () => {
    const user = userEvent.setup(); render(<ExerciseMedia exercise={exercise} detail />);
    await user.click(screen.getByRole('button', { name: 'Play Bench Press demonstration' }));
    fireEvent.error(screen.getByRole('img'));
    expect(screen.getByRole('img')).toHaveAttribute('src', '/preview.jpg');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
  it('resets playback for another exercise', async () => {
    const user = userEvent.setup(); const view = render(<ExerciseMedia exercise={exercise} detail />);
    await user.click(screen.getByRole('button', { name: 'Play Bench Press demonstration' }));
    view.rerender(<ExerciseMedia exercise={{ ...exercise, id: 'other', name: 'Other movement', media: { previewUrl: '/other.jpg', animationUrl: '/other.gif' } }} detail />);
    expect(screen.getByRole('img')).toHaveAttribute('src', '/other.jpg');
  });
});
