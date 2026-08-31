import { describe, expect, it } from 'vitest';
import { canAnimateHero, HERO_INTERVAL_MS, rankTrailers } from '../../src/utils/trailers';

describe('trailer selection and playback lifecycle', () => {
  const video = (key, language, official = true) => ({ key, iso_639_1: language, official, site: 'YouTube', type: 'Trailer' });
  it('selects official trailers in Spanish, then English, then original language', () => {
    const result = rankTrailers([video('aaaaaaaaaaa', 'ja'), video('bbbbbbbbbbb', 'en'), video('ccccccccccc', 'es'), video('ddddddddddd', 'es', false), video('bbbbbbbbbbb', 'en'), { ...video('eeeeeeeeeee', 'es'), type: 'Clip' }, video('invalid', 'es')], 'ja');
    expect(result.map((item) => item.key)).toEqual(['ccccccccccc', 'bbbbbbbbbbb', 'aaaaaaaaaaa', 'ddddddddddd']);
  });
  it('rotates every eight seconds only when motion is allowed', () => {
    expect(HERO_INTERVAL_MS).toBe(8000);
    const state = { visible: true, hidden: false, modalOpen: false, paused: false, reduced: false };
    expect(canAnimateHero(state)).toBe(true);
    for (const [key, value] of Object.entries({ visible: false, hidden: true, modalOpen: true, paused: true, reduced: true })) expect(canAnimateHero({ ...state, [key]: value })).toBe(false);
  });
});
