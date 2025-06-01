import { DeckCard } from "@/app/components/decks/DeckCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Deck } from "@/lib/types";
import { getDecksAction } from "@/app/actions/DeckActions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Decks - Flash AI",
  description: "Manage your flashcard collections and track your learning progress with Flash AI's intelligent study system.",
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: "Your Decks - Flash AI",
    description: "Manage your flashcard collections and track your learning progress with Flash AI's intelligent study system.",
  },
};

export default async function DecksPage() {
  const decks = await getDecksAction();

  return (
    <div className="space-y-8 fade-in-up">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold gradient-text mb-2">Your Decks</h1>
          <p className="text-gray-600">Manage and study your flashcard collections</p>
        </div>
        <Button asChild variant="modern" size="lg">
          <Link href="/decks/create">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Deck
          </Link>
        </Button>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-effect rounded-2xl p-6 card-hover">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 gradient-bg rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{decks?.length || 0}</div>
              <div className="text-sm text-gray-600">Total Decks</div>
            </div>
          </div>
        </div>
        
        <div className="glass-effect rounded-2xl p-6 card-hover">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 gradient-bg-success rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">
                0
              </div>
              <div className="text-sm text-gray-600">Total Cards</div>
            </div>
          </div>
        </div>
        
        <div className="glass-effect rounded-2xl p-6 card-hover">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 gradient-bg-warning rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">85%</div>
              <div className="text-sm text-gray-600">Study Progress</div>
            </div>
          </div>
        </div>
      </div>

      {/* Decks Grid */}
      {decks && decks.length > 0 ? (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-800">Your Collections</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {decks.map((deck, index) => (
              <div 
                key={deck.id} 
                className="fade-in-up"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <DeckCard deck={deck} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-6 text-center">
          <div className="w-24 h-24 gradient-bg rounded-full flex items-center justify-center floating-animation">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-gray-800">No decks yet</h3>
            <p className="text-gray-600 max-w-md">
              Start your learning journey by creating your first flashcard deck. 
              Organize your study materials and boost your knowledge retention.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild variant="modern" size="lg">
              <Link href="/decks/create">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Your First Deck
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/cards/create/ai">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Try AI Generation
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
