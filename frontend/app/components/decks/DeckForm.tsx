"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { createDeckAction, updateDeckAction } from "@/app/actions/DeckActions";
import { Deck } from "@/lib/types";

interface DeckFormProps {
  mode: "create" | "edit";
  deck?: Deck;
  returnUrl?: string;
}

export function DeckForm({ mode, deck, returnUrl = "/decks" }: DeckFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(deck?.title || "");
  const [description, setDescription] = useState(deck?.description || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      if (mode === "create") {
        const newDeck = await createDeckAction({ title, description });
        router.push(`/decks/${newDeck.id}`);
      } else if (mode === "edit" && deck) {
        await updateDeckAction(deck.id, { title, description });
        router.push(`/decks/${deck.id}`);
      }
    } catch (error) {
      console.error(`Failed to ${mode} deck:`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 fade-in-up">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 gradient-bg rounded-2xl flex items-center justify-center floating-animation">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
        </div>
        <div>
          <h1 className="text-4xl font-bold gradient-text mb-3">
            {mode === "create" ? "Create New Deck" : "Edit Deck"}
          </h1>
          <p className="text-xl text-gray-600">
            {mode === "create" 
              ? "Organize your flashcards into a structured learning deck"
              : "Update your deck information and settings"
            }
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card className="glass-effect border border-white/20 overflow-hidden">
          <div className="p-8 space-y-8 relative">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-400/10 to-cyan-400/10 rounded-full blur-2xl"></div>
            
            <div className="relative z-10 space-y-8">
              {/* Title Field */}
              <div className="space-y-3">
                <Label htmlFor="title" className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <div className="w-6 h-6 gradient-bg-success rounded-lg flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  Deck Title
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g., JLPT N3 Vocabulary, Spanish Verbs, History Facts"
                  className="modern-input h-12 text-lg rounded-xl border-2 focus:border-purple-400 transition-all duration-300"
                  required
                />
                <p className="text-sm text-gray-500">
                  Choose a clear, descriptive name for your deck
                </p>
              </div>

              {/* Description Field */}
              <div className="space-y-3">
                <Label htmlFor="description" className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <div className="w-6 h-6 gradient-bg-warning rounded-lg flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={4}
                  className="modern-input resize-none rounded-xl border-2 focus:border-purple-400 transition-all duration-300"
                  placeholder="Describe what this deck covers, your learning goals, or any special notes..."
                />
                <p className="text-sm text-gray-500">
                  Help yourself and others understand what this deck is about
                </p>
              </div>

              {/* Preview Section */}
              {(title || description) && (
                <div className="glass-effect rounded-2xl p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Preview
                  </h3>
                  <div className="space-y-2">
                    {title && (
                      <h4 className="text-xl font-bold gradient-text">{title}</h4>
                    )}
                    {description && (
                      <p className="text-gray-600">{description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>0 cards</span>
                      <span>•</span>
                      <span>Created {new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="px-8 py-6 bg-gray-50/50 border-t border-white/20">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Button 
                type="submit" 
                disabled={isSubmitting || !title.trim()}
                variant="modern"
                size="lg"
                className="w-full sm:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <svg className="w-5 h-5 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {mode === "create" ? "Creating..." : "Saving..."}
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {mode === "create" ? "Create Deck" : "Save Changes"}
                  </>
                )}
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                className="px-8 py-3 rounded-2xl border-2 border-gray-300 text-gray-600 hover:bg-gray-50 w-full sm:w-auto"
                size="lg"
                asChild
              >
                <Link href={returnUrl}>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      </form>

      {/* Tips Section */}
      <div className="glass-effect rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Tips for Creating Great Decks
        </h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <strong>Be Specific:</strong> Use clear, descriptive titles that indicate the subject and level
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <strong>Add Context:</strong> Include learning goals and difficulty level in the description
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <strong>Stay Focused:</strong> Keep each deck focused on a specific topic or skill
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <strong>Plan Ahead:</strong> Consider how you'll organize and study the cards
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
