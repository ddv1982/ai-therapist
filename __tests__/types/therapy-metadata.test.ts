import {
  obsessionEntrySchema,
  compulsionEntrySchema,
  obsessionsCompulsionsMetadataSchema,
} from '@/types/therapy-metadata';

describe('obsessionEntrySchema', () => {
  const validObsession = {
    id: 'obs-123',
    obsession: 'Intrusive thought about safety',
    intensity: 7,
    triggers: ['stress', 'uncertainty'],
    createdAt: '2026-01-13T12:00:00.000Z',
  };

  it('validates correct obsession data', () => {
    expect(() => obsessionEntrySchema.parse(validObsession)).not.toThrow();
  });

  it('accepts empty triggers array', () => {
    const withEmptyTriggers = { ...validObsession, triggers: [] };
    expect(() => obsessionEntrySchema.parse(withEmptyTriggers)).not.toThrow();
  });

  it('rejects missing required fields', () => {
    const missingId = { ...validObsession, id: undefined };
    expect(() => obsessionEntrySchema.parse(missingId)).toThrow();

    const missingObsession = { ...validObsession, obsession: undefined };
    expect(() => obsessionEntrySchema.parse(missingObsession)).toThrow();

    const missingIntensity = { ...validObsession, intensity: undefined };
    expect(() => obsessionEntrySchema.parse(missingIntensity)).toThrow();
  });

  it('rejects invalid intensity type', () => {
    const stringIntensity = { ...validObsession, intensity: 'high' };
    expect(() => obsessionEntrySchema.parse(stringIntensity)).toThrow();
  });
});

describe('compulsionEntrySchema', () => {
  const validCompulsion = {
    id: 'comp-456',
    compulsion: 'Checking behavior',
    frequency: 5,
    duration: 10,
    reliefLevel: 3,
    createdAt: '2026-01-13T12:00:00.000Z',
  };

  it('validates correct compulsion data', () => {
    expect(() => compulsionEntrySchema.parse(validCompulsion)).not.toThrow();
  });

  it('accepts zero values for numeric fields', () => {
    const withZeros = { ...validCompulsion, frequency: 0, duration: 0, reliefLevel: 0 };
    expect(() => compulsionEntrySchema.parse(withZeros)).not.toThrow();
  });

  it('rejects missing required fields', () => {
    const missingId = { ...validCompulsion, id: undefined };
    expect(() => compulsionEntrySchema.parse(missingId)).toThrow();

    const missingCompulsion = { ...validCompulsion, compulsion: undefined };
    expect(() => compulsionEntrySchema.parse(missingCompulsion)).toThrow();

    const missingFrequency = { ...validCompulsion, frequency: undefined };
    expect(() => compulsionEntrySchema.parse(missingFrequency)).toThrow();
  });

  it('rejects string frequency (old schema format)', () => {
    const oldFormat = { ...validCompulsion, frequency: 'daily' };
    expect(() => compulsionEntrySchema.parse(oldFormat)).toThrow();
  });

  it('rejects old schema field names', () => {
    const oldSchemaData = {
      behavior: 'Checking behavior',
      frequency: 'daily',
      reduction: 'moderate',
    };
    expect(() => compulsionEntrySchema.parse(oldSchemaData)).toThrow();
  });
});

describe('obsessionsCompulsionsMetadataSchema', () => {
  const validMetadata = {
    obsessions: [
      {
        id: 'obs-1',
        obsession: 'Test obsession',
        intensity: 5,
        triggers: ['trigger1'],
        createdAt: '2026-01-13T12:00:00.000Z',
      },
    ],
    compulsions: [
      {
        id: 'comp-1',
        compulsion: 'Test compulsion',
        frequency: 3,
        duration: 5,
        reliefLevel: 4,
        createdAt: '2026-01-13T12:00:00.000Z',
      },
    ],
    lastModified: '2026-01-13T12:00:00.000Z',
  };

  it('validates correct metadata structure', () => {
    expect(() => obsessionsCompulsionsMetadataSchema.parse(validMetadata)).not.toThrow();
  });

  it('accepts empty arrays', () => {
    const emptyData = {
      obsessions: [],
      compulsions: [],
      lastModified: '2026-01-13T12:00:00.000Z',
    };
    expect(() => obsessionsCompulsionsMetadataSchema.parse(emptyData)).not.toThrow();
  });

  it('rejects missing lastModified', () => {
    const missingLastModified = {
      obsessions: [],
      compulsions: [],
    };
    expect(() => obsessionsCompulsionsMetadataSchema.parse(missingLastModified)).toThrow();
  });
});
