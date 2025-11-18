import {
  exportAsJSON,
  exportAsMarkdown,
  exportAsText,
  generateFileName,
  formatEmotionsForExport,
} from '@/lib/cbt/export-utils';
import { createInitialCBTFormData } from '@/types/therapy';

// Ensure URL APIs exist for spying
if (!(URL as any).createObjectURL) {
  (URL as any).createObjectURL = () => 'blob://test';
}
if (!(URL as any).revokeObjectURL) {
  (URL as any).revokeObjectURL = () => {};
}

function mockDownload() {
  const link: any = { click: jest.fn(), style: {} };
  const appendChild = jest
    .spyOn(document.body, 'appendChild')
    .mockImplementation((node: any) => node as any);
  const removeChild = jest
    .spyOn(document.body, 'removeChild')
    .mockImplementation((child: any) => child as any);
  const createEl = jest.spyOn(document, 'createElement').mockImplementation(() => link);
  const revoke = jest.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  const createUrl = jest.spyOn(URL, 'createObjectURL').mockImplementation(() => 'blob://test');
  return { link, appendChild, removeChild, createEl, revoke, createUrl };
}

describe('export-utils', () => {
  it('generateFileName produces expected pattern', () => {
    const name = generateFileName('json', '20250101T123000');
    expect(name).toBe('CBT-Diary-Entry-2025-01-01-T123000.json');
  });

  it('formatEmotionsForExport filters and formats correctly', () => {
    const emotions: any = {
      fear: 3,
      anger: 0,
      sadness: 2,
      joy: 0,
      anxiety: 1,
      shame: 0,
      guilt: 0,
      other: 'surprise',
      otherIntensity: 4,
    };
    const formatted = formatEmotionsForExport(emotions);
    expect(formatted).toEqual([
      { name: 'Fear', intensity: 3 },
      { name: 'Sadness', intensity: 2 },
      { name: 'Anxiety', intensity: 1 },
      { name: 'surprise', intensity: 4 },
    ]);
  });

  it('exportAsJSON triggers a download with correct MIME', async () => {
    const mocks = mockDownload();
    const data = createInitialCBTFormData();
    await expect(exportAsJSON(data)).resolves.toBeUndefined();
    expect(mocks.link.click).toHaveBeenCalled();
  });

  it('exportAsMarkdown uses provided markdown content', async () => {
    const mocks = mockDownload();
    const data = createInitialCBTFormData();
    await exportAsMarkdown(data, '# Title\nBody');
    expect(mocks.link.click).toHaveBeenCalled();
  });

  it('exportAsText generates plain text content and downloads', async () => {
    const mocks = mockDownload();
    const data = createInitialCBTFormData();
    await exportAsText(data);
    expect(mocks.link.click).toHaveBeenCalled();
  });
});
