import type {
  SessionsGet200Assignable,
  SessionsGet200ReverseAssignable,
  MemoryGet200Assignable,
  MemoryGet200ReverseAssignable,
  MemoryDelete200Assignable,
  MemoryDelete200ReverseAssignable,
  ClientListSessionsMatches,
  ClientListSessionsMatchesReverse,
  ClientGetMemoryReportsMatches,
  ClientGetMemoryReportsMatchesReverse,
  ClientDeleteMemoryReportsMatches,
  ClientDeleteMemoryReportsMatchesReverse,
} from '@/types/openapi-client-contract-assertions';
import type {
  SessionListPagination,
  MemoryStats,
  MemoryManagementStats,
  MemoryDeleteType,
} from '@/types';

describe('OpenAPI client contract assertions', () => {
  it('compiles type-level contract assertions', () => {
    // Compile-time only: these aliases ensure the assertion exports are referenced in test code.
    type TypeAssertions =
      | SessionsGet200Assignable
      | SessionsGet200ReverseAssignable
      | MemoryGet200Assignable
      | MemoryGet200ReverseAssignable
      | MemoryDelete200Assignable
      | MemoryDelete200ReverseAssignable
      | ClientListSessionsMatches
      | ClientListSessionsMatchesReverse
      | ClientGetMemoryReportsMatches
      | ClientGetMemoryReportsMatchesReverse
      | ClientDeleteMemoryReportsMatches
      | ClientDeleteMemoryReportsMatchesReverse;

    type ExportedDomainTypes =
      | SessionListPagination
      | MemoryStats
      | MemoryManagementStats
      | MemoryDeleteType;

    const compileMarker: TypeAssertions | ExportedDomainTypes | null = null;
    expect(compileMarker).toBeNull();
  });
});
