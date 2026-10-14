import React, {useState} from 'react';
import {filterRequisitions} from '../lib/search.js';
import {defaultGuideName} from '../lib/fileName.js';
import {ROUNDS} from '../lib/airtableData.js';

export function NewGuidePanel({requisitions, onCreate}) {
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState(null);
  const [round, setRound] = useState(ROUNDS[0]);
  const [name, setName] = useState('');
  const [nameEdited, setNameEdited] = useState(false);
  const [busy, setBusy] = useState(false);
  const matches = filterRequisitions(requisitions, query);

  const pick = (req) => {
    setPicked(req);
    if (!nameEdited) setName(defaultGuideName(req.positionTitle, round));
  };
  const changeRound = (value) => {
    setRound(value);
    if (picked && !nameEdited) setName(defaultGuideName(picked.positionTitle, value));
  };
  const create = async () => {
    setBusy(true);
    try {
      await onCreate({requisitionId: picked.id, round, name: name.trim()});
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card primary">
      <h2>New guide</h2>
      <label htmlFor="gb-req">Find requisition</label>
      <input id="gb-req" type="text" autoFocus value={query} placeholder="Position title or Req #"
        onChange={(e) => setQuery(e.target.value)} />
      {query.trim() && !matches.length && <p className="muted">No requisitions match "{query.trim()}".</p>}
      <div className="list">
        {matches.map((r) => (
          <button key={r.id} type="button" aria-pressed={picked?.id === r.id} onClick={() => pick(r)}>
            {r.positionTitle || '(no title)'} <span className="muted">{r.reqNumber}</span>
          </button>
        ))}
      </div>
      {picked && (
        <>
          <label htmlFor="gb-round">Interview round</label>
          <select id="gb-round" value={round} onChange={(e) => changeRound(e.target.value)}>
            {ROUNDS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <label htmlFor="gb-name">Guide name</label>
          <input id="gb-name" type="text" value={name}
            onChange={(e) => { setName(e.target.value); setNameEdited(true); }} />
          <p>
            <button type="button" className="go" disabled={busy || !name.trim()} onClick={create}>Create guide</button>
          </p>
        </>
      )}
    </section>
  );
}
