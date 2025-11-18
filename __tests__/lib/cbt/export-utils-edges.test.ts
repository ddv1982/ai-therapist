import { formatEmotionsForExport, exportAsMarkdown, exportAsText } from '@/lib/cbt/export-utils';
import { createInitialCBTFormData } from '@/types/domains/therapy';

describe('export-utils edge cases', () => {
  it('formatEmotionsForExport returns empty for all-zero emotions', () => {
    const form = createInitialCBTFormData();
    const out = formatEmotionsForExport(form.initialEmotions);
    expect(out).toEqual([]);
  });

  it('formatEmotionsForExport includes only custom other emotion when provided', () => {
    const form = createInitialCBTFormData();
    form.initialEmotions.other = 'Relief';
    form.initialEmotions.otherIntensity = 7;
    const out = formatEmotionsForExport(form.initialEmotions);
    expect(out).toEqual([{ name: 'Relief', intensity: 7 }]);
  });

  it('exportAsMarkdown uses provided content and correct mime/extension', async () => {
    const form = createInitialCBTFormData();
    const content = '# Provided Markdown\nHello';
    const originalCreate = (URL as any).createObjectURL;
    let capturedBlob: any;
    (URL as any).createObjectURL = (b: any) => {
      capturedBlob = b;
      return 'blob://test';
    };
    const originalCreateEl = document.createElement.bind(document);
    const anchor: any = {
      click: jest.fn(),
      style: {},
      download: '',
      _href: '',
      set href(v: string) {
        this._href = v;
      },
      get href() {
        return this._href;
      },
    };
    (document as any).createElement = (tag: string) =>
      tag === 'a' ? anchor : originalCreateEl(tag);
    const appendSpy = jest
      .spyOn(document.body, 'appendChild')
      .mockImplementation((node: any) => node as any);
    const removeSpy = jest
      .spyOn(document.body, 'removeChild')
      .mockImplementation((child: any) => child as any);

    await exportAsMarkdown(form, content);

    expect(anchor.click).toHaveBeenCalled();
    expect(String(anchor.download)).toMatch(/\.markdown$/);
    expect(capturedBlob).toBeInstanceOf(Blob);
    expect((capturedBlob as Blob).type).toBe('text/markdown');

    (URL as any).createObjectURL = originalCreate;
    (document as any).createElement = originalCreateEl as any;
    appendSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('exportAsText includes default placeholders when data empty', async () => {
    const form = createInitialCBTFormData();
    const originalCreate = (URL as any).createObjectURL;
    let capturedBlob: any;
    (URL as any).createObjectURL = (b: any) => {
      capturedBlob = b;
      return 'blob://test';
    };
    const originalCreateEl = document.createElement.bind(document);
    const anchor: any = {
      click: jest.fn(),
      style: {},
      download: '',
      _href: '',
      set href(v: string) {
        this._href = v;
      },
      get href() {
        return this._href;
      },
    };
    (document as any).createElement = (tag: string) =>
      tag === 'a' ? anchor : originalCreateEl(tag);
    const appendSpy = jest
      .spyOn(document.body, 'appendChild')
      .mockImplementation((node: any) => node as any);
    const removeSpy = jest
      .spyOn(document.body, 'removeChild')
      .mockImplementation((child: any) => child as any);

    await exportAsText(form);

    expect(anchor.click).toHaveBeenCalled();
    expect(capturedBlob).toBeInstanceOf(Blob);
    expect((capturedBlob as Blob).type).toBe('text/plain');

    (URL as any).createObjectURL = originalCreate;
    (document as any).createElement = originalCreateEl as any;
    appendSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
