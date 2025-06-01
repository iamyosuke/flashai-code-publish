import { Button } from "@/components/ui/button";
import { getDeckAction } from "@/app/actions/DeckActions";
import { getCardsForDeckAction } from "@/app/actions/CardActions";
import { getDeckStatsAction } from "@/app/actions/StatsActions";
import { CardsClient } from "./CardsClient";
import Link from "next/link";

export default async function DeckPage({ params }: { params: { id: string } }) {
  try {
    const [deck, cards, stats] = await Promise.all([
      getDeckAction(params.id),
      getCardsForDeckAction(params.id),
      getDeckStatsAction(params.id),
    ]);

    return (
      <div className="space-y-8 fade-in-up">
        {/* Header Section */}
        <div className="glass-effect rounded-3xl p-8 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-400/20 to-cyan-400/20 rounded-full blur-2xl"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 gradient-bg rounded-2xl flex items-center justify-center floating-animation">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold gradient-text">{deck.title}</h1>
                    <p className="text-xl text-gray-600 mt-2">{deck.description}</p>
                  </div>
                </div>
                
                {/* Stats */}
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 gradient-bg-success rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <span className="text-gray-700 font-medium">{stats.totalCards} Cards</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 gradient-bg-warning rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <span className="text-gray-700 font-medium">{Math.round(stats.progressPercent)}% Progress</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 gradient-bg-alt rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-gray-700 font-medium">
                      {stats.lastStudiedAt 
                        ? `Last studied ${new Date(stats.lastStudiedAt).toLocaleDateString()}`
                        : "Never studied"
                      }
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  variant="modern"
                  size="lg"
                  asChild
                >
                  <Link href={`/decks/${params.id}/study`}>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Start Study Session
                  </Link>
                </Button>
                
                <Button 
                  variant="outline"
                  size="lg"
                  asChild
                >
                  <Link href={`/decks/${params.id}/edit`}>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Deck
                  </Link>
                </Button>
                
                <Button 
                  variant="ghost"
                  size="lg"
                  asChild
                >
                  <Link href="/decks">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Decks
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-effect rounded-2xl p-6 card-hover">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Study Progress</h3>
              <span className="text-2xl font-bold gradient-text">{Math.round(stats.progressPercent)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${stats.progressPercent}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">{stats.masteredCards} of {stats.totalCards} cards mastered</p>
          </div>
          
          <div className="glass-effect rounded-2xl p-6 card-hover">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Accuracy Rate</h3>
              <span className="text-2xl font-bold text-green-600">{Math.round(stats.accuracyRate)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span className="text-sm text-gray-600">
                {stats.totalStudyTime > 0 
                  ? `${Math.floor(stats.totalStudyTime / 60)} minutes studied`
                  : "No study time yet"
                }
              </span>
            </div>
          </div>
          
          <div className="glass-effect rounded-2xl p-6 card-hover">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Study Streak</h3>
              <span className="text-2xl font-bold text-orange-600">{stats.studyStreak}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              </svg>
              <span className="text-sm text-gray-600">
                {stats.studyStreak > 0 ? "days in a row" : "Start studying!"}
              </span>
            </div>
          </div>
        </div>

        {/* Cards Section */}
        <div className="glass-effect rounded-3xl p-8">
          <CardsClient deckId={params.id} initialCards={cards} />
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6 text-center">
        <div className="w-20 h-20 gradient-bg-alt rounded-full flex items-center justify-center floating-animation">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-gray-800">Error loading deck</h3>
          <p className="text-gray-600">There was an error loading this deck. Please try again.</p>
        </div>
        <Button asChild variant="modern" size="lg">
          <Link href="/decks">Back to Decks</Link>
        </Button>
      </div>
    );
  }
}
