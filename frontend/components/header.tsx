'use client'
import Link from 'next/link'
import { Logo } from '@/components/logo'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import React from 'react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { TypingAnimation } from './magicui/typing-animation'

const menuItems = [
    { name: 'Features', href: '#link' },
    { name: 'Solution', href: '#link' },
    { name: 'Pricing', href: '#link' },
    { name: 'About', href: '#link' },
]

export const HeroHeader = ({ userId }: { userId: string | null }) => {
    const [menuState, setMenuState] = React.useState(false)
    const [isScrolled, setIsScrolled] = React.useState(false)
    const loggedIn = !!userId;
    console.log(loggedIn)
    React.useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])
    return (
        <header>
            <nav
                data-state={menuState && 'active'}
                className="fixed z-20 w-full px-2">
                <div className={cn('mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12', isScrolled && 'bg-background/50 max-w-4xl rounded-2xl border backdrop-blur-lg lg:px-5')}>
                    <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
                        <div className="flex w-full justify-between lg:w-auto">
                            <Link
                                href="/"
                                aria-label="home"
                                className="flex items-center space-x-2">
                                <Image src="/logo.png" alt="logo" width={40} height={40} />
                                <TypingAnimation  delay={1} duration={100} className="text-2xl font-bold gradient-text ml-4">Flash AI</TypingAnimation>
                            </Link>

                            <button
                                onClick={() => setMenuState(!menuState)}
                                aria-label={menuState == true ? 'Close Menu' : 'Open Menu'}
                                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden">
                                <Menu className="in-data-[state=active]:rotate-180 in-data-[state=active]:scale-0 in-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                                <X className="in-data-[state=active]:rotate-0 in-data-[state=active]:scale-100 in-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
                            </button>
                        </div>

                        <div className="absolute inset-0 m-auto hidden size-fit lg:block">
                            <ul className="flex gap-8 text-sm">
                                {menuItems.map((item, index) => (
                                    <li key={index}>
                                        <Link
                                            href={item.href}
                                            className="text-muted-foreground hover:text-accent-foreground block duration-150">
                                            <span>{item.name}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Desktop Buttons */}
                        <div className="bg-background in-data-[state=active]:block lg:in-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent">
                            {loggedIn ? (
                                <Button
                                    asChild
                                    size="sm"
                                    variant="modern">
                                    <Link href="/decks">
                                        <span>Start Learning</span>
                                    </Link>
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        asChild
                                        variant="outline"
                                        size="sm"
                                        className={cn(isScrolled && 'lg:hidden')}>
                                        <Link href="/sign-in">
                                            <span>Login</span>
                                        </Link>
                                    </Button>
                                    <Button
                                        asChild
                                        size="sm"
                                        className={cn(isScrolled && 'lg:hidden')}>
                                        <Link href="/sign-up">
                                            <span>Sign Up</span>
                                        </Link>
                                    </Button>
                                    <Button
                                        asChild
                                        size="sm"
                                        variant="modern"
                                        className={cn(isScrolled ? 'lg:inline-flex' : 'hidden')}>
                                        <Link href="/decks">
                                            <span>Get Started</span>
                                        </Link>
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Mobile Menu */}
                    {menuState && (
                        <div className="lg:hidden">
                            <div className="bg-background/95 backdrop-blur-sm border-t border-border/50 rounded-b-2xl p-6 shadow-lg">
                                <div className="space-y-6">
                                    {/* Navigation Links */}
                                    <ul className="space-y-4">
                                        {menuItems.map((item, index) => (
                                            <li key={index}>
                                                <Link
                                                    href={item.href}
                                                    className="text-muted-foreground hover:text-accent-foreground block text-lg font-medium duration-150"
                                                    onClick={() => setMenuState(false)}>
                                                    <span>{item.name}</span>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                    
                                    {/* Action Buttons */}
                                    <div className="flex flex-col space-y-3 pt-4 border-t border-border/50">
                                        {loggedIn ? (
                                            <Button
                                                asChild
                                                size="lg"
                                                variant="modern"
                                                className="w-full">
                                                <Link href="/decks">
                                                    <span>Start Learning</span>
                                                </Link>
                                            </Button>
                                        ) : (
                                            <>
                                                <Button
                                                    asChild
                                                    variant="outline"
                                                    size="lg"
                                                    className="w-full">
                                                    <Link href="/sign-in">
                                                        <span>Login</span>
                                                    </Link>
                                                </Button>
                                                <Button
                                                    asChild
                                                    size="lg"
                                                    variant="modern"
                                                    className="w-full">
                                                    <Link href="/sign-up">
                                                        <span>Sign Up</span>
                                                    </Link>
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </nav>
        </header>
    )
}
