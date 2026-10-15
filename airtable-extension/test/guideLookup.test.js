import {describe, it, expect} from 'vitest';
import {resolveGuide} from '../frontend/lib/guideLookup.js';

const guides = [{id: 'rec1'}, {id: 'rec2'}];

describe('resolveGuide', () => {
  it('is none when no guide is requested', () => {
    expect(resolveGuide({requestedId: undefined, guides, loaded: true, pendingId: null})).toEqual({status: 'none'});
  });

  it('opens a guide that is in the list', () => {
    expect(resolveGuide({requestedId: 'rec2', guides, loaded: true, pendingId: null})).toEqual({status: 'open', guide: {id: 'rec2'}});
  });

  it('is loading while records have not arrived', () => {
    expect(resolveGuide({requestedId: 'rec9', guides: [], loaded: false, pendingId: null}).status).toBe('loading');
  });

  it('waits for a just-created guide that is not in the list yet', () => {
    expect(resolveGuide({requestedId: 'rec9', guides, loaded: true, pendingId: 'rec9'}).status).toBe('waiting');
  });

  it('reports a guide missing only when it was not just created', () => {
    expect(resolveGuide({requestedId: 'rec9', guides, loaded: true, pendingId: null}).status).toBe('missing');
    expect(resolveGuide({requestedId: 'rec9', guides, loaded: true, pendingId: 'rec8'}).status).toBe('missing');
  });
});
