"use client";

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { SignIn, useUser } from '@clerk/nextjs'
import { useState, useEffect } from 'react'

interface PricingButtonsProps {
    plan: 'free' | 'pro'
}

export default function PricingButtons({ plan }: PricingButtonsProps) {
    const { isSignedIn, user } = useUser()
    const [showSignInModal, setShowSignInModal] = useState(false)

    const getRedirectUrl = () => {
        if (plan === 'free') {
            return '/decks'
        }
        
        if (user?.primaryEmailAddress?.emailAddress) {
            const baseUrl = process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_URL || '/pricing'
            return `${baseUrl}?prefilled_email=${encodeURIComponent(user.primaryEmailAddress.emailAddress)}`
        }
        
        return process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_URL || '/pricing'
    }

    const handleGetStarted = () => {
        setShowSignInModal(true)
    }

    useEffect(() => {
        if (isSignedIn && showSignInModal) {
            setShowSignInModal(false)
            // ログイン後は必ずリダイレクト処理を実行
            setTimeout(() => {
                window.location.href = getRedirectUrl()
            }, 100)
        }
    }, [isSignedIn, showSignInModal, plan, user?.primaryEmailAddress?.emailAddress])

    return (
        <>
            <Button
                variant={plan === 'free' ? 'outline' : 'default'}
                className="w-full"
                onClick={handleGetStarted}>
                Get Started
            </Button>

            <Dialog open={showSignInModal} onOpenChange={setShowSignInModal}>
                <DialogContent className="sm:max-w-md">
                    <div className="flex justify-center">
                        <SignIn
                            appearance={{
                                elements: {
                                    formButtonPrimary: "bg-indigo-600 hover:bg-indigo-500",
                                    card: "shadow-none",
                                    rootBox: "w-full",
                                    headerTitle: "text-xl font-semibold",
                                    headerSubtitle: "text-gray-600"
                                },
                            }}
                            signUpUrl="/sign-up"
                            forceRedirectUrl={getRedirectUrl()}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}