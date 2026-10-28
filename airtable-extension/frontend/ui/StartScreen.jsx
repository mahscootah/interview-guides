import React from 'react';
import {NewGuidePanel} from './NewGuidePanel.jsx';
import {RecentGuides} from './RecentGuides.jsx';
import {downloadBytes} from '../lib/download.js';

export function StartScreen({requisitions, guides, notice, onCreate, onOpen}) {
  return (
    <div>
      {notice && (
        <div className="row">
          <p role="status" className={notice.tone === 'ok' ? 'ok' : 'problems'}>{notice.text}</p>
          {notice.download && (
            <button type="button" onClick={() => downloadBytes(notice.download.bytes, notice.download.filename)}>
              Download {notice.download.filename}
            </button>
          )}
        </div>
      )}
      <NewGuidePanel requisitions={requisitions} onCreate={onCreate} />
      <RecentGuides guides={guides} onOpen={onOpen} />
    </div>
  );
}
