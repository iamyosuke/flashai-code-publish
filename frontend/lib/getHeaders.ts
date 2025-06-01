import { auth } from "@clerk/nextjs/server";

export async function getHeaders() {
  const { getToken } = await auth();
  const token = await getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  return headers;
}
