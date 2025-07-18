"use client"

import { useEffect, useRef } from "react"

interface BondingCurveChartProps {
    k: number
    totalSupply: number
    decimals: number
    tokensSold: number
    className?: string
}

export default function BondingCurveChart({ k, totalSupply, decimals, tokensSold, className = "" }: BondingCurveChartProps) {
    const svgRef = useRef<SVGSVGElement>(null)

    useEffect(() => {
        if (!svgRef.current) return

        const svg = svgRef.current
        const width = svg.clientWidth
        const height = svg.clientHeight

        // Clear previous content
        while (svg.firstChild) {
            svg.removeChild(svg.firstChild)
        }

        // Calculate points for the curve
        const points = []
        const steps = 100
        const maxX = totalSupply * 1.1 // Add some margin

        for (let i = 0; i <= steps; i++) {
            const xWholeTokens = (i / steps) * maxX;
            const y = calculatePrice(xWholeTokens, decimals, k);
            points.push({ x: xWholeTokens, y });
        }

        // Find max price for scaling
        const maxPrice = Math.max(...points.map((p) => p.y))

        // Scale functions
        const scaleX = (x: number) => (x / maxX) * width
        const scaleY = (y: number) => height - (y / maxPrice) * height

        // Create grid lines
        const grid = document.createElementNS("http://www.w3.org/2000/svg", "g")
        grid.setAttribute("class", "grid")

        // Horizontal grid lines
        for (let i = 0; i <= 5; i++) {
            const y = height - (i / 5) * height
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line")
            line.setAttribute("x1", "0")
            line.setAttribute("y1", y.toString())
            line.setAttribute("x2", width.toString())
            line.setAttribute("y2", y.toString())
            line.setAttribute("stroke", "rgba(255, 255, 255, 0.1)")
            line.setAttribute("stroke-width", "1")
            grid.appendChild(line)

            // Price label
            const price = (i / 5) * maxPrice
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text")
            text.setAttribute("x", "5")
            text.setAttribute("y", (y - 5).toString())
            text.setAttribute("fill", "rgba(255, 255, 255, 0.5)")
            text.setAttribute("font-size", "10")
            text.textContent = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 6,
                maximumFractionDigits: 6
            }).format(price)
            grid.appendChild(text)
        }

        // Vertical grid lines
        for (let i = 0; i <= 5; i++) {
            const x = (i / 5) * width
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line")
            line.setAttribute("x1", x.toString())
            line.setAttribute("y1", "0")
            line.setAttribute("x2", x.toString())
            line.setAttribute("y2", height.toString())
            line.setAttribute("stroke", "rgba(255, 255, 255, 0.1)")
            line.setAttribute("stroke-width", "1")
            grid.appendChild(line)

            // Token amount label
            const amount = (i / 5) * maxX
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text")
            text.setAttribute("x", (x + 5).toString())
            text.setAttribute("y", (height - 5).toString())
            text.setAttribute("fill", "rgba(255, 255, 255, 0.5)")
            text.setAttribute("font-size", "10")
            text.textContent = new Intl.NumberFormat('en-US', {
                style: 'decimal',
                maximumFractionDigits: 1,
                notation: 'compact'
            }).format(amount)
            grid.appendChild(text)
        }

        svg.appendChild(grid)

        // Create path for the curve
        const pathData = points
            .map((p, i) => {
                const x = scaleX(p.x)
                const y = scaleY(p.y)
                return `${i === 0 ? "M" : "L"} ${x} ${y}`
            })
            .join(" ")

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path")
        path.setAttribute("d", pathData)
        path.setAttribute("class", "curve-path")
        svg.appendChild(path)

        // Add current point
        if (tokensSold > 0) {
            const currentPrice = calculatePrice(tokensSold, decimals, k)
            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle")
            circle.setAttribute("cx", scaleX(tokensSold).toString())
            circle.setAttribute("cy", scaleY(currentPrice).toString())
            circle.setAttribute("class", "current-point")
            svg.appendChild(circle)

            // Add current price line
            const priceLine = document.createElementNS("http://www.w3.org/2000/svg", "line")
            priceLine.setAttribute("x1", "0")
            priceLine.setAttribute("y1", scaleY(currentPrice).toString())
            priceLine.setAttribute("x2", scaleX(tokensSold).toString())
            priceLine.setAttribute("y2", scaleY(currentPrice).toString())
            priceLine.setAttribute("stroke", "rgba(0, 196, 180, 0.5)")
            priceLine.setAttribute("stroke-width", "1")
            priceLine.setAttribute("stroke-dasharray", "4,4")
            svg.appendChild(priceLine)

            // Price Label
            const priceLabel = document.createElementNS("http://www.w3.org/2000/svg", "text")
            priceLabel.setAttribute("x", "5")
            priceLabel.setAttribute("y", (scaleY(currentPrice) - 5).toString())
            priceLabel.setAttribute("fill", "#00c4b4")
            priceLabel.setAttribute("font-size", "10")
            priceLabel.textContent = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 6,
                maximumFractionDigits: 6
            }).format(currentPrice)
            svg.appendChild(priceLabel)

            // Add current tokens sold line
            const tokensLine = document.createElementNS("http://www.w3.org/2000/svg", "line")
            tokensLine.setAttribute("x1", scaleX(tokensSold).toString())
            tokensLine.setAttribute("y1", scaleY(currentPrice).toString())
            tokensLine.setAttribute("x2", scaleX(tokensSold).toString())
            tokensLine.setAttribute("y2", height.toString())
            tokensLine.setAttribute("stroke", "rgba(0, 196, 180, 0.5)")
            tokensLine.setAttribute("stroke-width", "1")
            tokensLine.setAttribute("stroke-dasharray", "4,4")
            svg.appendChild(tokensLine)
        }
    }, [k, totalSupply, tokensSold, decimals])

    // Calculate price based on bonding curve
    function calculatePrice(tokensWhole: number, decimals: number, k: number): number {
        // Constants must match contract's SCALING_FACTOR (1e24)
        const SCALING_FACTOR = 1e24;

        // Convert whole tokens to base units for calculation
        const tokensBase = tokensWhole * (10 ** decimals);

        // Price formula: (k * tokens_base) / SCALING_FACTOR (in base USDC per base token)
        const priceBaseUSDC = (k * tokensBase) / SCALING_FACTOR;

        // Convert to USDC per whole token:
        // (base USDC / 1e6) / (base token / 1e9) = priceBaseUSDC * 1e3
        return priceBaseUSDC * 1000;
    }

    return (
        <div className={`bonding-curve-chart ${className}`}>
            <svg ref={svgRef} className="h-full w-full" preserveAspectRatio="none" />
        </div>
    )
}
