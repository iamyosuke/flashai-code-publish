import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import Link from 'next/link'
import { SignedIn, SignedOut } from '@clerk/nextjs'
import { currentUser } from '@clerk/nextjs/server'
import PricingButtons from './PricingButtons'

export default async function Pricing() {
    const user = await currentUser()

    return (
        <section id="pricing" className="py-16 md:py-32">
            <div className="mx-auto max-w-5xl px-6">
                <div className="mx-auto max-w-2xl space-y-6 text-center">
                    <h1 className="text-center text-4xl font-semibold lg:text-5xl">Simple Pricing for Smart Learning</h1>
                    <p>Choose the perfect plan for your learning journey. Start free and upgrade as you grow with FlashAI's powerful features.</p>
                </div>

                <div className="mt-8 grid gap-6 md:mt-20 md:grid-cols-5 md:gap-0">
                    <div className="rounded-(--radius) flex flex-col justify-between space-y-8 border p-6 md:col-span-2 md:my-2 md:rounded-r-none md:border-r-0 lg:p-10">
                        <div className="space-y-4">
                            <div>
                                <h2 className="font-medium">Free</h2>
                                <span className="my-3 block text-2xl font-semibold">$0 / mo</span>
                                <p className="text-muted-foreground text-sm">Perfect for getting started</p>
                            </div>

                            <SignedIn>
                                <Button
                                    asChild
                                    variant="outline"
                                    className="w-full">
                                    <Link href="/decks">Get Started</Link>
                                </Button>
                            </SignedIn>
                            <SignedOut>
                                <PricingButtons plan="free" />
                            </SignedOut>

                            <hr className="border-dashed" />

                            <ul className="list-outside space-y-3 text-sm">
                                {['Up to 50 AI-generated flashcards', '3 decks maximum', 'Basic study modes', 'Progress tracking', 'Community support'].map((item, index) => (
                                    <li
                                        key={index}
                                        className="flex items-center gap-2">
                                        <Check className="size-3" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="dark:bg-muted rounded-(--radius) border p-6 shadow-lg shadow-gray-950/5 md:col-span-3 lg:p-10 dark:[--color-muted:var(--color-zinc-900)]">
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-4">
                                <div>
                                    <h2 className="font-medium">Pro</h2>
                                    <span className="my-3 block text-2xl font-semibold">$9 / mo</span>
                                    <p className="text-muted-foreground text-sm">For serious learners</p>
                                </div>

                                <SignedIn>
                                    <Button
                                        asChild
                                        className="w-full">
                                        <Link href={
                                            user?.primaryEmailAddress?.emailAddress 
                                                ? `${process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_URL}?prefilled_email=${encodeURIComponent(user.primaryEmailAddress.emailAddress)}`
                                                : process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_URL || '/pricing'
                                        }>
                                            Get Started
                                        </Link>
                                    </Button>
                                </SignedIn>
                                <SignedOut>
                                    <PricingButtons plan="pro" />
                                </SignedOut>
                            </div>

                            <div>
                                <div className="text-sm font-medium">Everything in free plus :</div>

                                <ul className="mt-4 list-outside space-y-3 text-sm">
                                    {['Unlimited AI-generated flashcards', 'Unlimited decks', 'Advanced study modes', 'Spaced repetition algorithm', 'Detailed analytics', 'Export to Anki/Quizlet', 'Priority support', 'Custom AI prompts', 'Bulk import from files', 'Offline study mode'].map((item, index) => (
                                        <li
                                            key={index}
                                            className="flex items-center gap-2">
                                            <Check className="size-3" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
