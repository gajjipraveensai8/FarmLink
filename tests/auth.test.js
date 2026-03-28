import request from "supertest";
import app from "../src/app.js";
import User from "../src/models/User.js";

describe("GET /api/health", () => {
  it("should return 200 with status ok", async () => {
    const res = await request(app).get("/api/health");

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("ok");
  });
});

describe("Authentication API", () => {
  const testUser = {
    name: "Test User",
    email: "test@example.com",
    phone: "1234567890",
    password: "Password123!",
    role: "buyer",
  };

  describe("POST /api/auth/register", () => {
    it("should successfully register a new user and return httpOnly cookie", async () => {
      const res = await request(app).post("/api/auth/register").send(testUser);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.user.password).toBeUndefined();

      const cookies = res.headers["set-cookie"];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toMatch(/token=.*HttpOnly/i);
    });

    it("should reject registration with an existing email", async () => {
      // Manually seed user with hashed password to simulate existing record
      await request(app).post("/api/auth/register").send(testUser);

      const res = await request(app).post("/api/auth/register").send(testUser);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already exists/i);
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      // Register a fresh user before each login test
      await request(app).post("/api/auth/register").send(testUser);
    });

    it("should login successfully and return httpOnly cookie", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: testUser.email,
        password: testUser.password,
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const cookies = res.headers["set-cookie"];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toMatch(/token=/);
    });

    it("should reject invalid credentials with 401", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: testUser.email,
        password: "wrong_password",
      });

      // authController throws AppError("Invalid credentials", 401)
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
