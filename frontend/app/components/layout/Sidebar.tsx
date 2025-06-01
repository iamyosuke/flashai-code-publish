"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BookOpen, BrainCircuit, Home, X, Plus, Sparkles } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  closeSidebar: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  gradient?: string;
}

const navItems: NavItem[] = [
  {
    href: "/",
    label: "Home",
    icon: <Home className="w-5 h-5" />,
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    href: "/decks",
    label: "My Decks",
    icon: <BookOpen className="w-5 h-5" />,
    gradient: "from-purple-500 to-pink-500"
  },
  {
    href: "/cards",
    label: "All Cards",
    icon: <BrainCircuit className="w-5 h-5" />,
    gradient: "from-green-500 to-blue-500"
  },
];

const createItems: NavItem[] = [
  {
    href: "/cards/create/ai",
    label: "AI Generate",
    icon: <Sparkles className="w-5 h-5" />,
    gradient: "from-orange-500 to-red-500"
  },
  {
    href: "/cards/create/manual",
    label: "Manual Create",
    icon: <Plus className="w-5 h-5" />,
    gradient: "from-teal-500 to-green-500"
  },
];

export function Sidebar({ isOpen, closeSidebar }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 lg:hidden"
          onClick={closeSidebar}
        />
      )}
      
      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 glass-effect border-r border-white/20 w-72 transition-all duration-300 transform z-30 lg:translate-x-0 lg:static slide-in-right",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex justify-between items-center h-20 px-6 border-b border-white/20 lg:hidden">
          <span className="font-bold text-xl gradient-text">Menu</span>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={closeSidebar}
            className="hover:bg-white/20 transition-all duration-300 rounded-full"
          >
            <X className="w-5 h-5 text-gray-700" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="p-6 space-y-8">
          {/* Main Navigation */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Navigation
            </h3>
            {navItems.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-300 card-hover",
                  pathname === item.href
                    ? "glass-effect border border-white/30 shadow-lg"
                    : "hover:glass-effect hover:border hover:border-white/20"
                )}
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <div className={cn(
                  "p-2 rounded-xl bg-gradient-to-br transition-all duration-300 group-hover:scale-110",
                  item.gradient || "from-gray-400 to-gray-600"
                )}>
                  <div className="text-white">
                    {item.icon}
                  </div>
                </div>
                <span className={cn(
                  "transition-colors duration-300",
                  pathname === item.href 
                    ? "text-gray-800 font-semibold" 
                    : "text-gray-600 group-hover:text-gray-800"
                )}>
                  {item.label}
                </span>
              </Link>
            ))}
          </div>

          {/* Create Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Create
            </h3>
            {createItems.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-300 card-hover",
                  pathname === item.href
                    ? "glass-effect border border-white/30 shadow-lg"
                    : "hover:glass-effect hover:border hover:border-white/20"
                )}
                style={{animationDelay: `${(index + navItems.length) * 0.1}s`}}
              >
                <div className={cn(
                  "p-2 rounded-xl bg-gradient-to-br transition-all duration-300 group-hover:scale-110",
                  item.gradient || "from-gray-400 to-gray-600"
                )}>
                  <div className="text-white">
                    {item.icon}
                  </div>
                </div>
                <span className={cn(
                  "transition-colors duration-300",
                  pathname === item.href 
                    ? "text-gray-800 font-semibold" 
                    : "text-gray-600 group-hover:text-gray-800"
                )}>
                  {item.label}
                </span>
              </Link>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="space-y-3 pt-6 border-t border-white/20">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Quick Actions
            </h3>
            <Button 
              asChild 
              variant="modern"
              className="w-full rounded-2xl py-3 h-auto justify-start gap-3"
            >
              <Link href="/decks/create">
                <Plus className="w-5 h-5" />
                New Deck
              </Link>
            </Button>
          </div>
        </nav>

        {/* Footer */}
        <div className="absolute bottom-6 left-6 right-6">
          <div className="glass-effect rounded-2xl p-4 text-center">
            <div className="text-sm text-gray-600 mb-2">
              Learning Progress
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full w-3/4 transition-all duration-500"></div>
            </div>
            <div className="text-xs text-gray-500">
              75% Complete
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
