interface ProgressBadgeProps {
    percentComplete: number
}

export default function ProgressBadge({ percentComplete }: ProgressBadgeProps) {

    const formattedPercent = percentComplete.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });

    let bgColor = "bg-yellow-500/15"
    let textColor = "text-yellow-500"

    if (percentComplete >= 100) {
        bgColor = "bg-green-500/15"
        textColor = "text-green-500"
    } else if (percentComplete >= 75) {
        bgColor = "bg-teal-500/15"
        textColor = "text-teal-500"
    } else if (percentComplete >= 50) {
        bgColor = "bg-blue-500/15"
        textColor = "text-blue-500"
    }

    return (
        <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${bgColor} ${textColor}`}>
            {formattedPercent}% Funded
        </div>
    )
}
