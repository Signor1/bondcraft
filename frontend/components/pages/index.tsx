'use client'

import React from 'react'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import LaunchpadCard from "@/components/launchpad-card"
import { ChevronRight, BarChart, Coins, LineChart, AlertTriangle } from "lucide-react"
import Image from 'next/image'
import FaqsAndSupport from './faqsAndSupport'
import useGetAllLaunchpads from '@/hooks/useGetAllLaunchpads'

const LandingPage = () => {
    // Fetch all launchpads using the custom hook
    const { launchpads, isLoading, isError } = useGetAllLaunchpads();

    return (
        <React.Fragment>
            {/* Hero section */}
            <section className="relative overflow-hidden py-32">
                <div className="absolute inset-0 gradient-bg"></div>
                <div className="container relative z-10 mx-auto px-4 text-center">
                    <Badge className="mb-4" variant="outline">
                        Sui Overflow Hackathon
                    </Badge>
                    <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                        Launch Tokens on Sui with <span className="text-primary">BondCraft</span>
                    </h1>
                    <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
                        Secure, Transparent, Decentralized token launchpad for the Sui blockchain ecosystem
                    </p>
                    <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                        <Link href="/launchpads">
                            <Button size="lg" className="gap-2">
                                Explore Launchpads
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </Link>
                        <Link href="/create">
                            <Button size="lg" variant="outline">
                                Create Launchpad
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Featured launchpads */}
            <section className="bg-background py-28">
                <div className="container mx-auto px-4 md:px-10">
                    <div className="mb-8 flex items-center justify-between">
                        <h2 className="text-xl font-medium tracking-tight">Featured Launchpads</h2>
                        <Link href="/launchpads">
                            <Button variant="link" className="gap-1">
                                View all
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                    {isLoading ? (
                        <div className="flex h-32 items-center justify-center">
                            <div className="text-center">Loading launchpads...</div>
                        </div>
                    ) : isError ? (
                        <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border border-dashed p-12 text-center">
                            <AlertTriangle className="h-12 w-12 text-muted-foreground" />
                            <h3 className="text-lg font-semibold">Error Loading Launchpads</h3>
                            <p className="text-sm text-muted-foreground">We couldn&apos;t load the launchpads. Please try again later.</p>
                        </div>
                    ) : launchpads && launchpads.length > 0 ? (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {launchpads.slice(0, 3).map((launchpad) => (
                                <LaunchpadCard key={launchpad.id} {...launchpad} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border border-dashed p-12 text-center">
                            <AlertTriangle className="h-12 w-12 text-muted-foreground" />
                            <h3 className="text-lg font-semibold">No Launchpads Found</h3>
                        </div>
                    )}
                </div>
            </section>

            {/* Stats section */}
            <section className="border-y bg-muted/10 py-28">
                <div className="container mx-auto px-4 md:px-24">
                    <h2 className="mb-10 text-center text-2xl font-medium tracking-tight">Platform Statistics</h2>
                    <div className="grid gap-8 sm:grid-cols-3">
                        <div className="rounded-lg bg-background p-6 text-center shadow-sm">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                                <BarChart className="h-10 w-10 text-primary" />
                            </div>
                            <h3 className="text-4xl font-bold">42</h3>
                            <p className="text-sm text-muted-foreground">Total Launchpads</p>
                        </div>
                        <div className="rounded-lg bg-background p-6 text-center shadow-sm">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                                <Coins className="h-10 w-10 text-primary" />
                            </div>
                            <h3 className="text-4xl font-bold">5.2M</h3>
                            <p className="text-sm text-muted-foreground">USDC Raised</p>
                        </div>
                        <div className="rounded-lg bg-background p-6 text-center shadow-sm">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                                <LineChart className="h-10 w-10 text-primary" />
                            </div>
                            <h3 className="text-4xl font-bold">26</h3>
                            <p className="text-sm text-muted-foreground">Active Pools</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Roadmap section */}
            <section className="py-28">
                <div className="container mx-auto px-4 md:px-8">
                    <h2 className="mb-10 text-center text-2xl font-medium tracking-tight">Integrated Protocols</h2>
                    <div className="max-w-4xl mx-auto">
                        <div className="w-full grid gap-8 md:grid-cols-2">
                            <div className="card-background rounded-lg border p-6">
                                <div className="mb-4 flex h-40 w-full items-center justify-center rounded-md bg-primary/10 overflow-hidden">
                                    <Image src="/cetus.webp" alt="Cetus Protocol" className="h-full w-full object-cover" width={1000} height={600} quality={100} priority />
                                </div>
                                <h3 className="mb-2 text-lg font-bold">Cetus Integration</h3>
                                <p className="text-sm text-muted-foreground">
                                    Real-time price oracles for bonding curve pricing, providing accurate market data for token sales.
                                </p>
                                <Badge variant="default" className="mt-4">
                                    Integrated
                                </Badge>
                            </div>
                            <div className="card-background rounded-lg border p-6">
                                <div className="mb-4 flex h-40 w-full items-center justify-center rounded-md bg-primary/10 overflow-hidden">
                                    <Image src="/pyth.jpg" alt="Pyth Network" className="h-full w-full object-cover" width={1280} height={720} quality={100} priority />
                                </div>
                                <h3 className="mb-2 text-lg font-bold">Pyth Network Integration</h3>
                                <p className="text-sm text-muted-foreground">
                                    Real-time price oracles for bonding curve pricing, providing accurate market data for token sales.
                                </p>
                                <Badge variant="outline" className="mt-4">
                                    Coming Soon
                                </Badge>
                            </div>
                            <div className="card-background rounded-lg border p-6">
                                <div className="mb-4 flex h-40 w-full items-center justify-center rounded-md bg-primary/10 overflow-hidden">
                                    <Image src="/uni.jpg" alt="UNI" className="h-full w-full object-cover" width={1262} height={624} quality={100} priority />
                                </div>
                                <h3 className="mb-2 text-lg font-bold">UNI Integration</h3>
                                <p className="text-sm text-muted-foreground">
                                    Support for meme token launches with UNI/SUI pools, perfect for community-driven projects.
                                </p>
                                <Badge variant="outline" className="mt-4">
                                    Coming Soon
                                </Badge>
                            </div>
                            <div className="card-background rounded-lg border p-6">
                                <div className="mb-4 flex h-40 w-full items-center justify-center rounded-md bg-primary/10 overflow-hidden">
                                    <Image src="/wormhole.jpg" alt="Cross-chain" className="h-full w-full object-cover" width={796} height={411} quality={100} priority />
                                </div>
                                <h3 className="mb-2 text-lg font-bold">Cross-Chain Support</h3>
                                <p className="text-sm text-muted-foreground">
                                    Expand launchpad capabilities to other chains via Wormhole, creating a multi-chain token ecosystem.
                                </p>
                                <Badge variant="outline" className="mt-4">
                                    Coming Soon
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ section */}
            <FaqsAndSupport />

        </React.Fragment>
    )
}

export default LandingPage