"use client";

import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import Link from "next/link";

interface HeaderProps {
  toggleSidebar: () => void;
}

export function Header({ toggleSidebar }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full glass-effect border-b border-white/20 backdrop-blur-md">
      <div className="flex h-20 items-center px-6">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden hover:bg-white/20 transition-all duration-300 rounded-full"
          onClick={toggleSidebar}
        >
          <Menu className="h-6 w-6 text-gray-700" />
        </Button>

        <Link href="/" className="text-2xl font-bold gradient-text ml-4 floating-animation">
          AI Flashcards
        </Link>

        <div className="ml-auto flex items-center space-x-6">
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              href="/decks" 
              className="text-gray-700 hover:text-purple-600 transition-colors duration-300 font-medium"
            >
              My Decks
            </Link>
            <Link 
              href="/cards/create" 
              className="text-gray-700 hover:text-purple-600 transition-colors duration-300 font-medium"
            >
              Create Cards
            </Link>
          </nav>
          <div className="flex items-center space-x-4">
            <Button 
              asChild 
              variant="modern"
              size="sm"
              className="hidden sm:inline-flex"
            >
              <Link href="/cards/create/ai">AI Generate</Link>
            </Button>
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur opacity-30"></div>
              <div className="relative bg-white rounded-full p-1">
                <UserButton 
                  appearance={{
                    elements: {
                      avatarBox: "w-10 h-10 rounded-full border-2 border-white shadow-lg"
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
