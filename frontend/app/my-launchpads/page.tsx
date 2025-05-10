"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import LaunchpadCard from "@/components/launchpad-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusCircle, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { myLaunchpads } from "@/utils/mockTokens"
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';

export default function MyLaunchpadsPage() {
    const account = useCurrentAccount();

    if (!account) {
        return (
            <div className="container mx-auto py-20 md:px-8 px-4">
                <Card className="mx-auto max-w-md">
                    <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                        <AlertTriangle className="mb-4 h-12 w-12 text-muted-foreground" />
                        <h2 className="mb-2 text-xl font-bold">Wallet Not Connected</h2>
                        <p className="mb-6 text-muted-foreground">Please connect your wallet to view your launchpads</p>
                        <ConnectButton />
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-20 md:px-8 px-4">
            <div className="mb-8 space-y-2">
                <h1 className="text-3xl font-bold">My Launchpads</h1>
                <p className="text-muted-foreground">Manage launchpads you&paos;ve created</p>
            </div>

            <Tabs defaultValue="all" className="mb-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <TabsList>
                        <TabsTrigger value="all">All Launchpads</TabsTrigger>
                        <TabsTrigger value="open">Open</TabsTrigger>
                        <TabsTrigger value="closed">Closed</TabsTrigger>
                        <TabsTrigger value="bootstrapped">Bootstrapped</TabsTrigger>
                    </TabsList>
                    <Link href="/create">
                        <Button className="gap-2">
                            <PlusCircle className="h-4 w-4" />
                            Create New Launchpad
                        </Button>
                    </Link>
                </div>

                <TabsContent value="all" className="mt-6">
                    {myLaunchpads.length > 0 ? (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {myLaunchpads.map((launchpad) => (
                                <LaunchpadCard key={launchpad.id} {...launchpad} />
                            ))}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                                <div className="mb-4 rounded-full bg-muted p-3">
                                    <AlertTriangle className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <h3 className="mb-2 text-lg font-medium">No Launchpads Found</h3>
                                <p className="mb-6 text-sm text-muted-foreground">You haven&apos;t created any launchpads yet.</p>
                                <Link href="/create">
                                    <Button>Create Your First Launchpad</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="open" className="mt-6">
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {myLaunchpads
                            .filter((l) => l.phase === "open")
                            .map((launchpad) => (
                                <LaunchpadCard key={launchpad.id} {...launchpad} />
                            ))}
                    </div>
                </TabsContent>

                <TabsContent value="closed" className="mt-6">
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {myLaunchpads
                            .filter((l) => l.phase === "closed")
                            .map((launchpad) => (
                                <LaunchpadCard key={launchpad.id} {...launchpad} />
                            ))}
                    </div>
                </TabsContent>

                <TabsContent value="bootstrapped" className="mt-6">
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {myLaunchpads
                            .filter((l) => l.phase === "bootstrapped")
                            .map((launchpad) => (
                                <LaunchpadCard key={launchpad.id} {...launchpad} />
                            ))}
                    </div>
                </TabsContent>
            </Tabs>

            <Card>
                <CardHeader>
                    <CardTitle>Creator Actions Reference</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <h3 className="font-medium">Open Phase</h3>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                <li>Monitor funding progress</li>
                                <li>Share your launchpad with potential investors</li>
                                <li>Close funding when ready</li>
                            </ul>
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-medium">Closed Phase</h3>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                <li>Bootstrap liquidity on Cetus</li>
                                <li>Claim creator tokens after vesting period</li>
                                <li>Withdraw collected USDC</li>
                            </ul>
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-medium">Bootstrapped Phase</h3>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                <li>Monitor pool performance on Cetus</li>
                                <li>Claim remaining creator tokens after vesting</li>
                                <li>Engage with your community</li>
                            </ul>
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-medium">Resources</h3>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                <li>
                                    <a href="/docs" className="text-primary hover:underline">
                                        Launchpad Documentation
                                    </a>
                                </li>
                                <li>
                                    <a href="/faq" className="text-primary hover:underline">
                                        Frequently Asked Questions
                                    </a>
                                </li>
                                <li>
                                    <a href="https://discord.com" className="text-primary hover:underline">
                                        Join our Discord for support
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}