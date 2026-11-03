const url = process.env.TEST_DATABASE_URL ?? `postgresql://${process.env.USER ?? 'postgres'}@localhost/job_pipeline_test`;
if (!/test/i.test(new URL(url).pathname)) {
  throw new Error('Refusing to run tests against a database whose name does not contain "test"');
}
process.env.DATABASE_URL = url;
process.env.DIRECT_URL = url;
