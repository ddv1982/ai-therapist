import { extractTableDataFromTokens, convertToColumnConfig, convertToRowData } from '@/lib/ui/table-data-extractor';

type Token = { type: string; tag: string; content: string; children?: Token[] };

function makeSimpleTableTokens(): Token[] {
  return [
    { type: 'table_open', tag: 'table', content: '' },
    { type: 'thead_open', tag: 'thead', content: '' },
    { type: 'tr_open', tag: 'tr', content: '' },
    { type: 'th_open', tag: 'th', content: '' },
    { type: 'inline', tag: 'span', content: 'Header 1' },
    { type: 'th_close', tag: 'th', content: '' },
    { type: 'th_open', tag: 'th', content: '' },
    { type: 'inline', tag: 'span', content: 'Status' },
    { type: 'th_close', tag: 'th', content: '' },
    { type: 'tr_close', tag: 'tr', content: '' },
    { type: 'thead_close', tag: 'thead', content: '' },
    { type: 'tbody_open', tag: 'tbody', content: '' },
    { type: 'tr_open', tag: 'tr', content: '' },
    { type: 'td_open', tag: 'td', content: '' },
    { type: 'inline', tag: 'span', content: 'Row 1 Col 1' },
    { type: 'td_close', tag: 'td', content: '' },
    { type: 'td_open', tag: 'td', content: '' },
    { type: 'inline', tag: 'span', content: 'High' },
    { type: 'td_close', tag: 'td', content: '' },
    { type: 'tr_close', tag: 'tr', content: '' },
    { type: 'tbody_close', tag: 'tbody', content: '' },
    { type: 'table_close', tag: 'table', content: '' },
  ];
}

describe('table-data-extractor', () => {
  it('extracts headers and rows from tokens', () => {
    const tokens = makeSimpleTableTokens();
    const { data, endIndex } = extractTableDataFromTokens(tokens, 0);
    expect(endIndex).toBe(tokens.length - 1);
    expect(data.headers).toEqual(['Header 1', 'Status']);
    expect(data.rows).toEqual([['Row 1 Col 1', 'High']]);
    expect(data.columnCount).toBe(2);
  });

  it('generates default headers when none provided', () => {
    const tokens: Token[] = [
      { type: 'table_open', tag: 'table', content: '' },
      { type: 'tbody_open', tag: 'tbody', content: '' },
      { type: 'tr_open', tag: 'tr', content: '' },
      { type: 'td_open', tag: 'td', content: '' },
      { type: 'inline', tag: 'span', content: 'A' },
      { type: 'td_close', tag: 'td', content: '' },
      { type: 'td_open', tag: 'td', content: '' },
      { type: 'inline', tag: 'span', content: 'B' },
      { type: 'td_close', tag: 'td', content: '' },
      { type: 'tr_close', tag: 'tr', content: '' },
      { type: 'tbody_close', tag: 'tbody', content: '' },
      { type: 'table_close', tag: 'table', content: '' },
    ];
    const { data } = extractTableDataFromTokens(tokens, 0);
    expect(data.headers).toEqual(['Column 1', 'Column 2']);
    expect(data.rows).toEqual([['A', 'B']]);
  });

  it('throws if start token is not table_open', () => {
    const tokens: Token[] = [{ type: 'inline', tag: 'span', content: 'x' }];
    expect(() => extractTableDataFromTokens(tokens, 0)).toThrow('Expected table_open token');
  });

  it('converts data to column and row configs', () => {
    const tokens = makeSimpleTableTokens();
    const { data } = extractTableDataFromTokens(tokens, 0);
    const cols = convertToColumnConfig(data);
    const rows = convertToRowData(data);
    expect(cols).toHaveLength(2);
    expect(cols[0]).toMatchObject({ key: 'col_0', label: 'Header 1', priority: 'high' });
    expect(cols[1].type === 'status' || cols[1].type === 'text').toBe(true);
    expect(rows).toEqual([{ col_0: 'Row 1 Col 1', col_1: 'High' }]);
  });
});


