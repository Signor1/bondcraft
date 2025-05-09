"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "./mode-toggle"
import { Menu, X } from "lucide-react"
import WalletConnect from "./wallet-connect"

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    return (
        <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
            <div className="container flex h-16 items-center justify-between">
                <div className="flex items-center gap-6">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="relative h-8 w-8">
                            <div className="absolute inset-0 rounded-full bg-primary opacity-20"></div>
                            <span className="relative flex h-full w-full items-center justify-center font-bold text-primary">BC</span>
                        </div>
                        <span className="hidden font-bold sm:inline-block">BondCraft</span>
                    </Link>

                    <div className="hidden md:flex md:gap-6">
                        <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">
                            Home
                        </Link>
                        <Link href="/launchpads" className="text-sm font-medium transition-colors hover:text-primary">
                            Launchpads
                        </Link>
                        <Link href="/create" className="text-sm font-medium transition-colors hover:text-primary">
                            Create Launchpad
                        </Link>
                        <Link href="/my-launchpads" className="text-sm font-medium transition-colors hover:text-primary">
                            My Launchpads
                        </Link>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <WalletConnect />
                    <ModeToggle />

                    <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>
                </div>
            </div>

            {/* Mobile menu */}
            {isMenuOpen && (
                <div className="container pb-4 md:hidden">
                    <div className="flex flex-col space-y-3">
                        <Link
                            href="/"
                            className="py-2 text-sm font-medium transition-colors hover:text-primary"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Home
                        </Link>
                        <Link
                            href="/launchpads"
                            className="py-2 text-sm font-medium transition-colors hover:text-primary"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Launchpads
                        </Link>
                        <Link
                            href="/create"
                            className="py-2 text-sm font-medium transition-colors hover:text-primary"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Create Launchpad
                        </Link>
                        <Link
                            href="/my-launchpads"
                            className="py-2 text-sm font-medium transition-colors hover:text-primary"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            My Launchpads
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    )
}
