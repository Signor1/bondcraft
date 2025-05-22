import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import ProgressBadge from "./progress-badge"
import PhaseBadge from "./phase-badge"
import { Button } from "./ui/button"
import Image from "next/image"

export interface LaunchpadCardProps {
    id: string
    name: string
    symbol: string
    logoUrl?: string
    currentPrice: number
    tokensSold: number
    fundingTokens: number
    phase: "open" | "closed" | "bootstrapped"
    decimals: number
}

export default function LaunchpadCard({
    id,
    name,
    symbol,
    logoUrl,
    currentPrice,
    tokensSold,
    fundingTokens,
    phase
}: LaunchpadCardProps) {
    const percentComplete = Math.min(100, (tokensSold / fundingTokens) * 100);

    const formatNumber = (num: number, decimals: number = 2) => {
        return num.toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        });
    };

    return (
        <Card className="overflow-hidden transition-all hover:shadow-md">
            <CardContent className="p-6">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        {logoUrl ? (
                            <Image src={logoUrl || "/placeholder.svg"} alt={symbol} className="h-10 w-10 rounded-full" />
                        ) : (
                            <div className="text-lg font-bold text-primary">{symbol.slice(0, 2)}</div>
                        )}
                    </div>
                    <div>
                        <h3 className="font-bold">{name}</h3>
                        <p className="text-sm text-muted-foreground">${symbol}</p>
                    </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                    <PhaseBadge phase={phase} />
                    <ProgressBadge percentComplete={percentComplete} />
                </div>

                <div className="mt-4 space-y-2">
                    <div className="relative h-2 overflow-hidden rounded-full bg-muted">
                        <div className="absolute inset-y-0 left-0 bg-primary" style={{ width: `${percentComplete}%` }}></div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                            {tokensSold.toLocaleString()} /{" "}
                            {fundingTokens.toLocaleString()} Tokens
                        </span>
                        <span className="font-medium">
                            ${formatNumber(currentPrice, 6)} USDC
                        </span>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="p-4 pt-0">
                <Link href={`/launchpads/${id}`} className="w-full">
                    <Button variant="outline" className="w-full">
                        View Details
                    </Button>
                </Link>
            </CardFooter>
        </Card>
    )
}
