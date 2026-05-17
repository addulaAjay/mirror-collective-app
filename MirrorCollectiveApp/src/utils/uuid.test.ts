import { uuidV4 } from './uuid';

describe('uuidV4', () => {
  it('produces a string in the canonical 8-4-4-4-12 hex form', () => {
    for (let i = 0; i < 50; i++) {
      const id = uuidV4();
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
    }
  });

  it('sets the version nibble to 4 (UUID v4)', () => {
    for (let i = 0; i < 50; i++) {
      const id = uuidV4();
      // 14th char (index 14) is the version nibble.
      expect(id.charAt(14)).toBe('4');
    }
  });

  it('sets the variant bits to RFC-4122 (8/9/a/b)', () => {
    for (let i = 0; i < 50; i++) {
      const id = uuidV4();
      expect(['8', '9', 'a', 'b']).toContain(id.charAt(19));
    }
  });

  it('produces distinct values across calls (sanity)', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      seen.add(uuidV4());
    }
    // No collisions in 1000 — Math.random is good enough at this scale.
    expect(seen.size).toBe(1000);
  });
});
