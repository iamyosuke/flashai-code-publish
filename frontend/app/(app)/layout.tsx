import { QueryProvider } from "@/lib/providers/QueryProvider";
import { LayoutProvider } from "@/app/components/layout/LayoutProvider";
import { Toaster } from "@/components/ui/sonner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <LayoutProvider>{children}</LayoutProvider>
      <Toaster position="top-right" richColors />
    </QueryProvider>
  );
}
