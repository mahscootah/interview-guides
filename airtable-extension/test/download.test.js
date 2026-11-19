// @vitest-environment jsdom
import {describe, it, expect, vi, afterEach} from 'vitest';
import {downloadBytes} from '../frontend/lib/download.js';

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('downloadBytes', () => {
  it('clicks a named link to a .docx blob and frees it only after the browser has started the download', () => {
    vi.useFakeTimers();
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', {...URL, createObjectURL: vi.fn(() => 'blob:guide'), revokeObjectURL});
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
      expect(this.href).toBe('blob:guide');
      expect(this.download).toBe('g.docx');
    });
    downloadBytes(new Uint8Array([1]), 'g.docx');
    expect(click).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:guide');
  });
});
