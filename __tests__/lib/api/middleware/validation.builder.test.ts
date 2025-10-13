import { NextRequest } from 'next/server';
import type { NextResponse as NextResponseType } from 'next/server';
import type { ApiResponse } from '@/lib/api/api-response';

const {
  createValidationErrorResponse: actualCreateValidationErrorResponse,
  createSuccessResponse,
} = jest.requireActual<typeof import('@/lib/api/api-response')>('@/lib/api/api-response');

function buildRequest(method: string, url: string, headers: Record<string, string> = {}): NextRequest {
  return {
    method,
    url,
    headers: new Headers(headers),
    json: jest.fn(),
  } as unknown as NextRequest;
}
import { z } from 'zod';
import { buildValidation } from '@/lib/api/middleware/builders/validation';

describe('validation builder', () => {
  const schema = z.object({ foo: z.string() });
  const context = { requestId: 'rid-val', url: '/test', userInfo: { userId: 'u1' } } as any;
  const baseParams = Promise.resolve({} as Record<string, string>);

  const validateRequest = jest.fn((_schema, data) => ({ success: true, data } as any));
  const createValidationErrorResponse = jest.fn(actualCreateValidationErrorResponse);
  const logger = { validationError: jest.fn() };

  let capturedWithAuth:
    | ((request: NextRequest, ctx: typeof context, params: Promise<Record<string, string>>) => Promise<NextResponseType<ApiResponse>>)
    | undefined;

  type ValidationDeps = Parameters<typeof buildValidation>[0];

  function makeDeps(overrides: Partial<ValidationDeps> = {}): ValidationDeps {
    const withAuth = jest.fn((handler) => {
      capturedWithAuth = handler;
      return async (request: NextRequest, routeParams: { params: Promise<Record<string, string>> }) => {
        return handler(request, context, routeParams?.params ?? baseParams);
      };
    });

    return {
      withAuth: withAuth as ValidationDeps['withAuth'],
      validateRequest: validateRequest as ValidationDeps['validateRequest'],
      createValidationErrorResponse: createValidationErrorResponse as ValidationDeps['createValidationErrorResponse'],
      logger,
      ...overrides,
    } satisfies ValidationDeps;
  }

  beforeEach(() => {
    validateRequest.mockReset();
    validateRequest.mockImplementation((_schema, data) => ({ success: true, data }));
    createValidationErrorResponse.mockReset();
    createValidationErrorResponse.mockImplementation(actualCreateValidationErrorResponse);
    logger.validationError.mockReset();
    capturedWithAuth = undefined;
  });

  it('returns validation error when JSON body parsing fails', async () => {
    const deps = makeDeps();
    const { withValidation } = buildValidation(deps);
    const handler = jest.fn();
    const wrapped = withValidation(schema, handler);
    expect(typeof wrapped).toBe('function');
    expect(capturedWithAuth).toBeDefined();

    const req = buildRequest('POST', 'http://localhost/api');
    (req as any).json = jest.fn(async () => { throw new Error('bad json'); });

    const res = await capturedWithAuth!(req, context, baseParams);

    expect(res.status).toBe(400);
    expect(createValidationErrorResponse).toHaveBeenCalledWith('Invalid JSON format in request body', 'rid-val');
    expect(logger.validationError).toHaveBeenCalledWith('/test', 'Invalid JSON in request body', context);
    expect(handler).not.toHaveBeenCalled();
    expect(validateRequest).not.toHaveBeenCalled();
  });

  it('returns validation error when schema validation fails', async () => {
    validateRequest.mockReturnValueOnce({ success: false, error: 'bad data' } as any);
    const deps = makeDeps();
    const { withValidation } = buildValidation(deps);
    const handler = jest.fn();
    const wrapped = withValidation(schema, handler);
    expect(typeof wrapped).toBe('function');
    expect(capturedWithAuth).toBeDefined();

    const req = buildRequest('POST', 'http://localhost/api');
    (req as any).json = jest.fn(async () => ({ foo: 'invalid' }));

    const res = await capturedWithAuth!(req, context, baseParams);

    expect(res.status).toBe(400);
    expect(createValidationErrorResponse).toHaveBeenCalledWith('bad data', 'rid-val');
    expect(logger.validationError).toHaveBeenCalledWith('/test', 'bad data', context);
    expect(handler).not.toHaveBeenCalled();
  });

  it('passes query parameters for safe methods and invokes handler', async () => {
    const deps = makeDeps();
    const { withValidation } = buildValidation(deps);
    const handler = jest.fn(async (_req, _ctx, data) =>
      createSuccessResponse({ ok: data.foo }, { requestId: context.requestId })
    );
    const wrapped = withValidation(schema, handler);
    expect(typeof wrapped).toBe('function');

    const req = buildRequest('GET', 'http://localhost/api?foo=bar');

    expect(capturedWithAuth).toBeDefined();
    const res = await capturedWithAuth!(req, context, baseParams);

    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', url: 'http://localhost/api?foo=bar' }),
      context,
      { foo: 'bar' },
      baseParams
    );
    expect(validateRequest).toHaveBeenCalled();
    const lastCall = validateRequest.mock.calls[validateRequest.mock.calls.length - 1] as unknown as [unknown, unknown];
    expect(lastCall[0]).toBe(schema);
    expect(lastCall[1]).toEqual({ foo: 'bar' });
  });

  it('returns error when building request data throws', async () => {
    const deps = makeDeps();
    const { withValidation } = buildValidation(deps);
    const handler = jest.fn();
    const wrapped = withValidation(schema, handler);
    expect(typeof wrapped).toBe('function');

    const badRequest = { method: 'GET', url: '::bad-url' } as unknown as NextRequest;

    expect(capturedWithAuth).toBeDefined();
    const res = await capturedWithAuth!(badRequest, context, baseParams);

    expect(res.status).toBe(400);
    expect(createValidationErrorResponse).toHaveBeenCalledWith('Invalid request data', 'rid-val');
    expect(logger.validationError).toHaveBeenCalledWith('/test', 'Invalid request data', context);
    expect(handler).not.toHaveBeenCalled();
    expect(validateRequest).not.toHaveBeenCalled();
  });

  it('withValidationAndParams resolves params before invoking handler', async () => {
    const deps = makeDeps();
    const { withValidationAndParams } = buildValidation(deps);
    const handler = jest.fn(async (_req, _ctx, data, params) =>
      createSuccessResponse({ ok: data.foo, params }, { requestId: context.requestId })
    );
    const wrapped = withValidationAndParams(schema, handler);

    const req = buildRequest('GET', 'http://localhost/api?foo=bar');
    const paramsPromise = Promise.resolve({ id: '123' });

    const res = await wrapped(req, { params: paramsPromise } as any);

    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', url: 'http://localhost/api?foo=bar' }),
      context,
      { foo: 'bar' },
      { id: '123' }
    );
  });
});
