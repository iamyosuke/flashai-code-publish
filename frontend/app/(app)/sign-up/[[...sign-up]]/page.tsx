import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up - Flash AI",
  description: "Join Flash AI to create AI-powered flashcards and accelerate your language learning journey.",
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: "Sign Up - Flash AI",
    description: "Join Flash AI to create AI-powered flashcards and accelerate your language learning journey.",
  },
};

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp
        appearance={{
          elements: {
            formButtonPrimary: "bg-indigo-600 hover:bg-indigo-500",
          },
        }}
      />
    </div>
  );
}
