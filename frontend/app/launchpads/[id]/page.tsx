'use client'

import { Button } from "@/components/ui/button"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import PhaseBadge from "@/components/phase-badge"
import BondingCurveChart from "@/components/bonding-curve-chart"
import { Input } from "@/components/ui/input"
import { ArrowRight, ExternalLink, Clock, Coins, Users, ChevronRight } from "lucide-react"
import Image from "next/image"
import useGetLaunchpadDetails from "@/hooks/useGetLaunchpadDetails"
import { useEffect, useState } from "react"
import useBuyToken from "@/hooks/useBuyToken"
import useCloseFunding from "@/hooks/useCloseFunding"
import useClaimCreatorTokens from "@/hooks/useClaimCreatorTokens"
import useClaimPlatformTokens from "@/hooks/useClaimPlatformTokens"
import useWithdrawFunding from "@/hooks/useWithdrawFunding"
import { Label } from "@/components/ui/label"
import useBootstrapLiquidity from "@/hooks/useBootstrapLiquidity"


interface PageProps {
    params: {
        id: string
    }
}

export default function LaunchpadDetailsPage({ params }: PageProps) {
    const { launchpad, isLoading, isError, error, refetch } = useGetLaunchpadDetails(params.id)
    const [estimatedCost, setEstimatedCost] = useState("0.00")
    const [tokenAmount, setTokenAmount] = useState(0)
    const [withdrawAmount, setWithdrawAmount] = useState(0)

    // Calculate estimated cost when token amount changes
    useEffect(() => {
        if (launchpad && tokenAmount > 0) {
            const currentPrice = launchpad.currentPrice || 0
            const cost = currentPrice * tokenAmount
            setEstimatedCost(cost.toFixed(6))
        } else {
            setEstimatedCost("0.00")
        }
    }, [tokenAmount, launchpad])

    // Handle token amount input change
    const handleTokenAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value) || 0
        setTokenAmount(value)
    }

    const handleWithdrawAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value) || 0
        setWithdrawAmount(value)
    }

    const handleTokenPurchase = useBuyToken()
    const handlePhaseClose = useCloseFunding()
    const handleCreatorTokenClaim = useClaimCreatorTokens()
    const handlePlatformTokenClaim = useClaimPlatformTokens()
    const handleWithdrawFromFundingBalance = useWithdrawFunding()
    const handleLiquidityBootstrap = useBootstrapLiquidity()

    const handleBuyTokens = async () => {
        console.log(launchpad?.coinType);
        await handleTokenPurchase({
            launchpadId: params.id,
            tokenAmount,
            estimatedCost,
            typeOfCoin: launchpad?.coinType || "",
        })
        refetch()
        setTokenAmount(0)
    }

    const handleCloseFunding = async () => {
        await handlePhaseClose({
            launchpadId: params.id,
            typeOfCoin: launchpad?.coinType || "",
        })
        refetch()
    }

    const handleClaimCreatorTokens = async () => {
        await handleCreatorTokenClaim({
            launchpadId: params.id,
            typeOfCoin: launchpad?.coinType || "",
        })
        refetch()
    }

    const handleClaimPlatformTokens = async () => {
        await handlePlatformTokenClaim({
            launchpadId: params.id,
            typeOfCoin: launchpad?.coinType || "",
        })
        refetch()
    }

    const handleWithdraw = async () => {
        await handleWithdrawFromFundingBalance({
            launchpadId: params.id,
            tokenAmount: withdrawAmount,
            typeOfCoin: launchpad?.coinType || "",
        })
        refetch()
        setWithdrawAmount(0)
    }

    const handleBootstrapLiquidity = async () => {
        await handleLiquidityBootstrap({
            launchpadId: params.id,
            tokenMetadataId: launchpad?.metadataId || "",
            typeOfCoin: launchpad?.coinType || "",
        })
        refetch()
    }


    if (isLoading) {
        return (
            <div className="container mx-auto py-20 md:px-8 px-4">
                <div className="flex h-64 items-center justify-center">
                    <div className="text-center">Loading launchpad details...</div>
                </div>
            </div>
        )
    }

    if (isError || !launchpad) {
        return (
            <div className="container mx-auto py-20 md:px-8 px-4">
                <div className="flex flex-col h-64 items-center justify-center space-y-4">
                    <h3 className="text-lg font-semibold">Error Loading Launchpad</h3>
                    <p className="text-sm text-muted-foreground">
                        {error instanceof Error ? error.message : "An unknown error occurred."}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        We couldn&apos;t load the launchpad details. Please try again later.
                    </p>
                    <Button onClick={() => refetch()}>Retry</Button>
                </div>
            </div>
        )
    }

    const percentComplete = Math.min(100, Math.round((launchpad.state.tokensSold / launchpad.params.fundingTokens) * 100))

    return (
        <div className="container mx-auto py-20 md:px-8 px-4">
            <div className="mb-8">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <a href="/launchpads" className="hover:text-primary">
                        Launchpads
                    </a>
                    <ChevronRight className="h-4 w-4" />
                    <span>{launchpad.metadata.name}</span>
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Left column: Launchpad details */}
                <div className="lg:col-span-2">
                    <div className="mb-6 flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                            {launchpad.metadata.logoUrl ? (
                                <Image
                                    src={launchpad.metadata.logoUrl || "/placeholder.svg"}
                                    alt={launchpad.metadata.symbol}
                                    className="h-12 w-12 rounded-full"
                                    width={48}
                                    height={48}
                                />
                            ) : (
                                <div className="text-xl font-bold text-primary">{launchpad.metadata.symbol.slice(0, 2)}</div>
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold">{launchpad.metadata.name}</h1>
                                <PhaseBadge phase={launchpad.phaseStr} />
                            </div>
                            <p className="text-muted-foreground">${launchpad.metadata.symbol}</p>
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
                                    {launchpad.state.tokensSold.toLocaleString()} /
                                    {launchpad.params.fundingTokens.toLocaleString()}
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center p-6">
                                <Clock className="mb-2 h-5 w-5 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">Phase</p>
                                <p className="text-lg font-bold capitalize">{launchpad.phaseStr}</p>
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
                                    <span className="font-medium">{launchpad.params.k}</span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <span>Price Oracle: </span>
                                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px]">Pyth Integration Coming Soon</span>
                                </div>
                            </div>
                            <BondingCurveChart
                                k={launchpad.params.k}
                                totalSupply={launchpad.params.totalSupply}
                                decimals={launchpad.params.decimals}
                                tokensSold={launchpad.state.tokensSold}
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
                                            <span>{launchpad.params.totalSupply.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Funding Tokens</span>
                                            <span>{launchpad.params.fundingTokens.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Creator Tokens</span>
                                            <span>{launchpad.params.creatorTokens.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Liquidity Tokens</span>
                                            <span>{launchpad.params.liquidityTokens.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Platform Tokens</span>
                                            <span>{launchpad.params.platformTokens.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="mb-4 font-medium">Funding Information</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Funding Goal</span>
                                            <span>{launchpad.params.fundingGoal.toLocaleString()} USDC</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Funds Raised</span>
                                            <span>{launchpad.fundingBalance.toLocaleString()} USDC</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Progress</span>
                                            <span>{percentComplete}%</span>
                                        </div>
                                        <div className="flex justify-between  w-full">
                                            <span className="text-sm text-muted-foreground">Creator Address</span>
                                            <span className="font-mono truncate w-full overflow-hidden text-ellipsis text-xs">{launchpad.creator}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Vesting Start</span>
                                            <span>{launchpad.vestingStartEpoch || "Funding goal not met"}</span>
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
                                        <span className="text-xs text-muted-foreground">Max: 1,000 per tx</span>
                                    </div>
                                    <Input id="token-amount" type="number" placeholder="0" className="font-mono" value={tokenAmount || ""}
                                        onChange={handleTokenAmountChange} min="0"
                                        max="1000" />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <label htmlFor="cost">Estimated Cost (USDC)</label>
                                        <span className="text-xs text-muted-foreground">Price: ${launchpad.currentPrice.toFixed(6)}</span>
                                    </div>
                                    <Input id="cost" type="text" placeholder="0.00" disabled className="font-mono" value={estimatedCost} />
                                </div>

                                <Button onClick={handleBuyTokens} className="w-full" size="lg" disabled={tokenAmount <= 0 || tokenAmount > 1000000 || launchpad.phaseStr !== "open"}>
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
                                        <p className="text-sm text-muted-foreground">May 21, 2025 - 14:23:15 UTC</p>
                                    </div>
                                    {launchpad.phaseStr === "open" && (
                                        <div className="relative pl-8">
                                            <div className="absolute left-0 top-1.5 h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                                                {launchpad.phaseStr === "open" ? (
                                                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
                                                ) : (
                                                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                                                )}
                                            </div>
                                            <h4 className="font-medium">Funding Phase</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {launchpad.phaseStr === "open" ? "In progress" : "Completed"}
                                            </p>
                                        </div>
                                    )}

                                    {launchpad.phaseStr === "closed" && (
                                        <div className="relative pl-8">
                                            <div className="absolute left-0 top-1.5 h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                                                {launchpad.phaseStr === "closed" ? (
                                                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
                                                ) : (
                                                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                                                )}
                                            </div>
                                            <h4 className="font-medium">Closed Funding</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {launchpad.phaseStr === "closed" ? "Awaiting liquidity bootstrap" : "Completed"}
                                            </p>
                                        </div>
                                    )}
                                    {launchpad.phaseStr === "bootstrapped" && (
                                        <div className="relative pl-8">
                                            <div className="absolute left-0 top-1.5 h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                                                <div className="h-2 w-2 rounded-full bg-primary"></div>
                                            </div>
                                            <h4 className="font-medium">Liquidity Bootstrapped</h4>
                                            <p className="text-sm text-muted-foreground">Completed</p>
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

                    {/* Creator actions - conditionally rendered if user is creator */}

                    <Card>
                        <CardHeader>
                            <CardTitle>Creator Actions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {/* Close funding */}
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-between"
                                            disabled={launchpad.phaseStr !== "open"}
                                        >
                                            Close Funding <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This will permanently close the phase and stop the fundraising process.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleCloseFunding}>Continue</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>

                                {/* Bootstrap liquidity */}
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-between"
                                            disabled={launchpad.phaseStr !== "closed"}
                                        >
                                            Bootstrap Liquidity <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This action would send the allocated tokens to the liquidity pool.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleBootstrapLiquidity}>Continue</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>


                                {/* Claim creator tokens */}
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-between"
                                            disabled={launchpad.phaseStr !== "closed"}
                                        >
                                            Claim Creator Tokens <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This action is done once after the launchpad is closed.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleClaimCreatorTokens}>Continue</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>

                                {/* Withdraw funding */}
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-between"
                                            disabled={launchpad.phaseStr !== "bootstrapped"}
                                        >
                                            Withdraw Funding <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[425px]">
                                        <DialogHeader>
                                            <DialogTitle>Withdrawal</DialogTitle>
                                            <DialogDescription>
                                                You can only withdraw after bootstrapping liquidity. USDC withdrawal is from the funding balance.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="w-full grid py-4 px-3">
                                            <div className="w-full items-center gap-4">
                                                <Label htmlFor="name" className="block mb-2">
                                                    Withdrawal Amount
                                                </Label>
                                                <Input id="name" type="number" placeholder="0" className="font-mono w-full" value={withdrawAmount || ""}
                                                    onChange={handleWithdrawAmountChange} />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button type="button" size="lg" className="w-full" onClick={handleWithdraw}>Withdraw</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>


                                {/* Claim platform tokens */}
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-between"
                                            disabled={launchpad.phaseStr !== "closed"}
                                        >
                                            Claim Platform Tokens <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This action is done once after the launchpad is closed.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleClaimPlatformTokens}>Continue</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>

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
        </div >
    )
}