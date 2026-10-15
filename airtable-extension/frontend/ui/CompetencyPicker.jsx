import React from 'react';

function Group({title, names, chosen, onToggle}) {
  return (
    <div>
      <h3>{title}</h3>
      {names.map((name) => (
        <label key={name} style={{fontWeight: 400}}>
          <input type="checkbox" checked={chosen.has(name)} onChange={() => onToggle(name)} /> {name}
        </label>
      ))}
    </div>
  );
}

export function CompetencyPicker({bank, selections, onToggle}) {
  const chosen = new Set(selections.competencies.map((c) => c.name));
  const offered = new Set([...bank.LEADERSHIP, ...bank.BEHAVIORAL]);
  const retired = [...chosen].filter((name) => !offered.has(name));
  return (
    <section className="card">
      <h3>Competencies</h3>
      <p className="muted">Check the competencies listed in Workday.</p>
      <Group title="Leadership Capabilities" names={bank.LEADERSHIP} chosen={chosen} onToggle={onToggle} />
      <Group title="Behavioral Skills" names={bank.BEHAVIORAL} chosen={chosen} onToggle={onToggle} />
      {retired.length > 0 && <Group title="No longer offered" names={retired} chosen={chosen} onToggle={onToggle} />}
    </section>
  );
}
