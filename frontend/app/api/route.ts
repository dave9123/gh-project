import { NextResponse, type NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  return NextResponse.json({ "message:": "HI" }, { status: 200 });
}
