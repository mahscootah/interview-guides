import {describe, it, expect} from 'vitest';
import {attachedNotice} from '../frontend/lib/notice.js';

const bytes = new Uint8Array([7]);

describe('attachedNotice', () => {
  it('says the guide was attached and offers the file', () => {
    expect(attachedNotice('Sr PM – Panel', {filename: 'g.docx', bytes})).toEqual({
      text: 'Guide attached to "Sr PM – Panel" and the requisition ✓', tone: 'ok', download: {filename: 'g.docx', bytes},
    });
  });

  it('flags a requisition problem but still offers the file', () => {
    expect(attachedNotice('Sr PM – Panel', {filename: 'g.docx', bytes, warning: "It wasn't added (No permission)."})).toEqual({
      text: 'Guide attached to "Sr PM – Panel". It wasn\'t added (No permission).', tone: 'problem', download: {filename: 'g.docx', bytes},
    });
  });
});
