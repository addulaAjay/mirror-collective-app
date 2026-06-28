/**
 * Regression: the API layer had a circular import — auth.ts extends
 * BaseApiService (base.ts), base.ts imports tokenManager, and tokenManager
 * imported the api barrel back into auth.ts. When base.ts loaded first, auth's
 * `class AuthApiService extends BaseApiService` evaluated before BaseApiService
 * was exported → "Super expression must either be null or a function".
 *
 * tokenManager now imports authApiService lazily, breaking the load-time edge.
 * This test loads base.ts first (the order that used to crash) and asserts the
 * auth module still resolves AuthApiService.
 */
describe('API layer circular import', () => {
  it('resolves AuthApiService when base.ts is loaded before auth.ts', () => {
    jest.isolateModules(() => {
      jest.requireActual('@services/api/base');
      const auth = jest.requireActual('@services/api/auth') as {
        AuthApiService?: unknown;
      };
      expect(auth.AuthApiService).toBeDefined();
      expect(typeof auth.AuthApiService).toBe('function');
    });
  });
});
