import { describe, expect, it } from 'vitest';

import { describeSystem } from './system-info.js';

describe('describeSystem', () => {
  it('keeps the release given by the platform', () => {
    expect(describeSystem('example', 'Exemplo', 'r-42')).toEqual({ system: 'example', name: 'Exemplo', release: 'r-42' });
  });

  it('marks a blank release as unknown', () => {
    expect(describeSystem('example', 'Exemplo', '  ').release).toBe('unknown');
  });
});
