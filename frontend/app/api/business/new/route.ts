import getBaseURL from "@/lib/getBaseURL";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const data = await req.json();
  const cookieStore = await cookies();
  const backendJWT = cookieStore.get("x-backend-jwt");

  // console.log(` ${backendJWT?.name} ${backendJWT?.value}`);

  const apiRes = await fetch(`${process.env.BACKEND_URL}/api/business/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${backendJWT?.value}`,
      ...(process.env.INTERNAL_API_KEY && {
        "X-API-KEY": process.env.INTERNAL_API_KEY,
      }),
    },
    body: JSON.stringify(data),
  });

  if (!apiRes.ok) {
    const text = apiRes.statusText;
    return NextResponse.json({ error: text }, { status: apiRes.status });
  }

  const responseJSON = await apiRes.json();
  // console.log(responseJSON);

  return NextResponse.json(responseJSON, { status: apiRes.status });
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ message: "HI" });
}
