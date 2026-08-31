import { describe, expect, it } from 'vitest';
import { canPlayPreview, createPlaybackClock, rankTrailers } from '../../src/utils/trailers';
import { pauseOtherPlayers, registerPlayer } from '../../src/lib/youtube';

describe('trailer selection and playback lifecycle', () => {
  const video = (key, language, official = true) => ({ key, iso_639_1: language, official, site: 'YouTube', type: 'Trailer' });
  it('selects official trailers in Spanish, then English, then original language', () => {
    const result = rankTrailers([video('aaaaaaaaaaa', 'ja'), video('bbbbbbbbbbb', 'en'), video('ccccccccccc', 'es'), video('ddddddddddd', 'es', false), video('bbbbbbbbbbb', 'en'), { ...video('eeeeeeeeeee', 'es'), type: 'Clip' }, video('invalid', 'es')], 'ja');
    expect(result.map((item) => item.key)).toEqual(['ccccccccccc', 'bbbbbbbbbbb', 'aaaaaaaaaaa', 'ddddddddddd']);
  });
  it('counts eight seconds of actual playing, excluding buffering and pause', () => {
    const clock = createPlaybackClock();
    expect(clock.update(true, 0)).toBe(false);
    expect(clock.update(false, 3000)).toBe(false);
    expect(clock.update(true, 23000)).toBe(false);
    expect(clock.update(true, 27999)).toBe(false);
    expect(clock.update(false, 28000)).toBe(true);
    clock.reset();
    expect(clock.update(true, 29000)).toBe(false);
  });
  it('requires visible page, visible player, closed modal and no pause', () => {
    const state = { visible: true, hidden: false, modalOpen: false, paused: false };
    expect(canPlayPreview(state)).toBe(true);
    for (const [key, value] of Object.entries({ visible: false, hidden: true, modalOpen: true, paused: true })) expect(canPlayPreview({ ...state, [key]: value })).toBe(false);
  });
  it('pauses other players and removes destroyed players from coordination', () => {
    let pauses = 0;
    const first = { pauseVideo: () => pauses++ };
    const second = { pauseVideo: () => {} };
    const removeFirst = registerPlayer(first);
    const removeSecond = registerPlayer(second);
    pauseOtherPlayers(second);
    expect(pauses).toBe(1);
    removeFirst(); pauseOtherPlayers(second);
    expect(pauses).toBe(1);
    removeSecond();
  });
});
