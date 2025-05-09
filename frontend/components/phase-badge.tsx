type PhaseType = "open" | "closed" | "bootstrapped"

interface PhaseBadgeProps {
    phase: PhaseType
}

export default function PhaseBadge({ phase }: PhaseBadgeProps) {
    let bgColor
    let textColor
    let label

    switch (phase) {
        case "open":
            bgColor = "bg-green-500/15"
            textColor = "text-green-500"
            label = "Open"
            break
        case "closed":
            bgColor = "bg-yellow-500/15"
            textColor = "text-yellow-500"
            label = "Closed"
            break
        case "bootstrapped":
            bgColor = "bg-blue-500/15"
            textColor = "text-blue-500"
            label = "Bootstrapped"
            break
    }

    return (
        <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${bgColor} ${textColor}`}>
            {label}
        </div>
    )
}
