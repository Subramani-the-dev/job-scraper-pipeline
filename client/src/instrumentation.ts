export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateEnv } = await import('./helpers/env.helper');
    validateEnv(process.env);
  }
}
