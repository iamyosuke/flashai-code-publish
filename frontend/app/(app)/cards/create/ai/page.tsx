import AIGenerateCardsForm from "./AIGenerateCardsForm";
import { getDecksAction } from "@/app/actions/DeckActions";
import { Deck } from "@/lib/types";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowLeft, BrainCircuit, Zap } from "lucide-react";
import { TextEffect } from "@/components/ui/text-effect";
import { AnimatedGroup } from "@/components/ui/animated-group";

const transitionVariants = {
  item: {
    hidden: {
      opacity: 0,
      filter: "blur(12px)",
      y: 12,
    },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        type: "spring",
        bounce: 0.3,
        duration: 1.5,
      },
    },
  },
};

export default async function GenerateCardsPage() {
  let decks: Deck[] = [];
  try {
    decks = await getDecksAction();
  } catch {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 particle-bg">
        <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-8 text-center px-6">
          <AnimatedGroup variants={transitionVariants}>
            <div className="relative">
              <div className="w-24 h-24 gradient-bg-alt rounded-full flex items-center justify-center floating-animation shadow-2xl">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -inset-4 gradient-bg-alt rounded-full opacity-20 blur-xl"></div>
            </div>
          </AnimatedGroup>
          
          <AnimatedGroup variants={transitionVariants}>
            <div className="space-y-4">
              <h3 className="text-3xl font-bold gradient-text">Failed to load decks</h3>
              <p className="text-gray-600 text-lg max-w-md mx-auto">
                There was an error loading your decks. Please try again or create a new deck.
              </p>
            </div>
          </AnimatedGroup>

          <AnimatedGroup variants={transitionVariants}>
            <div className="bg-foreground/10 rounded-[calc(var(--radius-xl)+0.125rem)] border p-0.5">
              <Button asChild size="lg" className="btn-modern rounded-xl px-8 text-base">
                <Link href="/decks">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Decks
                </Link>
              </Button>
            </div>
          </AnimatedGroup>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 particle-bg">
      {/* Background decorative elements */}
      <div
        aria-hidden
        className="absolute inset-0 isolate opacity-40 contain-strict"
      >
        <div className="w-96 h-96 absolute top-20 left-10 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(280,100%,70%,.08)_0,hsla(260,100%,60%,.02)_50%,hsla(240,100%,50%,0)_80%)]" />
        <div className="w-80 h-80 absolute top-40 right-20 rotate-12 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(200,100%,70%,.06)_0,hsla(180,100%,60%,.02)_80%,transparent_100%)]" />
        <div className="w-64 h-64 absolute bottom-20 left-1/3 -rotate-12 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(320,100%,70%,.04)_0,hsla(300,100%,60%,.02)_80%,transparent_100%)]" />
      </div>

      <div className="relative z-10">
        {/* Header Section */}
        <div className="pt-8 pb-12">
          <div className="max-w-7xl mx-auto px-6">
            <AnimatedGroup variants={transitionVariants}>
              <div className="flex items-center justify-between mb-8">
                <Button variant="ghost" asChild className="hover:bg-white/20 transition-all duration-300">
                  <Link href="/cards" className="flex items-center space-x-2">
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Cards</span>
                  </Link>
                </Button>
              </div>
            </AnimatedGroup>

            {/* Hero Section */}
            <div className="text-center mb-16">
              <AnimatedGroup variants={transitionVariants}>
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-6 py-2 mb-8 shadow-lg">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">AI-Powered Generation</span>
                </div>
              </AnimatedGroup>

              <TextEffect
                preset="fade-in-blur"
                speedSegment={0.3}
                as="h1"
                className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 gradient-text"
              >
                Create Smart Flashcards
              </TextEffect>

              <TextEffect
                per="line"
                preset="fade-in-blur"
                speedSegment={0.3}
                delay={0.5}
                as="p"
                className="text-xl text-gray-600 max-w-3xl mx-auto mb-8"
              >
                Transform any content into intelligent flashcards using advanced AI. 
                Support for text, images, and audio input with instant generation.
              </TextEffect>

              {/* Feature highlights */}
              <AnimatedGroup
                variants={{
                  container: {
                    visible: {
                      transition: {
                        staggerChildren: 0.1,
                        delayChildren: 0.8,
                      },
                    },
                  },
                  ...transitionVariants,
                }}
                className="flex flex-wrap justify-center gap-6 mb-12"
              >
                <div className="flex items-center space-x-2 bg-white/30 backdrop-blur-sm rounded-full px-4 py-2 border border-white/40">
                  <BrainCircuit className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Smart AI Analysis</span>
                </div>
                <div className="flex items-center space-x-2 bg-white/30 backdrop-blur-sm rounded-full px-4 py-2 border border-white/40">
                  <Zap className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-gray-700">Instant Generation</span>
                </div>
                <div className="flex items-center space-x-2 bg-white/30 backdrop-blur-sm rounded-full px-4 py-2 border border-white/40">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">Multi-format Support</span>
                </div>
              </AnimatedGroup>
            </div>
          </div>
        </div>

        {/* Main Form Section */}
        <div className="pb-20">
          <div className="max-w-5xl mx-auto px-6">
            <AnimatedGroup
              variants={{
                container: {
                  visible: {
                    transition: {
                      staggerChildren: 0.1,
                      delayChildren: 1.0,
                    },
                  },
                },
                ...transitionVariants,
              }}
            >
              <div className="relative">
                {/* Glassmorphism container */}
                {/* <div className="glass-effect rounded-3xl border border-white/30 shadow-2xl backdrop-blur-xl overflow-hidden"> */}
                  {/* Gradient overlay */}
                  {/* <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-transparent pointer-events-none"></div> */}
                  
                  {/* Content */}
                  {/* <div className="relative z-10 p-8 md:p-12"> */}
                    <AIGenerateCardsForm decks={decks} />
                  {/* </div> */}
                {/* </div> */}

                {/* Decorative elements */}
                <div className="absolute -inset-4 bg-gradient-to-r from-purple-400/20 via-blue-400/20 to-indigo-400/20 rounded-3xl blur-xl opacity-60 -z-10"></div>
              </div>
            </AnimatedGroup>
          </div>
        </div>

        {/* Bottom decorative section */}
        <div className="pb-12">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <AnimatedGroup variants={transitionVariants}>
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30 p-8 shadow-lg">
                <h3 className="text-2xl font-bold gradient-text mb-4">
                  Ready to revolutionize your learning?
                </h3>
                <p className="text-gray-600 mb-6">
                  Join thousands of students who are already using AI-powered flashcards to study more effectively.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <div className="bg-white/30 rounded-full px-4 py-2 border border-white/40">
                    <span className="text-sm font-medium text-gray-700">✨ Instant Generation</span>
                  </div>
                  <div className="bg-white/30 rounded-full px-4 py-2 border border-white/40">
                    <span className="text-sm font-medium text-gray-700">🧠 Smart Learning</span>
                  </div>
                  <div className="bg-white/30 rounded-full px-4 py-2 border border-white/40">
                    <span className="text-sm font-medium text-gray-700">📱 Multi-device</span>
                  </div>
                </div>
              </div>
            </AnimatedGroup>
          </div>
        </div>
      </div>
    </div>
  );
}
