import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "").replace(/\/$/, "");

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json() as { email: string; password: string };

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const backendRes = await fetch(`${BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
    });

    const data = await backendRes.json() as {
      error?: string;
      id?: number;
      firstname?: string;
      lastname?: string;
      email?: string;
      is_hr?: boolean;
      is_applicant?: boolean;
      identification?: string | null;
    };

    if (!backendRes.ok) {
      return NextResponse.json(
        { error: data.error ?? "Invalid email or password." },
        { status: backendRes.status },
      );
    }

    const role = data.is_hr ? "hr" : "applicant";

    return NextResponse.json({
      id: String(data.id),
      name: `${data.firstname} ${data.lastname}`,
      email: data.email,
      role,
      identification: data.identification ?? "",
    });
  } catch (err) {
    console.error("[login]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
