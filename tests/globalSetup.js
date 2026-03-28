/**
 * Jest globalSetup — runs once before any test module is imported.
 *
 * ES module static imports are resolved before beforeAll() fires, so
 * environment variables MUST be set here to be visible during module
 * initialization (e.g. JWT_SECRET read at the top of authController.js).
 */
export default async function globalSetup() {
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = "test_super_secret_for_jwt_min16chars";
}
