import { deriveMessageMetadata } from '@/lib/chat/message-domain-parsers';
import { isObsessionsCompulsionsMessage } from '@/features/therapy/obsessions-compulsions/utils/obsessions-message-detector';
import { parseObsessionsCompulsionsFromMarkdown } from '@/features/therapy/obsessions-compulsions/utils/format-obsessions-compulsions';

// Mock the dependencies
jest.mock('@/features/therapy/obsessions-compulsions/utils/obsessions-message-detector', () => ({
  isObsessionsCompulsionsMessage: jest.fn(),
}));

jest.mock('@/features/therapy/obsessions-compulsions/utils/format-obsessions-compulsions', () => ({
  parseObsessionsCompulsionsFromMarkdown: jest.fn(),
}));

describe('message-domain-parsers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('deriveMessageMetadata', () => {
    it('should return undefined if content is empty', () => {
      expect(deriveMessageMetadata('')).toBeUndefined();
    });

    it('should return undefined if content is not an obsessions/compulsions message', () => {
      (isObsessionsCompulsionsMessage as jest.Mock).mockReturnValue(false);

      const result = deriveMessageMetadata('Some random chat message');

      expect(isObsessionsCompulsionsMessage).toHaveBeenCalledWith('Some random chat message');
      expect(result).toBeUndefined();
    });

    it('should return metadata with parsed data when content is an obsessions/compulsions message', () => {
      (isObsessionsCompulsionsMessage as jest.Mock).mockReturnValue(true);
      const mockData = {
        obsessions: [{ id: '1', description: 'obs1' }],
        compulsions: [{ id: '2', description: 'comp1' }],
        lastModified: '2023-01-01T00:00:00.000Z',
      };
      (parseObsessionsCompulsionsFromMarkdown as jest.Mock).mockReturnValue(mockData);

      const content = '# Obsessions & Compulsions Tracker\n...';
      const result = deriveMessageMetadata(content);

      expect(isObsessionsCompulsionsMessage).toHaveBeenCalledWith(content);
      expect(parseObsessionsCompulsionsFromMarkdown).toHaveBeenCalledWith(content);
      expect(result).toEqual({
        type: 'obsessions-compulsions-table',
        step: 'obsessions-compulsions',
        data: mockData,
      });
    });

    it('should return metadata with default data when parsing fails (returns null)', () => {
      (isObsessionsCompulsionsMessage as jest.Mock).mockReturnValue(true);
      (parseObsessionsCompulsionsFromMarkdown as jest.Mock).mockReturnValue(null);

      const content = '# Obsessions & Compulsions Tracker\n...';
      const result = deriveMessageMetadata(content);

      expect(result).toEqual({
        type: 'obsessions-compulsions-table',
        step: 'obsessions-compulsions',
        data: {
          obsessions: [],
          compulsions: [],
          lastModified: expect.any(String), // Should be current date ISO string
        },
      });
    });
  });
});
