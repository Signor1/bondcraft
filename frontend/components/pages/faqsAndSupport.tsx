import React from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronRight, Send } from "lucide-react"
import Link from "next/link"
import { Github } from "lucide-react"

export default function FaqsAndSupport() {
    return (
        <div className="container mx-auto py-20 md:px-8 px-4">
            <div className="mb-8 max-w-4xl mx-auto space-y-2">
                <h1 className="text-3xl  font-bold">FAQ & Support</h1>
                <p className="text-muted-foreground ">Frequently asked questions and support resources</p>
            </div>

            <div className="max-w-4xl w-full mx-auto grid">
                <div className="w-full">
                    <Tabs defaultValue="general" className="w-full">
                        <TabsList className="mb-4">
                            <TabsTrigger value="general">General</TabsTrigger>
                            <TabsTrigger value="creators">For Creators</TabsTrigger>
                            <TabsTrigger value="investors">For Investors</TabsTrigger>
                            <TabsTrigger value="technical">Technical</TabsTrigger>
                        </TabsList>

                        <TabsContent value="general">
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="what-is-bondcraft">
                                    <AccordionTrigger>What is BondCraft?</AccordionTrigger>
                                    <AccordionContent>
                                        <p className="text-muted-foreground">
                                            BondCraft is a decentralized token launchpad built on the Sui blockchain. It enables projects to
                                            create tokens, raise funding through a bonding curve mechanism, and bootstrap liquidity on Cetus
                                            Protocol. The platform provides a secure, transparent, and fair way for creators to launch tokens
                                            and for investors to participate in early-stage projects.
                                        </p>
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="how-it-works">
                                    <AccordionTrigger>How does BondCraft work?</AccordionTrigger>
                                    <AccordionContent>
                                        <p className="text-muted-foreground">BondCraft works through a simple process:</p>
                                        <ol className="list-decimal list-inside space-y-2 mt-2 text-muted-foreground">
                                            <li>
                                                <span className="font-medium text-foreground">Token Creation</span>: Creators set up token
                                                parameters and allocations
                                            </li>
                                            <li>
                                                <span className="font-medium text-foreground">Funding Phase</span>: Investors buy tokens through
                                                a bonding curve mechanism
                                            </li>
                                            <li>
                                                <span className="font-medium text-foreground">Close Funding</span>: Creator closes the funding
                                                phase when ready
                                            </li>
                                            <li>
                                                <span className="font-medium text-foreground">Liquidity Bootstrapping</span>: Creator creates a
                                                Cetus liquidity pool
                                            </li>
                                            <li>
                                                <span className="font-medium text-foreground">Token Distribution</span>: Tokens are distributed
                                                to creator, investors, and platform
                                            </li>
                                        </ol>
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="bonding-curve">
                                    <AccordionTrigger>What is a bonding curve?</AccordionTrigger>
                                    <AccordionContent>
                                        <p className="text-muted-foreground">
                                            A bonding curve is a mathematical curve that defines the price of a token based on the supply. In
                                            BondCraft, the price increases as more tokens are sold, following the formula:
                                        </p>
                                        <div className="my-2 p-3 bg-muted/20 rounded-md">
                                            <p className="font-mono text-center">price = k × tokens_sold ÷ 10^9</p>
                                        </div>
                                        <p className="text-muted-foreground">
                                            The parameter k is calculated based on the funding goal and the number of funding tokens. This
                                            mechanism ensures fair price discovery and protects early investors.
                                        </p>
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="fees">
                                    <AccordionTrigger>What are the fees?</AccordionTrigger>
                                    <AccordionContent>
                                        <p className="text-muted-foreground">
                                            BondCraft allocates a small percentage of the total token supply to the platform (the &quot;platform
                                            tokens&quot;). This is typically 10% of the total supply, but creators can adjust this allocation.
                                            There are no additional fees beyond this token allocation and the standard Sui network transaction
                                            fees.
                                        </p>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </TabsContent>

                        <TabsContent value="creators">
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="how-to-create">
                                    <AccordionTrigger>How do I create a launchpad?</AccordionTrigger>
                                    <AccordionContent>
                                        <p className="text-muted-foreground">To create a launchpad, follow these steps:</p>
                                        <ol className="list-decimal list-inside space-y-2 mt-2 text-muted-foreground">
                                            <li>Connect your Sui wallet</li>
                                            <li>Navigate to the &quot;Create Launchpad&quot; page</li>
                                            <li>Fill in your token details (name, symbol, etc.)</li>
                                            <li>Configure token allocations (funding, creator, liquidity, platform)</li>
                                            <li>Set your funding goal in USDC</li>
                                            <li>Submit the transaction and pay the Sui network fee</li>
                                        </ol>
                                        <div className="mt-4">
                                            <Link href="/create">
                                                <Button variant="outline" size="sm" className="gap-1">
                                                    Go to Create Launchpad <ChevronRight className="h-3 w-3" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="bootstrap-liquidity">
                                    <AccordionTrigger>How do I bootstrap liquidity?</AccordionTrigger>
                                    <AccordionContent>
                                        <p className="text-muted-foreground">
                                            After closing the funding phase, you can bootstrap liquidity by:
                                        </p>
                                        <ol className="list-decimal list-inside space-y-2 mt-2 text-muted-foreground">
                                            <li>Going to your launchpad&apos;s detail page</li>
                                            <li>Clicking the &quot;Bootstrap Liquidity&quot; button in the Creator Actions panel</li>
                                            <li>Signing the transaction with your wallet</li>
                                        </ol>
                                        <p className="mt-2 text-muted-foreground">
                                            This will create a TOKEN/USDC pool on Cetus Protocol with a 0.05% fee tier. The pool will be
                                            funded with the liquidity tokens allocation and a portion of the collected USDC.
                                        </p>
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="withdraw-funds">
                                    <AccordionTrigger>When can I withdraw funds?</AccordionTrigger>
                                    <AccordionContent>
                                        <p className="text-muted-foreground">
                                            You can withdraw the collected USDC after closing the funding phase. To do this:
                                        </p>
                                        <ol className="list-decimal list-inside space-y-2 mt-2 text-muted-foreground">
                                            <li>Navigate to your launchpad&apos;s detail page</li>
                                            <li>Click the &quot;Withdraw Funding&quot; button in the Creator Actions panel</li>
                                            <li>Enter the amount you wish to withdraw (or the maximum available)</li>
                                            <li>Sign the transaction with your wallet</li>
                                        </ol>
                                        <p className="mt-2 text-muted-foreground">
                                            Note that a portion of the collected USDC will be used to bootstrap liquidity, so not all funds
                                            will be available for withdrawal.
                                        </p>
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="claim-creator-tokens">
                                    <AccordionTrigger>How do creator tokens work?</AccordionTrigger>
                                    <AccordionContent>
                                        <p className="text-muted-foreground">
                                            Creator tokens are allocated to the project creator and are subject to vesting. The vesting period
                                            begins when the funding phase is closed. To claim your creator tokens:
                                        </p>
                                        <ol className="list-decimal list-inside space-y-2 mt-2 text-muted-foreground">
                                            <li>Wait for the vesting period to start (after closing funding)</li>
                                            <li>Navigate to your launchpad&apos;s detail page</li>
                                            <li>Click the &quot;Claim Creator Tokens&quot; button in the Creator Actions panel</li>
                                            <li>Sign the transaction with your wallet</li>
                                        </ol>
                                        <p className="mt-2 text-muted-foreground">
                                            Tokens are vested linearly over time, so you can claim portions of your allocation as they become
                                            available.
                                        </p>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </TabsContent>

                        <TabsContent value="investors">
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="how-to-buy">
                                    <AccordionTrigger>How do I buy tokens?</AccordionTrigger>
                                    <AccordionContent>
                                        <p className="text-muted-foreground">To buy tokens from a launchpad:</p>
                                        <ol className="list-decimal list-inside space-y-2 mt-2 text-muted-foreground">
                                            <li>Connect your Sui wallet</li>
                                            <li>Ensure you have enough USDC in your wallet</li>
                                            <li>Navigate to the launchpad&apos;s detail page</li>
                                            <li>Enter the amount of tokens you want to buy</li>
                                            <li>Click the &quot;Buy Tokens&quot; button</li>
                                            <li>Sign the transaction with your wallet</li>
                                        </ol>
                                        <p className="mt-2 text-muted-foreground">
                                            The tokens will be sent directly to your wallet. The price is determined by the bonding curve, so
                                            earlier buyers get a better price than later buyers.
                                        </p>
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="bonding-curve-investors">
                                    <AccordionTrigger>How does the bonding curve affect me as an investor?</AccordionTrigger>
                                    <AccordionContent>
                                        <p className="text-muted-foreground">The bonding curve has several implications for investors:</p>
                                        <ul className="list-disc list-inside space-y-2 mt-2 text-muted-foreground">
                                            <li>Early investors pay a lower price than later investors</li>
                                            <li>The price increases predictably as more tokens are sold</li>
                                            <li>
                                                Once liquidity is bootstrapped on Cetus, the market price may differ from the final bonding
                                                curve price
                                            </li>
                                        </ul>
                                        <p className="mt-2 text-muted-foreground">
                                            You can see the current price and the bonding curve visualization on each launchpad&apos;s detail page
                                            to make informed investment decisions.
                                        </p>
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="risks">
                                    <AccordionTrigger>What are the risks?</AccordionTrigger>
                                    <AccordionContent>
                                        <p className="text-muted-foreground">As with any investment, there are risks to consider:</p>
                                        <ul className="list-disc list-inside space-y-2 mt-2 text-muted-foreground">
                                            <li>Token price volatility after listing on Cetus</li>
                                            <li>Project execution risks (the project might not deliver on its promises)</li>
                                            <li>Smart contract risks (though BondCraft contracts are audited)</li>
                                            <li>Market liquidity risks (difficulty selling tokens if there&apos;s low trading volume)</li>
                                        </ul>
                                        <p className="mt-2 text-muted-foreground">
                                            Always do your own research (DYOR) before investing in any project. BondCraft provides
                                            transparency around token allocations and funding, but cannot guarantee project success.
                                        </p>
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="trade-tokens">
                                    <AccordionTrigger>How can I trade tokens after purchase?</AccordionTrigger>
                                    <AccordionContent>
                                        <p className="text-muted-foreground">
                                            After the launchpad enters the &quot;Bootstrapped&quot; phase, you can trade your tokens on Cetus Protocol:
                                        </p>
                                        <ol className="list-decimal list-inside space-y-2 mt-2 text-muted-foreground">
                                            <li>Navigate to the launchpad&apos;s detail page</li>
                                            <li>Click the &quot;View on Cetus&quot; link in the Timeline section</li>
                                            <li>Use the Cetus interface to swap tokens or add/remove liquidity</li>
                                        </ol>
                                        <p className="mt-2 text-muted-foreground">
                                            The tokens are standard Sui tokens and can be transferred or traded like any other token on the
                                            Sui ecosystem.
                                        </p>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </TabsContent>

                        <TabsContent value="technical">
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="contract-architecture">
                                    <AccordionTrigger>How do the smart contracts work?</AccordionTrigger>
                                    <AccordionContent>
                                        <p className="text-muted-foreground">BondCraft consists of four main smart contract modules:</p>
                                        <ul className="list-disc list-inside space-y-2 mt-2 text-muted-foreground">
                                            <li>
                                                <span className="font-mono text-foreground">factory.move</span>: Creates and manages launchpads
                                            </li>
                                            <li>
                                                <span className="font-mono text-foreground">launchpad.move</span>: Handles token sales, funding,
                                                and liquidity bootstrapping
                                            </li>
                                            <li>
                                                <span className="font-mono text-foreground">pool.move</span>: Interfaces with Cetus to create
                                                liquidity pools
                                            </li>
                                            <li>
                                                <span className="font-mono text-foreground">bonding_curve.move</span>: Calculates token prices
                                                based on the bonding curve formula
                                            </li>
                                        </ul>
                                        <p className="mt-2 text-muted-foreground">
                                            All contract code is open source and available on GitHub. The contracts emit events for all
                                            important actions, providing transparency and enabling off-chain tracking.
                                        </p>
                                        <div className="mt-4">
                                            <a href="https://github.com/bondcraft" target="_blank" rel="noopener noreferrer">
                                                <Button variant="outline" size="sm" className="gap-1">
                                                    View on GitHub <ChevronRight className="h-3 w-3" />
                                                </Button>
                                            </a>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="integrations">
                                    <AccordionTrigger>What integrations does BondCraft have?</AccordionTrigger>
                                    <AccordionContent>
                                        <p className="text-muted-foreground">BondCraft currently integrates with:</p>
                                        <ul className="list-disc list-inside space-y-2 mt-2 text-muted-foreground">
                                            <li>
                                                <span className="font-medium text-foreground">Cetus Protocol</span>: For liquidity bootstrapping
                                                and token trading
                                            </li>
                                            <li>
                                                <span className="font-medium text-foreground">Sui Wallet</span>: For transaction signing and
                                                token management
                                            </li>
                                        </ul>
                                        <p className="mt-2 text-muted-foreground">Planned integrations include:</p>
                                        <ul className="list-disc list-inside space-y-2 mt-2 text-muted-foreground">
                                            <li>
                                                <span className="font-medium text-foreground">Pyth Network</span>: For real-time price oracles
                                                (Q2 2025)
                                            </li>
                                            <li>
                                                <span className="font-medium text-foreground">UNI (Unicoinsui)</span>: For meme token launches
                                                (Q3 2025)
                                            </li>
                                            <li>
                                                <span className="font-medium text-foreground">Cross-chain support</span>: Via Wormhole (Q4 2025)
                                            </li>
                                        </ul>
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="security">
                                    <AccordionTrigger>How secure is BondCraft?</AccordionTrigger>
                                    <AccordionContent>
                                        <p className="text-muted-foreground">BondCraft prioritizes security through several measures:</p>
                                        <ul className="list-disc list-inside space-y-2 mt-2 text-muted-foreground">
                                            <li>Smart contracts are audited by independent security firms</li>
                                            <li>All contract functions have comprehensive access controls</li>
                                            <li>Events are emitted for all important actions, enabling transparency</li>
                                            <li>Tokens follow standard Sui token specifications</li>
                                            <li>No custody of user funds - all transactions happen on-chain</li>
                                        </ul>
                                        <p className="mt-2 text-muted-foreground">
                                            While we take every precaution to ensure security, smart contract risk can never be completely
                                            eliminated. Users should always exercise caution and not invest more than they can afford to lose.
                                        </p>
                                    </AccordionContent>
                                </AccordionItem>

                                <AccordionItem value="troubleshooting">
                                    <AccordionTrigger>Troubleshooting common issues</AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-4 text-muted-foreground">
                                            <div>
                                                <h4 className="font-medium text-foreground">Transaction failures</h4>
                                                <p>If your transaction fails, check:</p>
                                                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                                                    <li>Sufficient SUI balance for gas fees</li>
                                                    <li>Sufficient USDC balance when buying tokens</li>
                                                    <li>Correct permissions (e.g., only creator can close funding)</li>
                                                </ul>
                                            </div>

                                            <div>
                                                <h4 className="font-medium text-foreground">Wallet connection issues</h4>
                                                <p>If you&apos;re having trouble connecting your wallet:</p>
                                                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                                                    <li>Ensure you have a compatible Sui wallet installed</li>
                                                    <li>Try refreshing the page</li>
                                                    <li>Check that you&apos;re on the correct network (mainnet/testnet)</li>
                                                </ul>
                                            </div>

                                            <div>
                                                <h4 className="font-medium text-foreground">Missing tokens</h4>
                                                <p>If you don&apos;t see tokens in your wallet after purchase:</p>
                                                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                                                    <li>Verify the transaction completed successfully on Sui Explorer</li>
                                                    <li>Add the token to your wallet using the token ID</li>
                                                    <li>Check if your wallet supports viewing custom tokens</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* contact & support */}
            <div className="max-w-4xl mx-auto mt-28">
                <div className="w-full grid gap-8 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Contact Support</CardTitle>
                            <CardDescription>Have a question not answered in the FAQ? Reach out to us.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" placeholder="your@email.com" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="message">Message</Label>
                                    <textarea
                                        id="message"
                                        className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="Describe your issue or question..."
                                    ></textarea>
                                </div>
                                <Button className="w-full gap-2">
                                    <Send className="h-4 w-4" />
                                    Send Message
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Community Channels</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <a
                                    href="https://discord.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 rounded-md border p-3 hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                        <DiscordIcon className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium">Discord</h3>
                                        <p className="text-xs text-muted-foreground">Join our community server</p>
                                    </div>
                                </a>

                                <a
                                    href="https://x.com/BondCraftSui"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 rounded-md border p-3 hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                        <Twitter className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium">Twitter/X</h3>
                                        <p className="text-xs text-muted-foreground">Follow for updates</p>
                                    </div>
                                </a>

                                <a
                                    href="https://github.com/Signor1/bondcraft"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 rounded-md border p-3 hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                        <Github className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium">GitHub</h3>
                                        <p className="text-xs text-muted-foreground">View our open source code</p>
                                    </div>
                                </a>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
    return (
        <label
            htmlFor={htmlFor}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
            {children}
        </label>
    )
}

function DiscordIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="9" cy="12" r="1" />
            <circle cx="15" cy="12" r="1" />
            <path d="M7.5 7.5c3.5-1 5.5-1 9 0" />
            <path d="M7.5 16.5c3.5 1 5.5 1 9 0" />
            <path d="M15.5 17c0 1 1.5 3 2 3 1.5 0 2.833-1.667 3.5-3.5.5-1.5 1-4 1-7.5-.175-2.614-.84-5.307-1-6.5-.5-4-2-4.5-3-4.5-1.5 0-2 1-3.5 1-1.5 0-2-1-3.5-1-1 0-2.5.5-3 4.5-.16 1.193-.825 3.886-1 6.5 0 3.5.5 6 1 7.5.667 1.833 2 3.5 3.5 3.5.5 0 2-2 2-3" />
        </svg>
    )
}

function Twitter(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
        </svg>
    )
}
