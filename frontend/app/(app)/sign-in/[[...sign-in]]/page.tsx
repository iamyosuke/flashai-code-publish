import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In - Flash AI",
  description: "Sign in to Flash AI to access your personalized flashcards and continue your language learning journey.",
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: "Sign In - Flash AI",
    description: "Sign in to Flash AI to access your personalized flashcards and continue your language learning journey.",
  },
};

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn
        appearance={{
          elements: {
            formButtonPrimary: "bg-indigo-600 hover:bg-indigo-500",
          },
        }}
      />
    </div>
  );
}
