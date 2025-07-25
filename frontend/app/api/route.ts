import { NextResponse, type NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  console.log("LIST OF PROCESSS ENV ", process.env);
  console.log("LIST OF PROCESSS ENV ", process.env.NEXTAUTH_URL_INTERNAL);
  console.log("LIST OF PROCESSS ENV ", process.env.NEXTAUTH_URL);
  console.log("LIST OF PROCESSS ENV ", process.env.GOOGLE_CLIENT_ID);
  console.log("LIST OF PROCESSS ENV ", process.env.GOOGLE_CLIENT_SECRET);
  console.log("LIST OF PROCESSS ENV ", process.env.BACKEND_URL);
  console.log("LIST OF PROCESSS ENV ", process.env.NEXTAUTH_SECRET);
  console.log("LIST OF PROCESSS ENV ", process.env.NODE_ENV);

  console.log("LIST OF REQUEST HEADERS ", req.headers);
  console.log("LIST OF REQUEST COOKIES ", req.cookies);
  return NextResponse.json({ "message:": "HI" }, { status: 200 });
}
