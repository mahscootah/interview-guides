import React from 'react';
import {NewGuidePanel} from './NewGuidePanel.jsx';
import {RecentGuides} from './RecentGuides.jsx';

export function StartScreen({requisitions, guides, notice, onCreate, onOpen}) {
  return (
    <div>
      {notice && <p role="status" className={notice.tone === 'ok' ? 'ok' : 'problems'}>{notice.text}</p>}
      <NewGuidePanel requisitions={requisitions} onCreate={onCreate} />
      <RecentGuides guides={guides} onOpen={onOpen} />
    </div>
  );
}
