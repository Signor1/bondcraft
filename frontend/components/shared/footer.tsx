import Link from "next/link"
import { Github, Twitter, DiscIcon as DiscordIcon } from "lucide-react"

export default function Footer() {
    return (
        <footer className="border-t bg-background py-6">
            <div className="container flex flex-col items-center gap-4 md:flex-row md:justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-sm font-medium">
                        BondCraft
                    </Link>
                    <span className="text-xs text-muted-foreground">Built on Sui</span>
                </div>

                <div className="flex items-center gap-4">
                    <Link href="/docs" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
                        Documentation
                    </Link>
                    <Link href="/terms" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
                        Terms
                    </Link>
                    <Link href="/faq" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
                        FAQ
                    </Link>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href="https://github.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <Github className="h-4 w-4" />
                        <span className="sr-only">GitHub</span>
                    </Link>
                    <Link
                        href="https://twitter.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <Twitter className="h-4 w-4" />
                        <span className="sr-only">Twitter</span>
                    </Link>
                    <Link
                        href="https://discord.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <DiscordIcon className="h-4 w-4" />
                        <span className="sr-only">Discord</span>
                    </Link>
                </div>
            </div>
        </footer>
    )
}
