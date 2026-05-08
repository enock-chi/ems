import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { GraphQLClient } from "graphql-request";
import { GET_AUTH_BY_EMAIL } from "@/lib/queries";

interface AuthRecord {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  passwordHash: string;
  identification: string;
  hr: boolean;
  applicant: boolean;
}

const hygraph = new GraphQLClient(process.env.NEXT_PUBLIC_HYGRAPH_ENDPOINT ?? "", {
  headers: {
    Authorization: `Bearer ${process.env.NEXT_PUBLIC_HYGRAPH_TOKEN ?? ""}`,
  },
});

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json() as { email: string; password: string };

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const { auths } = await hygraph.request<{ auths: AuthRecord[] }>(GET_AUTH_BY_EMAIL, {
      email: email.toLowerCase().trim(),
    });

    const auth = auths[0] ?? null;
    if (!auth) {
      return NextResponse.json({ error: "No account found with that email address." }, { status: 401 });
    }

    // Try bcrypt first, fall back to plain-text for accounts set directly in Hygraph
    let valid = false;
    try {
      valid = await compare(password, auth.passwordHash);
    } catch {
      valid = false;
    }
    if (!valid) {
      valid = password === auth.passwordHash;
    }

    if (!valid) {
      return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
    }

    const role = auth.hr ? "hr" : "applicant";
    return NextResponse.json({
      id: auth.id,
      name: `${auth.firstname} ${auth.lastname}`,
      email: auth.email,
      role,
      identification: auth.identification ?? "",
    });
  } catch (err) {
    console.error("[login]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
