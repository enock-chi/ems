import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { GraphQLClient } from "graphql-request";
import { GET_AUTH_BY_EMAIL, CREATE_AUTH, PUBLISH_AUTH } from "@/lib/queries";

interface AuthRecord { id: string }
interface CreateAuthResult {
  createAuth: { id: string; firstname: string; lastname: string; email: string };
}

const hygraph = new GraphQLClient(process.env.NEXT_PUBLIC_HYGRAPH_ENDPOINT ?? "", {
  headers: {
    Authorization: `Bearer ${process.env.NEXT_PUBLIC_HYGRAPH_TOKEN ?? ""}`,
  },
});

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

    const normalizedEmail = email.toLowerCase().trim();

    const { auths } = await hygraph.request<{ auths: AuthRecord[] }>(GET_AUTH_BY_EMAIL, {
      email: normalizedEmail,
    });
    if (auths.length > 0) {
      return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
    }

    const passwordHash = await hash(password, 10);

    const result = await hygraph.request<CreateAuthResult>(CREATE_AUTH, {
      firstname: firstname.trim(),
      lastname: lastname.trim(),
      email: normalizedEmail,
      passwordHash,
      contact: contact.trim(),
      empid: role === "hr" ? (idNumber ?? "").trim() : null,
      identification: role === "applicant" ? (idNumber ?? "").trim() : null,
      hr: role === "hr",
      applicant: role === "applicant",
    });

    await hygraph.request(PUBLISH_AUTH, { id: result.createAuth.id });

    return NextResponse.json({
      id: result.createAuth.id,
      name: `${result.createAuth.firstname} ${result.createAuth.lastname}`,
      email: result.createAuth.email,
      role,
      identification: role === "applicant" ? (idNumber ?? "").trim() : undefined,
    });
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
