import {describe, it, expect} from 'vitest';
import {filterRequisitions, filterGuides} from '../frontend/lib/search.js';

const reqs = [
  {id: '1', positionTitle: 'Senior Product Manager', reqNumber: 'R-1001'},
  {id: '2', positionTitle: 'Store Manager', reqNumber: 'R-2002'},
  {id: '3', positionTitle: 'Analyst', reqNumber: ''},
];

describe('filterRequisitions', () => {
  it('matches title or Req # case-insensitively', () => {
    expect(filterRequisitions(reqs, 'manager').map((r) => r.id)).toEqual(['1', '2']);
    expect(filterRequisitions(reqs, 'r-2002').map((r) => r.id)).toEqual(['2']);
    expect(filterRequisitions(reqs, '1001').map((r) => r.id)).toEqual(['1']);
  });

  it('returns nothing for a blank query or no matches, and respects the limit', () => {
    expect(filterRequisitions(reqs, '  ')).toEqual([]);
    expect(filterRequisitions(reqs, 'zzz')).toEqual([]);
    expect(filterRequisitions(reqs, 'a', 1)).toHaveLength(1);
  });
});

describe('filterGuides', () => {
  const guides = [
    {id: 'a', name: 'Old', positionTitle: 'Analyst', reqNumber: 'R-3', createdTime: 1},
    {id: 'b', name: 'New', positionTitle: 'Store Manager', reqNumber: 'R-2002', createdTime: 2},
  ];

  it('sorts newest first and filters by name, title or Req #', () => {
    expect(filterGuides(guides, '').map((g) => g.id)).toEqual(['b', 'a']);
    expect(filterGuides(guides, 'analyst').map((g) => g.id)).toEqual(['a']);
    expect(filterGuides(guides, 'r-2002').map((g) => g.id)).toEqual(['b']);
    expect(guides[0].id).toBe('a');
  });
});
