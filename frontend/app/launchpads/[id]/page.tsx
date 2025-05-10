import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import PhaseBadge from "@/components/phase-badge"
import BondingCurveChart from "@/components/bonding-curve-chart"
import { Input } from "@/components/ui/input"
import { ArrowRight, ExternalLink, Clock, Coins, Users, ChevronRight } from "lucide-react"
import Image from "next/image"

interface PageProps {
    params: {
        id: string
    }
}

export default function LaunchpadDetailsPage({ params }: PageProps) {
    const launchpad = {
        id: params.id,
        name: "DegenCoin",
        symbol: "DEGEN",
        logoUrl: undefined,
        currentPrice: 0.000215,
        tokensSold: 3500000,
        fundingTokens: 5000000,
        totalSupply: 10000000,
        creatorTokens: 2000000,
        liquidityTokens: 2000000,
        platformTokens: 1000000,
        fundingGoal: 1000, // USDC
        fundingBalance: 752.5, // USDC collected so far
        vestingStartEpoch: null,
        k: 0.00000001,
        phase: "open" as "open" | "closed" | "bootstrapped",
        creator: "0x123...abc",
    }

    const percentComplete = Math.min(100, Math.round((launchpad.tokensSold / launchpad.fundingTokens) * 100))

    return (
        <div className="container mx-auto py-20 md:px-8 px-4">
            <div className="mb-8">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <a href="/launchpads" className="hover:text-primary">
                        Launchpads
                    </a>
                    <ChevronRight className="h-4 w-4" />
                    <span>{launchpad.name}</span>
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Left column: Launchpad details */}
                <div className="lg:col-span-2">
                    <div className="mb-6 flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                            {launchpad.logoUrl ? (
                                <Image
                                    src={launchpad.logoUrl || "/placeholder.svg"}
                                    alt={launchpad.symbol}
                                    className="h-12 w-12 rounded-full"
                                />
                            ) : (
                                <div className="text-xl font-bold text-primary">{launchpad.symbol.slice(0, 2)}</div>
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold">{launchpad.name}</h1>
                                <PhaseBadge phase={launchpad.phase} />
                            </div>
                            <p className="text-muted-foreground">${launchpad.symbol}</p>
                        </div>
                    </div>

                    <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center p-6">
                                <Coins className="mb-2 h-5 w-5 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">Current Price</p>
                                <p className="text-lg font-bold">${launchpad.currentPrice.toFixed(6)}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center p-6">
                                <Users className="mb-2 h-5 w-5 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">Tokens Sold</p>
                                <p className="text-lg font-bold">
                                    {launchpad.tokensSold.toLocaleString()} / {launchpad.fundingTokens.toLocaleString()}
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center p-6">
                                <Clock className="mb-2 h-5 w-5 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">Phase</p>
                                <p className="text-lg font-bold capitalize">{launchpad.phase}</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="mb-8">
                        <CardHeader>
                            <CardTitle className="text-xl">Bonding Curve</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-2 flex items-center justify-between">
                                <div>
                                    <span className="text-sm text-muted-foreground">k value: </span>
                                    <span className="font-medium">{launchpad.k}</span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <span>Price Oracle: </span>
                                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px]">Pyth Integration Coming Soon</span>
                                </div>
                            </div>
                            <BondingCurveChart
                                k={launchpad.k}
                                totalSupply={launchpad.fundingTokens}
                                tokensSold={launchpad.tokensSold}
                            />
                            <div className="mt-4 rounded-lg bg-muted/20 p-3 text-sm">
                                <p>
                                    <span className="font-medium">Bonding Curve Explained:</span> The price increases as more tokens are
                                    sold. The formula is: price = k × tokens_sold ÷ 10^9
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">Launchpad Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <h3 className="mb-4 font-medium">Token Allocations</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Total Supply</span>
                                            <span>{launchpad.totalSupply.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Funding Tokens</span>
                                            <span>{launchpad.fundingTokens.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Creator Tokens</span>
                                            <span>{launchpad.creatorTokens.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Liquidity Tokens</span>
                                            <span>{launchpad.liquidityTokens.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Platform Tokens</span>
                                            <span>{launchpad.platformTokens.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="mb-4 font-medium">Funding Information</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Funding Goal</span>
                                            <span>{launchpad.fundingGoal.toLocaleString()} USDC</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Funds Raised</span>
                                            <span>{launchpad.fundingBalance.toLocaleString()} USDC</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Progress</span>
                                            <span>{percentComplete}%</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Creator Address</span>
                                            <span className="font-mono text-xs">{launchpad.creator}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Vesting Start</span>
                                            <span>{launchpad.vestingStartEpoch || "Not set"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right column: Actions */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Buy Tokens</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <label htmlFor="token-amount">Token Amount</label>
                                        <span className="text-xs text-muted-foreground">Max: 1,000,000 per tx</span>
                                    </div>
                                    <Input id="token-amount" type="number" placeholder="0" className="font-mono" />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <label htmlFor="cost">Estimated Cost (USDC)</label>
                                        <span className="text-xs text-muted-foreground">Price: ${launchpad.currentPrice.toFixed(6)}</span>
                                    </div>
                                    <Input id="cost" type="text" placeholder="0.00" disabled className="font-mono" />
                                </div>

                                <Button className="w-full" size="lg">
                                    Buy Tokens
                                </Button>

                                <div className="rounded-lg bg-muted/20 p-3 text-sm">
                                    <p className="text-muted-foreground">
                                        Tokens will be sent directly to your connected wallet.
                                        <br />
                                        Max tokens per transaction: 1,000,000
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Timeline</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="relative">
                                <div className="absolute left-3 top-0 bottom-0 h-full w-px bg-border"></div>
                                <div className="space-y-6">
                                    <div className="relative pl-8">
                                        <div className="absolute left-0 top-1.5 h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                                            <div className="h-2 w-2 rounded-full bg-primary"></div>
                                        </div>
                                        <h4 className="font-medium">Launchpad Created</h4>
                                        <p className="text-sm text-muted-foreground">May 5, 2025 - 14:23:15 UTC</p>
                                    </div>
                                    {launchpad.phase === "open" && (
                                        <div className="relative pl-8">
                                            <div className="absolute left-0 top-1.5 h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                                                {launchpad.phase === "open" ? (
                                                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
                                                ) : (
                                                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                                                )}
                                            </div>
                                            <h4 className="font-medium">Funding Phase</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {launchpad.phase === "open" ? "In progress" : "Completed on May 12, 2025"}
                                            </p>
                                        </div>
                                    )}

                                    {launchpad.phase === "closed" && (
                                        <div className="relative pl-8">
                                            <div className="absolute left-0 top-1.5 h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                                                {launchpad.phase === "closed" ? (
                                                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
                                                ) : (
                                                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                                                )}
                                            </div>
                                            <h4 className="font-medium">Closed Funding</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {launchpad.phase === "closed" ? "Awaiting liquidity bootstrap" : "Completed on May 15, 2025"}
                                            </p>
                                        </div>
                                    )}
                                    {launchpad.phase === "bootstrapped" && (
                                        <div className="relative pl-8">
                                            <div className="absolute left-0 top-1.5 h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                                                <div className="h-2 w-2 rounded-full bg-primary"></div>
                                            </div>
                                            <h4 className="font-medium">Liquidity Bootstrapped</h4>
                                            <p className="text-sm text-muted-foreground">Completed on May 16, 2025</p>
                                            <div className="mt-2">
                                                <Button variant="outline" size="sm" className="gap-1 text-xs">
                                                    View on Cetus <ExternalLink className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Creator actions - would be conditionally rendered in a real app */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Creator Actions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <Button variant="outline" className="w-full justify-between">
                                    Close Funding <ArrowRight className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" className="w-full justify-between" disabled>
                                    Bootstrap Liquidity <ArrowRight className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" className="w-full justify-between" disabled>
                                    Claim Creator Tokens <ArrowRight className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" className="w-full justify-between" disabled>
                                    Withdraw Funding <ArrowRight className="h-4 w-4" />
                                </Button>
                                <div className="rounded-lg bg-muted/20 p-3 text-sm">
                                    <p className="text-muted-foreground">
                                        These actions are only available to the creator of this launchpad.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}