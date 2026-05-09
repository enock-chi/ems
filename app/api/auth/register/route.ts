import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "").replace(/\/$/, "");

export async function POST(req: NextRequest) {
  try {
    const {
      role, firstname, lastname, email, contact, idNumber, password,
    } = await req.json() as {
      role: "hr" | "applicant";
      firstname: string;
      lastname: string;
      email: string;
      contact: string;
      idNumber: string;
      password: string;
    };

    if (!role || !firstname || !lastname || !email || !password) {
      return NextResponse.json({ error: "All required fields must be provided." }, { status: 400 });
    }

    const backendRes = await fetch(`${BACKEND_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify({
        firstname: firstname.trim(),
        lastname: lastname.trim(),
        email: email.toLowerCase().trim(),
        password,
        contact: contact?.trim() ?? "",
        empid: role === "hr" ? (idNumber ?? "").trim() : null,
        identification: role === "applicant" ? (idNumber ?? "").trim() : null,
        is_hr: role === "hr",
        is_applicant: role === "applicant",
      }),
    });

    const data = await backendRes.json() as {
      error?: string;
      id?: number;
      firstname?: string;
      lastname?: string;
      email?: string;
      identification?: string | null;
    };

    if (!backendRes.ok) {
      return NextResponse.json(
        { error: data.error ?? "Registration failed." },
        { status: backendRes.status },
      );
    }

    return NextResponse.json({
      id: String(data.id),
      name: `${data.firstname} ${data.lastname}`,
      email: data.email,
      role,
      identification: role === "applicant" ? (idNumber ?? "").trim() : undefined,
    });
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
