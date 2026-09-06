import { describe, expect, it } from "vitest";
import { validateRecoveryPasswords } from "../../src/components/PasswordRecoveryGate";

describe("password recovery validation", () => {
  it("rejects passwords shorter than 8 characters", () => {
    expect(validateRecoveryPasswords("1234567", "1234567")).toBe("La contraseña debe tener al menos 8 caracteres.");
  });

  it("rejects passwords that do not match", () => {
    expect(validateRecoveryPasswords("segura123", "segura124")).toBe("Las contraseñas no coinciden.");
  });

  it("accepts matching passwords with at least 8 characters", () => {
    expect(validateRecoveryPasswords("segura123", "segura123")).toBe("");
  });
});
