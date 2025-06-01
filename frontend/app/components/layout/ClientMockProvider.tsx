"use client";

import { Suspense, use } from "react";

const mockingEnabledPromise =
  typeof window !== "undefined" &&
  process.env.NEXT_PUBLIC_API_MOCKING === "true" &&
  process.env.NODE_ENV === "development"
    ? import("@/mocks/browser").then(async ({ worker }) => {
        await worker.start({
          onUnhandledRequest(request, print) {
            if (request.url.includes("_next")) {
              return;
            }
            print.warning();
          },
        });
        worker.start();

        console.log(worker.listHandlers());
      })
    : Promise.resolve();

export function ClientMockProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // If MSW is enabled, we need to wait for the worker to start,
  // so we wrap the children in a Suspense boundary until it's ready.
  return (
    <Suspense fallback={null}>
      <ClientMockProviderWrapper>{children}</ClientMockProviderWrapper>
    </Suspense>
  );
}

function ClientMockProviderWrapper({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  use(mockingEnabledPromise);
  return children;
}
