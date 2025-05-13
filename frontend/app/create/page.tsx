"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { HelpCircle, Check, AlertTriangle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"


const formSchema = z.object({
    tokenName: z.string().min(1, { message: "Token name is required" }),
    tokenSymbol: z.string().min(1, { message: "Token symbol is required" }),
    decimals: z
        .number()
        .min(6, { message: "Decimals must be at least 6" })
        .max(18, { message: "Decimals cannot exceed 18" }),
    totalSupply: z.number().min(1000000, { message: "Total supply must be at least 1,000,000" }),
    fundingTokens: z.number().min(1, { message: "Funding tokens must be greater than 0" }),
    creatorTokens: z.number().min(1, { message: "Creator tokens must be greater than 0" }),
    liquidityTokens: z.number().min(1, { message: "Liquidity tokens must be greater than 0" }),
    platformTokens: z.number().min(1, { message: "Platform tokens must be greater than 0" }),
    fundingGoal: z.number().min(100, { message: "Funding goal must be at least 100 USDC" }),
    platformAdmin: z.string().optional(),
})

export default function CreatePage() {
    const [successDialog, setSuccessDialog] = useState(false)
    const [previewK, setPreviewK] = useState(0.00000001)
    const [previewPrice, setPreviewPrice] = useState(0.000001)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            tokenName: "",
            tokenSymbol: "",
            decimals: 9,
            totalSupply: 10000000,
            fundingTokens: 5000000,
            creatorTokens: 2000000,
            liquidityTokens: 2000000,
            platformTokens: 1000000,
            fundingGoal: 1000,
            platformAdmin: "",
        },
    })

    const watchTotalSupply = form.watch("totalSupply")
    const watchFundingTokens = form.watch("fundingTokens")
    const watchCreatorTokens = form.watch("creatorTokens")
    const watchLiquidityTokens = form.watch("liquidityTokens")
    const watchPlatformTokens = form.watch("platformTokens")
    const watchFundingGoal = form.watch("fundingGoal")

    // Calculate sum of allocations
    const totalAllocations = watchFundingTokens + watchCreatorTokens + watchLiquidityTokens + watchPlatformTokens

    // Calculate k and initial price
    const calculateK = (fundingGoal: number, fundingTokens: number) => {
        return (fundingGoal * 1e9) / (fundingTokens * fundingTokens)
    }

    const calculateInitialPrice = (k: number) => {
        return k * 0.000001 // Very small number of tokens sold initially
    }

    // Update preview values when form changes
    const updatePreview = () => {
        if (watchFundingGoal > 0 && watchFundingTokens > 0) {
            const k = calculateK(watchFundingGoal, watchFundingTokens)
            const initialPrice = calculateInitialPrice(k)
            setPreviewK(k)
            setPreviewPrice(initialPrice)
        }
    }

    // Update preview when relevant values change
    useState(() => {
        updatePreview()
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        // This would call the Sui blockchain in a real implementation
        console.log(values)

        // Show success dialog
        setSuccessDialog(true)
    }

    return (
        <div className="container mx-auto py-20 md:px-8 px-4">
            <div className="mb-8 space-y-2">
                <h1 className="text-3xl font-bold">Create Launchpad</h1>
                <p className="text-muted-foreground">Launch your token on the Sui blockchain</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Launchpad Configuration</CardTitle>
                        <CardDescription>Configure your token and launchpad parameters</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="basic" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                                <TabsTrigger value="allocations">Token Allocations</TabsTrigger>
                                <TabsTrigger value="funding">Funding</TabsTrigger>
                            </TabsList>

                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                                    <TabsContent value="basic" className="space-y-4">
                                        <div className="grid gap-4 py-4">
                                            <FormField
                                                control={form.control}
                                                name="tokenName"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Token Name</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="My Token" {...field} />
                                                        </FormControl>
                                                        <FormDescription>The full name of your token (e.g., &quot;Sui Finance&quot;)</FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="tokenSymbol"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Token Symbol</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="TKN" {...field} />
                                                        </FormControl>
                                                        <FormDescription>A short ticker symbol for your token (e.g., &quot;SFI&quot;)</FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="decimals"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Decimals</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                min={6}
                                                                max={18}
                                                                {...field}
                                                                onChange={(e) => field.onChange(Number.parseInt(e.target.value))}
                                                            />
                                                        </FormControl>
                                                        <FormDescription>Number of decimal places (minimum 6, default 9)</FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />


                                        </div>
                                    </TabsContent>

                                    <TabsContent value="allocations" className="space-y-4">
                                        <div className="grid gap-4 py-4">
                                            <FormField
                                                control={form.control}
                                                name="totalSupply"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Total Supply</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                min={1000000}
                                                                {...field}
                                                                onChange={(e) => field.onChange(Number.parseInt(e.target.value))}
                                                            />
                                                        </FormControl>
                                                        <FormDescription>The total number of tokens to be created</FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <FormLabel className="flex items-center gap-1">
                                                        Funding Tokens
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p className="w-60">Tokens available for public sale during the funding phase</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </FormLabel>
                                                    <span className="text-sm">
                                                        {watchFundingTokens.toLocaleString()} tokens (
                                                        {Math.round((watchFundingTokens / watchTotalSupply) * 100)}%)
                                                    </span>
                                                </div>
                                                <Slider
                                                    value={[watchFundingTokens]}
                                                    max={watchTotalSupply}
                                                    step={100000}
                                                    onValueChange={(value) => form.setValue("fundingTokens", value[0])}
                                                />
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <FormLabel className="flex items-center gap-1">
                                                        Creator Tokens
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p className="w-60">Tokens allocated to the creator, subject to vesting</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </FormLabel>
                                                    <span className="text-sm">
                                                        {watchCreatorTokens.toLocaleString()} tokens (
                                                        {Math.round((watchCreatorTokens / watchTotalSupply) * 100)}%)
                                                    </span>
                                                </div>
                                                <Slider
                                                    value={[watchCreatorTokens]}
                                                    max={watchTotalSupply}
                                                    step={100000}
                                                    onValueChange={(value) => form.setValue("creatorTokens", value[0])}
                                                />
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <FormLabel className="flex items-center gap-1">
                                                        Liquidity Tokens
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p className="w-60">Tokens allocated for the initial liquidity pool on Cetus</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </FormLabel>
                                                    <span className="text-sm">
                                                        {watchLiquidityTokens.toLocaleString()} tokens (
                                                        {Math.round((watchLiquidityTokens / watchTotalSupply) * 100)}%)
                                                    </span>
                                                </div>
                                                <Slider
                                                    value={[watchLiquidityTokens]}
                                                    max={watchTotalSupply}
                                                    step={100000}
                                                    onValueChange={(value) => form.setValue("liquidityTokens", value[0])}
                                                />
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <FormLabel className="flex items-center gap-1">
                                                        Platform Tokens
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p className="w-60">Tokens allocated to the BondCraft platform</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </FormLabel>
                                                    <span className="text-sm">
                                                        {watchPlatformTokens.toLocaleString()} tokens (
                                                        {Math.round((watchPlatformTokens / watchTotalSupply) * 100)}%)
                                                    </span>
                                                </div>
                                                <Slider
                                                    value={[watchPlatformTokens]}
                                                    max={watchTotalSupply}
                                                    step={100000}
                                                    onValueChange={(value) => form.setValue("platformTokens", value[0])}
                                                />
                                            </div>

                                            {totalAllocations !== watchTotalSupply && (
                                                <div className="rounded-lg bg-destructive/10 p-3 text-destructive flex items-center gap-2">
                                                    <AlertTriangle className="h-4 w-4" />
                                                    <p className="text-sm">
                                                        Total allocations ({totalAllocations.toLocaleString()}) must equal the total supply (
                                                        {watchTotalSupply.toLocaleString()})
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="funding" className="space-y-4">
                                        <div className="grid gap-4 py-4">
                                            <FormField
                                                control={form.control}
                                                name="fundingGoal"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Funding Goal (USDC)</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                min={100}
                                                                {...field}
                                                                onChange={(e) => {
                                                                    field.onChange(Number.parseInt(e.target.value))
                                                                    updatePreview()
                                                                }}
                                                            />
                                                        </FormControl>
                                                        <FormDescription>The amount of USDC you want to raise</FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="platformAdmin"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Platform Admin (Optional)</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="0x..." {...field} value={field.value || ""} />
                                                        </FormControl>
                                                        <FormDescription>
                                                            The address that can claim platform tokens (defaults to creator)
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </TabsContent>

                                    <div className="flex justify-end">
                                        <Button type="submit" size="lg" disabled={totalAllocations !== watchTotalSupply}>
                                            Create Launchpad
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </Tabs>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Launchpad Preview</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                        <span className="text-sm font-bold text-primary">
                                            {form.watch("tokenSymbol")?.slice(0, 2) || "TK"}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold">{form.watch("tokenName") || "My Token"}</h3>
                                        <p className="text-sm text-muted-foreground">${form.watch("tokenSymbol") || "TKN"}</p>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Initial Price</span>
                                        <span className="font-mono text-sm">${previewPrice.toFixed(9)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Bonding Curve k</span>
                                        <span className="font-mono text-sm">{previewK.toExponential(8)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Total Supply</span>
                                        <span>{form.watch("totalSupply")?.toLocaleString() || "0"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Funding Goal</span>
                                        <span>{form.watch("fundingGoal")?.toLocaleString() || "0"} USDC</span>
                                    </div>
                                </div>

                                <div className="rounded-lg bg-muted/20 p-3 text-sm">
                                    <h4 className="font-medium mb-1">How the bonding curve works:</h4>
                                    <p className="text-muted-foreground">
                                        The price increases as more tokens are sold, following:
                                        <br />
                                        price = k × tokens_sold ÷ 10^9
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Launchpad Process</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ol className="space-y-4 list-decimal list-inside text-sm">
                                <li className="text-muted-foreground">
                                    <span className="text-foreground font-medium">Create Launchpad</span>: Configure token parameters and
                                    deploy
                                </li>
                                <li className="text-muted-foreground">
                                    <span className="text-foreground font-medium">Funding Phase</span>: Users buy tokens via the bonding
                                    curve
                                </li>
                                <li className="text-muted-foreground">
                                    <span className="text-foreground font-medium">Close Funding</span>: Creator closes the funding phase
                                </li>
                                <li className="text-muted-foreground">
                                    <span className="text-foreground font-medium">Bootstrap Liquidity</span>: Creator creates a Cetus
                                    liquidity pool
                                </li>
                                <li className="text-muted-foreground">
                                    <span className="text-foreground font-medium">Token Distribution</span>: Creator/platform can claim
                                    their tokens
                                </li>
                            </ol>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Success dialog */}
            <Dialog open={successDialog} onOpenChange={setSuccessDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Check className="h-5 w-5 text-green-500" />
                            Launchpad Created Successfully
                        </DialogTitle>
                        <DialogDescription>Your launchpad has been created on the Sui blockchain</DialogDescription>
                    </DialogHeader>
                    <div className="bg-muted/20 p-4 rounded-lg">
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Launchpad ID</span>
                                <span className="font-mono text-xs">0x123abc456def789ghi</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Transaction Hash</span>
                                <span className="font-mono text-xs">0x789ghi123abc456def</span>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSuccessDialog(false)}>
                            Close
                        </Button>
                        <Button asChild>
                            <a href="/launchpads/new-id">View Launchpad</a>
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}