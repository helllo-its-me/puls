import { beforeEach, describe, expect, it, vi } from "vitest";

const createUserWithProfileMock = vi.fn();
const createRefreshSessionMock = vi.fn();
const getUserCredentialsByEmailMock = vi.fn();
const getActiveRefreshSessionByTokenHashMock = vi.fn();
const revokeRefreshSessionMock = vi.fn();

vi.mock("../../apps/api/src/features/auth/auth.repository.js", () => ({
  createRefreshSession: createRefreshSessionMock,
  createUserWithProfile: createUserWithProfileMock,
  getActiveRefreshSessionByTokenHash: getActiveRefreshSessionByTokenHashMock,
  getUserCredentialsByEmail: getUserCredentialsByEmailMock,
  revokeRefreshSession: revokeRefreshSessionMock,
}));

describe("auth service", () => {
  beforeEach(() => {
    process.env.AUTH_TOKEN_SECRET = "unit-test-auth-secret";
    createRefreshSessionMock.mockReset();
    createUserWithProfileMock.mockReset();
    getActiveRefreshSessionByTokenHashMock.mockReset();
    getUserCredentialsByEmailMock.mockReset();
    revokeRefreshSessionMock.mockReset();
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
    expect(result.refreshToken.length).toBeGreaterThan(20);
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
    expect(createRefreshSessionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-created",
      }),
    );
  });

  it("logs in an existing user with a valid password", async () => {
    const { hashPassword } =
      await import("../../apps/api/src/features/auth/auth.password.js");
    const { loginUser } =
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
    expect(result.refreshToken.length).toBeGreaterThan(20);
    expect(createRefreshSessionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-primary",
      }),
    );
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

  it("rotates a valid refresh session", async () => {
    getActiveRefreshSessionByTokenHashMock.mockResolvedValue({
      id: "refresh-session-current",
      userId: "user-primary",
      email: "tanya@example.com",
      expiresAt: new Date("2026-06-06T10:00:00.000Z"),
    });

    const { refreshAuthSession } =
      await import("../../apps/api/src/features/auth/auth.service.js");
    const result = await refreshAuthSession({
      refreshToken: "current-refresh-token",
    });

    expect(result.user).toEqual({
      id: "user-primary",
      email: "tanya@example.com",
    });
    expect(result.accessToken.length).toBeGreaterThan(20);
    expect(result.refreshToken.length).toBeGreaterThan(20);
    const revokedAt = revokeRefreshSessionMock.mock.calls[0]?.[1];

    expect(revokedAt).toBeInstanceOf(Date);
    expect(revokeRefreshSessionMock).toHaveBeenCalledWith("refresh-session-current", revokedAt);
    expect(createRefreshSessionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-primary",
      }),
    );
  });

  it("rejects missing refresh sessions", async () => {
    getActiveRefreshSessionByTokenHashMock.mockResolvedValue(null);

    const { refreshAuthSession } =
      await import("../../apps/api/src/features/auth/auth.service.js");

    await expect(
      refreshAuthSession({
        refreshToken: "missing-refresh-token",
      }),
    ).rejects.toThrow("Invalid or expired refresh session");
  });

  it("revokes a refresh session on logout", async () => {
    getActiveRefreshSessionByTokenHashMock.mockResolvedValue({
      id: "refresh-session-current",
      userId: "user-primary",
      email: "tanya@example.com",
      expiresAt: new Date("2026-06-06T10:00:00.000Z"),
    });

    const { logoutUser } =
      await import("../../apps/api/src/features/auth/auth.service.js");
    await logoutUser({
      refreshToken: "current-refresh-token",
    });

    const revokedAt = revokeRefreshSessionMock.mock.calls[0]?.[1];

    expect(revokedAt).toBeInstanceOf(Date);
    expect(revokeRefreshSessionMock).toHaveBeenCalledWith("refresh-session-current", revokedAt);
  });
});
