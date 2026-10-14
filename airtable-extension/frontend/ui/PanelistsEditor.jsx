import React from 'react';

export function PanelistsEditor({panelists, onChange}) {
  const update = (index, value) => onChange(panelists.map((p, i) => (i === index ? value : p)));
  return (
    <section className="card">
      <h3>Panelists</h3>
      <p className="muted">Copy names from Workday.</p>
      {panelists.map((name, i) => (
        <div className="row" key={i}>
          <input type="text" aria-label={`Panelist ${i + 1}`} value={name} onChange={(e) => update(i, e.target.value)} />
          {panelists.length > 1 && (
            <button type="button" aria-label={`Remove panelist ${i + 1}`} onClick={() => onChange(panelists.filter((_, j) => j !== i))}>×</button>
          )}
        </div>
      ))}
      <button type="button" onClick={() => onChange([...panelists, ''])}>+ Add panelist</button>
    </section>
  );
}
