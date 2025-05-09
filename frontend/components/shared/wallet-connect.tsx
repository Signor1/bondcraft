"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"

export default function WalletConnect() {
    const [isConnected, setIsConnected] = useState(false)
    const [walletAddress, setWalletAddress] = useState("")

    const handleConnect = () => {
        // Mock wallet connection - in real app would call Sui wallet
        setIsConnected(true)
        setWalletAddress("0x123...abc")
    }

    const handleDisconnect = () => {
        setIsConnected(false)
        setWalletAddress("")
    }

    if (!isConnected) {
        return (
            <Button onClick={handleConnect} className="gap-2">
                <Wallet className="h-4 w-4" />
                <span className="hidden sm:inline">Connect Wallet</span>
            </Button>
        )
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span className="font-medium">{walletAddress}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">Wallet</h4>
                        <p className="text-sm text-muted-foreground">Connected to Sui Wallet</p>
                    </div>
                    <div className="grid gap-2">
                        <div className="grid grid-cols-3 items-center gap-4">
                            <span className="text-sm">SUI</span>
                            <span className="col-span-2 font-medium">12.354</span>
                        </div>
                        <div className="grid grid-cols-3 items-center gap-4">
                            <span className="text-sm">USDC</span>
                            <span className="col-span-2 font-medium">258.00</span>
                        </div>
                    </div>
                    <Separator />
                    <Button variant="outline" onClick={handleDisconnect}>
                        Disconnect
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}
