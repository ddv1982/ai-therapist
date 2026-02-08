import type { ApiResponse } from '@/lib/api/api-response';
import type { ApiClient } from '@/lib/api/client';
import type { paths } from '@/types/api.generated';
import type {
  SessionListResponse,
  MemoryData,
  MemoryManageData,
  DeleteResponseData,
} from '@/types';

type Assert<T extends true> = T;
type IsAssignable<From, To> = [From] extends [To] ? true : false;

type SessionsGet200 = paths['/sessions']['get']['responses'][200]['content']['application/json'];
type ExpectedSessionsGet200 = {
  success?: boolean;
  data?: SessionListResponse;
};
export type SessionsGet200Assignable = Assert<IsAssignable<SessionsGet200, ExpectedSessionsGet200>>;
export type SessionsGet200ReverseAssignable = Assert<
  IsAssignable<ExpectedSessionsGet200, SessionsGet200>
>;

type MemoryGet200 =
  paths['/reports/memory']['get']['responses'][200]['content']['application/json'];
type ExpectedMemoryGet200 = {
  success?: boolean;
  data?: MemoryData | MemoryManageData;
};
export type MemoryGet200Assignable = Assert<IsAssignable<MemoryGet200, ExpectedMemoryGet200>>;
export type MemoryGet200ReverseAssignable = Assert<
  IsAssignable<ExpectedMemoryGet200, MemoryGet200>
>;

type MemoryDelete200 =
  paths['/reports/memory']['delete']['responses'][200]['content']['application/json'];
type ExpectedMemoryDelete200 = {
  success?: boolean;
  data?: DeleteResponseData;
};
export type MemoryDelete200Assignable = Assert<
  IsAssignable<MemoryDelete200, ExpectedMemoryDelete200>
>;
export type MemoryDelete200ReverseAssignable = Assert<
  IsAssignable<ExpectedMemoryDelete200, MemoryDelete200>
>;

type ClientListSessionsReturn = Awaited<ReturnType<ApiClient['listSessions']>>;
export type ClientListSessionsMatches = Assert<
  IsAssignable<ClientListSessionsReturn, ApiResponse<SessionListResponse>>
>;
export type ClientListSessionsMatchesReverse = Assert<
  IsAssignable<ApiResponse<SessionListResponse>, ClientListSessionsReturn>
>;

type ClientGetMemoryReportsReturn = Awaited<ReturnType<ApiClient['getMemoryReports']>>;
export type ClientGetMemoryReportsMatches = Assert<
  IsAssignable<ClientGetMemoryReportsReturn, ApiResponse<MemoryData | MemoryManageData>>
>;
export type ClientGetMemoryReportsMatchesReverse = Assert<
  IsAssignable<ApiResponse<MemoryData | MemoryManageData>, ClientGetMemoryReportsReturn>
>;

type ClientDeleteMemoryReportsReturn = Awaited<ReturnType<ApiClient['deleteMemoryReports']>>;
export type ClientDeleteMemoryReportsMatches = Assert<
  IsAssignable<ClientDeleteMemoryReportsReturn, ApiResponse<DeleteResponseData>>
>;
export type ClientDeleteMemoryReportsMatchesReverse = Assert<
  IsAssignable<ApiResponse<DeleteResponseData>, ClientDeleteMemoryReportsReturn>
>;
