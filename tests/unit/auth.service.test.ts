import { beforeEach, describe, expect, it, vi } from "vitest";

const createUserWithProfileMock = vi.fn();
const getUserCredentialsByEmailMock = vi.fn();

vi.mock("../../apps/api/src/features/auth/auth.repository.js", () => ({
  createUserWithProfile: createUserWithProfileMock,
  getUserCredentialsByEmail: getUserCredentialsByEmailMock,
}));

describe("auth service", () => {
  beforeEach(() => {
    process.env.AUTH_TOKEN_SECRET = "unit-test-auth-secret";
    createUserWithProfileMock.mockReset();
    getUserCredentialsByEmailMock.mockReset();
  });

  it("registers a user with a profile and returns a bearer token payload", async () => {
    createUserWithProfileMock.mockResolvedValue({
      id: "user-created",
      email: "new@example.com",
    });

    const { registerUser } =
      await import("../../apps/api/src/features/auth/auth.service.js");
    const result = await registerUser({
      email: "new@example.com",
      password: "strong-password",
      firstName: "New",
      lastName: "Member",
    });

    expect(result.user).toEqual({
      id: "user-created",
      email: "new@example.com",
    });
    expect(result.accessToken.length).toBeGreaterThan(20);
    expect(createUserWithProfileMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "new@example.com",
        firstName: "New",
        lastName: "Member",
      }),
    );
    expect(createUserWithProfileMock.mock.calls[0]?.[0]?.passwordHash).not.toBe(
      "strong-password",
    );
  });

  it("logs in an existing user with a valid password", async () => {
    const { hashPassword, loginUser } =
      await import("../../apps/api/src/features/auth/auth.service.js");
    const passwordHash = await hashPassword("strong-password");

    getUserCredentialsByEmailMock.mockResolvedValue({
      id: "user-primary",
      email: "tanya@example.com",
      passwordHash,
    });

    const result = await loginUser({
      email: "tanya@example.com",
      password: "strong-password",
    });

    expect(result.user).toEqual({
      id: "user-primary",
      email: "tanya@example.com",
    });
    expect(result.accessToken.length).toBeGreaterThan(20);
  });

  it("rejects login when credentials are invalid", async () => {
    getUserCredentialsByEmailMock.mockResolvedValue(null);

    const { loginUser } =
      await import("../../apps/api/src/features/auth/auth.service.js");

    await expect(
      loginUser({
        email: "missing@example.com",
        password: "strong-password",
      }),
    ).rejects.toThrow("Invalid email or password");
  });
});
