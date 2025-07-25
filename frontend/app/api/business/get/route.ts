import getBaseURL from "@/lib/getBaseURL";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  console.log("GET request received in /api/business/get");
  const cookieStore = await cookies();
  const backendJWT = cookieStore.get("x-backend-jwt");

  console.log(` ${backendJWT?.name} ${backendJWT?.value}`);

  const apiRes = await fetch(`${process.env.BACKEND_URL}/api/business/get`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${backendJWT?.value}`,
      ...(process.env.INTERNAL_API_KEY && {
        "X-API-KEY": process.env.INTERNAL_API_KEY,
      }),
    },
  });

  if (!apiRes.ok) {
    const text = apiRes.statusText;
    return NextResponse.json({ error: text }, { status: apiRes.status });
  }

  const responseJSON = await apiRes.json();
  // console.log(responseJSON);

  return NextResponse.json(responseJSON, { status: apiRes.status });
}
