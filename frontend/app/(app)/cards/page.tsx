import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function CardsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Create Flashcards</h1>
          <p className="text-muted-foreground mt-2">
            Create flashcards manually or generate them using AI
          </p>
        </div>
        <Button variant="ghost" asChild>
          <Link href="/decks">Back to Decks</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="flex flex-col transition-all duration-300 hover:shadow-md">
          <CardHeader>
            <CardTitle>Manual Creation</CardTitle>
            <CardDescription>
              Create flashcards one by one with custom content
            </CardDescription>
          </CardHeader>
          <CardFooter className="mt-auto">
            <Button variant="gradient" asChild className="w-full">
              <Link href="/cards/create/manual">Create Manually</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="flex flex-col transition-all duration-300 hover:shadow-md">
          <CardHeader>
            <CardTitle>AI Generation</CardTitle>
            <CardDescription>
              Generate flashcards automatically from text using AI
            </CardDescription>
          </CardHeader>
          <CardFooter className="mt-auto">
            <Button variant="gradient" asChild className="w-full">
              <Link href="/cards/create/ai">Generate with AI</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Recent Cards</CardTitle>
            <Button variant="soft" asChild>
              <Link href="/decks">View All Decks</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-center py-8">
            Create your first card to get started
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
