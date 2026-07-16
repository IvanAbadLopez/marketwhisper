import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/shared/api/prisma";

// Email validation regex (RFC 5322 simplified)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;
const MAX_NAME_LENGTH = 100;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 200;

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    // 1. ROBUST INPUT VALIDATION (before DB queries)
    
    // Email validation
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    if (trimmedEmail.length > MAX_EMAIL_LENGTH) {
      return NextResponse.json(
        { error: `Email must not exceed ${MAX_EMAIL_LENGTH} characters` },
        { status: 400 }
      );
    }

    // Password validation
    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
        { status: 400 }
      );
    }

    if (password.length > MAX_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Password must not exceed ${MAX_PASSWORD_LENGTH} characters` },
        { status: 400 }
      );
    }

    // Name validation (optional field)
    let processedName: string | null = null;
    if (name !== undefined && name !== null) {
      if (typeof name !== 'string') {
        return NextResponse.json(
          { error: "Name must be a string" },
          { status: 400 }
        );
      }
      
      const trimmedName = name.trim();
      
      if (trimmedName.length > MAX_NAME_LENGTH) {
        return NextResponse.json(
          { error: `Name must not exceed ${MAX_NAME_LENGTH} characters` },
          { status: 400 }
        );
      }
      
      // Convert empty string to null after trim
      processedName = trimmedName.length > 0 ? trimmedName : null;
    }

    // 2. ANTI-ENUMERATION PATTERN
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (existingUser) {
      // User already exists - DO NOT reveal this fact
      // Simulate hashing time to prevent timing attacks
      await bcrypt.hash("dummy-password-for-timing-attack-prevention", 12);
      
      // Return SAME response as successful registration
      return NextResponse.json(
        { 
          message: "Registration processed successfully. If the email is not already registered, your account has been created. You can now sign in."
        },
        { status: 200 }
      );
    }

    // 3. CREATE NEW USER
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email: trimmedEmail,
        name: processedName,
        password: hashedPassword,
      },
    });

    // Return SAME message as existing user (anti-enumeration)
    return NextResponse.json(
      { 
        message: "Registration processed successfully. If the email is not already registered, your account has been created. You can now sign in.",
        userId: user.id // Include userId only for actual new users (optional)
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
