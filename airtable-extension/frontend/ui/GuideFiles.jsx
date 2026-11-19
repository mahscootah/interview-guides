import React from 'react';

// Airtable keeps attachments oldest first; the newest guide is the one the CES usually wants.
export function GuideFiles({files}) {
  const newestFirst = [...(files ?? [])].reverse();
  return (
    <section className="card">
      <h3>Guide files</h3>
      {!newestFirst.length && <p className="muted">No guide generated yet.</p>}
      {newestFirst.map((f) => (
        <div key={f.id ?? f.url}>
          <a href={f.url} target="_blank" rel="noopener noreferrer">{f.filename}</a>
        </div>
      ))}
    </section>
  );
}
