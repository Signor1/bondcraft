"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "./mode-toggle"
import { Menu, X } from "lucide-react"
import { ConnectButton } from '@mysten/dapp-kit';
import Image from "next/image"
import logo from "@/public/logo.png"

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    return (
        <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
                <div className="flex items-center lg:gap-20 md:gap-12">
                    <Link href="/" className="flex items-center">
                        <div className="relative h-12 w-12">
                            <Image src={logo} alt="BondCraft Logo" className="h-full w-full" width={170} height={170} quality={100} priority />
                        </div>
                        <span className="hidden font-bold md:inline-block">BondCraft</span>
                    </Link>

                    <div className="hidden lg:flex md:gap-8">
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
                    <ConnectButton />
                    <ModeToggle />

                    <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>
                </div>
            </div>

            {/* Mobile menu */}
            {isMenuOpen && (
                <div className="container py-5 lg:hidden pl-5">
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
