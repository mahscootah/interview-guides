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
    expect(filterRequisitions(reqs, 'a', {limit: 1})).toHaveLength(1);
  });
});

describe('filterRequisitions ranking', () => {
  const ranked = [
    {id: 'closedMine', positionTitle: 'Manager A', reqNumber: 'R-1', status: 'Closed', recruiterId: 'usrMe', cesId: null},
    {id: 'openOther', positionTitle: 'Manager B', reqNumber: 'R-2', status: 'Open', recruiterId: 'usrX', cesId: 'usrY'},
    {id: 'openCes', positionTitle: 'Manager C', reqNumber: 'R-3', status: 'Open', recruiterId: 'usrX', cesId: 'usrMe'},
    {id: 'none', positionTitle: 'Manager D', reqNumber: 'R-4', status: '', recruiterId: null, cesId: null},
    {id: 'openRecruiter', positionTitle: 'Manager E', reqNumber: 'R-5', status: 'Open', recruiterId: 'usrMe', cesId: null},
  ];

  it('lists my open reqs (as recruiter or CES) first, then other open reqs, then the rest', () => {
    expect(filterRequisitions(ranked, 'manager', {userId: 'usrMe'}).map((r) => r.id))
      .toEqual(['openCes', 'openRecruiter', 'openOther', 'closedMine', 'none']);
  });

  it('flags my open reqs', () => {
    const flagged = filterRequisitions(ranked, 'manager', {userId: 'usrMe'}).filter((r) => r.isMine).map((r) => r.id);
    expect(flagged).toEqual(['openCes', 'openRecruiter']);
  });

  it('still puts open reqs first when there is no current user', () => {
    expect(filterRequisitions(ranked, 'manager').map((r) => r.id))
      .toEqual(['openOther', 'openCes', 'openRecruiter', 'closedMine', 'none']);
  });

  it('ranks before applying the limit', () => {
    expect(filterRequisitions(ranked, 'manager', {userId: 'usrMe', limit: 1}).map((r) => r.id)).toEqual(['openCes']);
  });

  it('does not change the input', () => {
    filterRequisitions(ranked, 'manager', {userId: 'usrMe'});
    expect(ranked[0].id).toBe('closedMine');
    expect('isMine' in ranked[2]).toBe(false);
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
