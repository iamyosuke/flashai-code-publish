import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, BookOpen, Clock, TrendingUp } from "lucide-react";
import Link from "next/link";

import { Deck } from "@/lib/types";

interface DeckCardProps {
  deck: Deck;
  language?: string;
  progress?: number;
  tags?: string[];
  newCards?: number;
}

export function DeckCard({
  deck,
  language = "ja",
  progress = 75,
  tags = ["Vocabulary", "Grammar"],
  newCards = 12,
}: DeckCardProps) {
  const { id, title, description } = deck;
  
  return (
    <Card className="glass-effect border border-white/20 overflow-hidden card-hover group relative">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-blue-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <CardHeader className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <CardTitle className="text-xl font-bold text-gray-800 group-hover:gradient-text transition-all duration-300">
              {title}
            </CardTitle>
            <CardDescription className="line-clamp-2 text-gray-600 mt-2">
              {description}
            </CardDescription>
          </div>
          <div className="ml-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg">
              {language === "ja" ? "Japanese" : language}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative z-10 space-y-6">
        {/* Progress Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Learning Progress</span>
            <span className="text-sm font-bold text-gray-800">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 glass-effect rounded-xl">
            <BookOpen className="w-5 h-5 mx-auto mb-1 text-blue-500" />
            <div className="text-lg font-bold text-gray-800">24</div>
            <div className="text-xs text-gray-600">Cards</div>
          </div>
          <div className="text-center p-3 glass-effect rounded-xl">
            <Sparkles className="w-5 h-5 mx-auto mb-1 text-orange-500" />
            <div className="text-lg font-bold text-gray-800">{newCards}</div>
            <div className="text-xs text-gray-600">New</div>
          </div>
          <div className="text-center p-3 glass-effect rounded-xl">
            <TrendingUp className="w-5 h-5 mx-auto mb-1 text-green-500" />
            <div className="text-lg font-bold text-gray-800">85%</div>
            <div className="text-xs text-gray-600">Accuracy</div>
          </div>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full text-xs font-medium text-gray-700 border border-gray-300/50 hover:from-purple-100 hover:to-pink-100 hover:text-purple-700 transition-all duration-300"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Last Study */}
        <div className="flex items-center text-sm text-gray-600">
          <Clock className="w-4 h-4 mr-2 text-gray-500" />
          <span>Last studied 2 hours ago</span>
        </div>
      </CardContent>

      <CardFooter className="relative z-10 flex flex-col space-y-3 pt-6">
        <Link href={`/decks/${id}/study`}>
          <Button variant="modern" size="lg" className="w-full">
            <Sparkles className="w-4 h-4 mr-2" />
            Study Now
          </Button>
        </Link>
        <div className="flex space-x-2 w-full">
          <Button 
            variant="outline"
            size="sm"
            className="flex-1" 
            asChild
          >
            <Link href={`/decks/${id}`}>
              <BookOpen className="w-4 h-4 mr-2" />
              View Cards
            </Link>
          </Button>
          <Button 
            variant="soft"
            size="sm"
            className="flex-1" 
            asChild
          >
            <Link href={`/decks/${id}/edit`}>
              Edit
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
