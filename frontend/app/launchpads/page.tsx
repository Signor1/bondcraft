import { Suspense } from "react"
import Link from "next/link"
import LaunchpadCard from "@/components/launchpad-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, AlertTriangle } from "lucide-react"
import { mockLaunchpads } from "@/utils/mockTokens"

export default function LaunchpadsPage() {
    return (
        <div className="container mx-auto py-20 md:px-8 px-4">
            <div className="mb-8 space-y-2">
                <h1 className="text-3xl font-bold">Launchpads</h1>
                <p className="text-muted-foreground">Browse all token launchpads on BondCraft</p>
            </div>

            <div className="mb-8">
                <Card className="p-4">
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                        <div>
                            <Select defaultValue="all">
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Phases</SelectItem>
                                    <SelectItem value="open">Open</SelectItem>
                                    <SelectItem value="closed">Closed</SelectItem>
                                    <SelectItem value="bootstrapped">Bootstrapped</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Select defaultValue="all">
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Token Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="meme">Meme</SelectItem>
                                    <SelectItem value="defi">DeFi</SelectItem>
                                    <SelectItem value="gaming">Gaming</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Select defaultValue="funding">
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Sort By" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="funding">Funding Progress</SelectItem>
                                    <SelectItem value="newest">Newest</SelectItem>
                                    <SelectItem value="supply">Total Supply</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input type="search" placeholder="Search launchpads..." className="pl-10" />
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            <Suspense
                fallback={
                    <div className="flex h-32 items-center justify-center">
                        <div className="text-center">Loading launchpads...</div>
                    </div>
                }
            >
                {mockLaunchpads.length > 0 ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {mockLaunchpads.map((launchpad) => (
                            <LaunchpadCard key={launchpad.id} {...launchpad} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border border-dashed p-12 text-center">
                        <AlertTriangle className="h-12 w-12 text-muted-foreground" />
                        <h3 className="text-lg font-semibold">No Launchpads Found</h3>
                        <p className="text-sm text-muted-foreground">There are no launchpads matching your search criteria.</p>
                        <Link href="/create">
                            <Button className="mt-2">Create a Launchpad</Button>
                        </Link>
                    </div>
                )}
            </Suspense>

            <div className="mt-8 flex items-center justify-center">
                <Button variant="outline">Load More</Button>
            </div>
        </div>
    )
}