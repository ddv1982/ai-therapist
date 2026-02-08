import type { ApiResponse } from '@/lib/api/api-response';
import type { ApiClient } from '@/lib/api/client';
import type { paths } from '@/types/api.generated';
import type {
  Session,
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

type ResumeSessionPost200 =
  paths['/sessions/{sessionId}/resume']['post']['responses'][200]['content']['application/json'];
type ExpectedResumeSessionPost200 = {
  success?: boolean;
  data?: Session;
};
export type ResumeSessionPost200Assignable = Assert<
  IsAssignable<ResumeSessionPost200, ExpectedResumeSessionPost200>
>;
export type ResumeSessionPost200ReverseAssignable = Assert<
  IsAssignable<ExpectedResumeSessionPost200, ResumeSessionPost200>
>;

type ClientResumeSessionReturn = Awaited<ReturnType<ApiClient['resumeSession']>>;
export type ClientResumeSessionMatches = Assert<
  IsAssignable<ClientResumeSessionReturn, ApiResponse<Session>>
>;
export type ClientResumeSessionMatchesReverse = Assert<
  IsAssignable<ApiResponse<Session>, ClientResumeSessionReturn>
>;

type ReportGenerationResponseSchema = {
  reportContent?: string;
  modelUsed?: string;
  modelDisplayName?: string;
  cbtDataSource?: string;
  cbtDataAvailable?: boolean;
};
type ReportGenerationResponse = {
  reportContent: string;
  modelUsed: string;
  modelDisplayName: string;
  cbtDataSource: string;
  cbtDataAvailable: boolean;
};

type ReportsGeneratePost200 =
  paths['/reports/generate']['post']['responses'][200]['content']['application/json'];
type ExpectedReportsGeneratePost200 = {
  success?: boolean;
  data?: ReportGenerationResponseSchema;
};
export type ReportsGeneratePost200Assignable = Assert<
  IsAssignable<ReportsGeneratePost200, ExpectedReportsGeneratePost200>
>;
export type ReportsGeneratePost200ReverseAssignable = Assert<
  IsAssignable<ExpectedReportsGeneratePost200, ReportsGeneratePost200>
>;

type ReportsGenerateContextPost200 =
  paths['/reports/generate-context']['post']['responses'][200]['content']['application/json'];
type ExpectedReportsGenerateContextPost200 = {
  success?: boolean;
  data?: ReportGenerationResponseSchema;
};
export type ReportsGenerateContextPost200Assignable = Assert<
  IsAssignable<ReportsGenerateContextPost200, ExpectedReportsGenerateContextPost200>
>;
export type ReportsGenerateContextPost200ReverseAssignable = Assert<
  IsAssignable<ExpectedReportsGenerateContextPost200, ReportsGenerateContextPost200>
>;

type ClientGenerateReportDetailedReturn = Awaited<ReturnType<ApiClient['generateReportDetailed']>>;
export type ClientGenerateReportDetailedMatches = Assert<
  IsAssignable<ClientGenerateReportDetailedReturn, ApiResponse<ReportGenerationResponse>>
>;
export type ClientGenerateReportDetailedMatchesReverse = Assert<
  IsAssignable<ApiResponse<ReportGenerationResponse>, ClientGenerateReportDetailedReturn>
>;

type ClientGenerateReportFromContextReturn = Awaited<
  ReturnType<ApiClient['generateReportFromContext']>
>;
export type ClientGenerateReportFromContextMatches = Assert<
  IsAssignable<ClientGenerateReportFromContextReturn, ApiResponse<ReportGenerationResponse>>
>;
export type ClientGenerateReportFromContextMatchesReverse = Assert<
  IsAssignable<ApiResponse<ReportGenerationResponse>, ClientGenerateReportFromContextReturn>
>;
