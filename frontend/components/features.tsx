import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { BrainCircuit, Sparkles, BookOpen, Zap, Target, TrendingUp } from 'lucide-react'
import { ReactNode } from 'react'

export default function Features() {
    return (
        <section id="features" className="bg-zinc-50 py-16 md:py-32 dark:bg-transparent">
            <div className="@container mx-auto max-w-6xl px-6">
                <div className="text-center">
                    <h2 className="text-balance text-4xl font-semibold lg:text-5xl gradient-text">
                        Powerful Features for Effective Learning
                    </h2>
                    <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
                        Transform your study experience with AI-powered flashcards, intelligent spaced repetition, and comprehensive progress tracking.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8 md:mt-16">
                    <Card className="group glass-effect border border-white/20 card-hover">
                        <CardHeader className="pb-3">
                            <CardDecorator>
                                <Sparkles
                                    className="size-6 text-purple-600"
                                    aria-hidden
                                />
                            </CardDecorator>

                            <h3 className="mt-6 font-semibold text-xl gradient-text">AI-Powered Generation</h3>
                        </CardHeader>

                        <CardContent>
                            <p className="text-sm text-gray-600">
                                Generate high-quality flashcards instantly using advanced AI. Simply provide a topic or text, and let our AI create comprehensive study materials for you.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="group glass-effect border border-white/20 card-hover">
                        <CardHeader className="pb-3">
                            <CardDecorator>
                                <BrainCircuit
                                    className="size-6 text-blue-600"
                                    aria-hidden
                                />
                            </CardDecorator>

                            <h3 className="mt-6 font-semibold text-xl gradient-text">Smart Spaced Repetition</h3>
                        </CardHeader>

                        <CardContent>
                            <p className="text-sm text-gray-600">
                                Optimize your learning with intelligent algorithms that present cards at the perfect intervals to maximize retention and minimize study time.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="group glass-effect border border-white/20 card-hover">
                        <CardHeader className="pb-3">
                            <CardDecorator>
                                <TrendingUp
                                    className="size-6 text-green-600"
                                    aria-hidden
                                />
                            </CardDecorator>

                            <h3 className="mt-6 font-semibold text-xl gradient-text">Progress Tracking</h3>
                        </CardHeader>

                        <CardContent>
                            <p className="text-sm text-gray-600">
                                Monitor your learning journey with detailed analytics, accuracy rates, study streaks, and personalized insights to keep you motivated.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="group glass-effect border border-white/20 card-hover">
                        <CardHeader className="pb-3">
                            <CardDecorator>
                                <BookOpen
                                    className="size-6 text-orange-600"
                                    aria-hidden
                                />
                            </CardDecorator>

                            <h3 className="mt-6 font-semibold text-xl gradient-text">Organized Decks</h3>
                        </CardHeader>

                        <CardContent>
                            <p className="text-sm text-gray-600">
                                Create and manage multiple study decks for different subjects. Keep your learning materials organized and easily accessible.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="group glass-effect border border-white/20 card-hover">
                        <CardHeader className="pb-3">
                            <CardDecorator>
                                <Target
                                    className="size-6 text-red-600"
                                    aria-hidden
                                />
                            </CardDecorator>

                            <h3 className="mt-6 font-semibold text-xl gradient-text">Adaptive Learning</h3>
                        </CardHeader>

                        <CardContent>
                            <p className="text-sm text-gray-600">
                                The system adapts to your learning pace and difficulty preferences, focusing on areas where you need the most practice.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="group glass-effect border border-white/20 card-hover">
                        <CardHeader className="pb-3">
                            <CardDecorator>
                                <Zap
                                    className="size-6 text-yellow-600"
                                    aria-hidden
                                />
                            </CardDecorator>

                            <h3 className="mt-6 font-semibold text-xl gradient-text">Lightning Fast</h3>
                        </CardHeader>

                        <CardContent>
                            <p className="text-sm text-gray-600">
                                Enjoy a smooth, responsive experience with instant card generation, quick study sessions, and seamless navigation across all devices.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    )
}

const CardDecorator = ({ children }: { children: ReactNode }) => (
    <div className="relative mx-auto size-36 duration-300 group-hover:scale-105">
        <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-br from-purple-100/50 to-blue-100/50 rounded-2xl group-hover:from-purple-200/70 group-hover:to-blue-200/70 transition-all duration-300"
        />
        <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(to_right,rgba(102,126,234,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(102,126,234,0.1)_1px,transparent_1px)] bg-[size:24px_24px] rounded-2xl"
        />
        <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent rounded-2xl"
        />
        <div className="bg-white/80 backdrop-blur-sm absolute inset-0 m-auto flex size-16 items-center justify-center rounded-xl border border-white/40 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:bg-white/90">
            {children}
        </div>
    </div>
)
