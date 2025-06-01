import { ClientMockProvider } from "./ClientMockProvider";

if (
  process.env.NEXT_RUNTIME === "nodejs" &&
  process.env.NEXT_PUBLIC_API_MOCKING === "enabled"
) {
  import("@/mocks/server").then(({ server }) => {
    server.listen();
  });
}

export function MockProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ClientMockProvider>{children}</ClientMockProvider>
    </>
  );
}
