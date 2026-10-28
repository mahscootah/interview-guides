import React from 'react';
import {downloadBytes} from '../lib/download.js';

export function GenerateBar({problems, busy, result, onGenerate, onCopy}) {
  return (
    <section className="card primary">
      {problems.length > 0 && (
        <ul className="problems">{problems.map((p) => <li key={p}>{p}</li>)}</ul>
      )}
      <div className="row">
        <button type="button" className="go" disabled={busy || problems.length > 0} onClick={onGenerate}>
          {busy ? 'Preparing…' : 'Generate guide'}
        </button>
        <button type="button" onClick={onCopy}>Copy questions</button>
      </div>
      {result?.status === 'attached' && <p className="ok">Guide attached ✓</p>}
      {result?.status === 'download' && (
        <div>
          <p className="problems">Couldn't attach the guide: {result.error}.{result.bytes ? ' Download it and drag it into Guide File.' : ''}</p>
          {result.bytes && <button type="button" onClick={() => downloadBytes(result.bytes, result.filename)}>Download .docx</button>}
        </div>
      )}
    </section>
  );
}
