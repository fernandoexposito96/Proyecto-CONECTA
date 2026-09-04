import { beforeEach, describe, expect, it, vi } from "vitest";

const { registerPasskey, signInWithPasskey } = vi.hoisted(() => ({
  registerPasskey: vi.fn(),
  signInWithPasskey: vi.fn(),
}));

vi.mock("../../src/supabase", () => ({
  supabase: {
    auth: { registerPasskey, signInWithPasskey },
  },
}));

import {
  friendlyAuthError,
  registerConectaPasskey,
  signInWithConectaPasskey,
} from "../../src/auth/passkeys";

describe("passkey authentication", () => {
  beforeEach(() => vi.clearAllMocks());

  it("registers through the official Supabase Auth API", async () => {
    registerPasskey.mockResolvedValue({
      data: { id: "passkey-id", created_at: "2026-09-04T00:00:00Z" },
      error: null,
    });

    await expect(registerConectaPasskey()).resolves.toBe("passkey-id");
    expect(registerPasskey).toHaveBeenCalledOnce();
  });

  it("requires a valid session after passkey sign-in", async () => {
    signInWithPasskey.mockResolvedValue({ data: { session: null, user: null }, error: null });

    await expect(signInWithConectaPasskey()).rejects.toThrow("sesión válida");
  });

  it("turns authentication errors into useful Spanish feedback", () => {
    expect(friendlyAuthError(new Error("Invalid login credentials"))).toBe(
      "El correo o la contraseña no son correctos.",
    );
  });
});
