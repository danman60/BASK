import { describe, expect, it } from 'vitest';

import {
  allowed,
  APPROVED,
  FEATURE_KEYS,
  featuresForPath,
  featuresForProcedure,
  readFlags,
  resolveEnv,
} from '../src/flags';

describe('mode', () => {
  it('unset BASK_ENV is demo, so the live demo keeps every surface', () => {
    expect(resolveEnv({})).toBe('demo');
    expect(Object.values(readFlags({})).every(Boolean)).toBe(true);
  });

  it('production turns off everything not approved', () => {
    const flags = readFlags({ BASK_ENV: 'production' });
    for (const key of FEATURE_KEYS) expect(flags[key]).toBe(APPROVED.includes(key));
  });

  it('a per-flag override wins in both directions', () => {
    expect(readFlags({ BASK_ENV: 'production', BASK_FLAG_COMMUNITY: 'on' }).community).toBe(true);
    expect(readFlags({ BASK_ENV: 'dev', BASK_FLAG_CUSTOMER_HEALTH: '0' }).customerHealth).toBe(false);
    expect(readFlags({ BASK_ENV: 'production', BASK_FLAG_COMMUNITY: 'maybe' }).community).toBe(false);
  });
});

describe('ownership', () => {
  it('a nested route needs its parent feature on too', () => {
    expect(featuresForPath('/compass/knowledge/x').sort()).toEqual(['compass', 'knowledgeBase']);
    const flags = { ...readFlags({}), compass: false };
    expect(allowed(flags, featuresForPath('/compass/knowledge'))).toBe(false);
  });

  it('prefix match is by segment, not by string', () => {
    expect(featuresForPath('/communityx')).toEqual([]);
    expect(featuresForPath('/')).toEqual([]);
  });

  it('maps tRPC procedures', () => {
    expect(featuresForProcedure('marketing.generate')).toEqual(['campaigns']);
    expect(featuresForProcedure('today.feed')).toEqual([]);
  });
});
