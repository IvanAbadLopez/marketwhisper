import { describe, it, expect } from "vitest";
import bcrypt from "bcrypt";

describe("Password Hashing", () => {
  it("should hash password correctly", async () => {
    const password = "testpassword123";
    const hashedPassword = await bcrypt.hash(password, 12);

    expect(hashedPassword).toBeDefined();
    expect(hashedPassword).not.toBe(password);
    expect(hashedPassword.length).toBeGreaterThan(0);
  });

  it("should verify correct password", async () => {
    const password = "testpassword123";
    const hashedPassword = await bcrypt.hash(password, 12);

    const isValid = await bcrypt.compare(password, hashedPassword);
    expect(isValid).toBe(true);
  });

  it("should reject incorrect password", async () => {
    const password = "testpassword123";
    const wrongPassword = "wrongpassword";
    const hashedPassword = await bcrypt.hash(password, 12);

    const isValid = await bcrypt.compare(wrongPassword, hashedPassword);
    expect(isValid).toBe(false);
  });
});

describe("Email Validation", () => {
  it("should validate correct email format", () => {
    const validEmails = [
      "test@example.com",
      "user.name@example.co.uk",
      "user+tag@example.com",
    ];

    validEmails.forEach((email) => {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(regex.test(email)).toBe(true);
    });
  });

  it("should reject invalid email format", () => {
    const invalidEmails = [
      "notanemail",
      "@example.com",
      "user@",
      "user @example.com",
    ];

    invalidEmails.forEach((email) => {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(regex.test(email)).toBe(false);
    });
  });
});

describe("Password Requirements", () => {
  it("should require minimum 8 characters", () => {
    const shortPassword = "short1";
    const validPassword = "validpass123";

    expect(shortPassword.length >= 8).toBe(false);
    expect(validPassword.length >= 8).toBe(true);
  });

  it("should validate password strength", () => {
    const weakPassword = "password"; // Only letters
    const strongPassword = "SecurePass123!";

    // Basic strength check: has letters and numbers
    const hasLetters = (pwd: string) => /[a-zA-Z]/.test(pwd);
    const hasNumbers = (pwd: string) => /[0-9]/.test(pwd);

    expect(hasLetters(weakPassword)).toBe(true);
    expect(hasNumbers(weakPassword)).toBe(false);
    expect(hasLetters(strongPassword) && hasNumbers(strongPassword)).toBe(true);
  });
});
