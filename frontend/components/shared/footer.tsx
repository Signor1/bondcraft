import Link from "next/link"
import { Github, Twitter } from "lucide-react"
import Image from "next/image"
import logo from "@/public/logo.png"

export default function Footer() {
    return (
        <footer className="border-t bg-background py-6 px-5">
            <div className="container mx-auto flex flex-col items-center gap-4 md:flex-row md:justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/" className="flex items-center">
                        <div className="relative h-8 w-8">
                            <Image src={logo} alt="BondCraft Logo" className="h-full w-full" width={170} height={170} quality={100} priority />
                        </div>
                        <span className="text-sm font-medium">BondCraft</span>
                    </Link>
                    <span className="text-xs text-muted-foreground">Built on Sui</span>
                </div>

                <div className="flex items-center gap-4">
                    <Link href="/" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
                        Documentation
                    </Link>
                    <Link href="/" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
                        Terms
                    </Link>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href="https://github.com/Signor1/bondcraft"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <Github className="h-4 w-4" />
                        <span className="sr-only">GitHub</span>
                    </Link>
                    <Link
                        href="https://x.com/BondCraftSui"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <Twitter className="h-4 w-4" />
                        <span className="sr-only">Twitter</span>
                    </Link>
                </div>
            </div>
        </footer>
    )
}
