import React, {useState} from 'react';
import {filterGuides} from '../lib/search.js';

export function RecentGuides({guides, onOpen}) {
  const [query, setQuery] = useState('');
  const shown = filterGuides(guides, query);
  return (
    <section className="card">
      <h2>Recent guides</h2>
      <label htmlFor="gb-guide-search">Search guides</label>
      <input id="gb-guide-search" type="text" value={query} onChange={(e) => setQuery(e.target.value)} />
      {!shown.length && <p className="muted">No guides yet.</p>}
      <div className="list">
        {shown.map((g) => (
          <button key={g.id} type="button" onClick={() => onOpen(g.id)}>
            {g.name} <span className="muted">· {g.reqNumber} · {g.round}{g.lastGenerated ? ` · generated ${g.lastGenerated}` : ''}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
