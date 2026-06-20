'use client'

interface DayData { date: string; visits: number }

interface VisitsChartProps {
  data: DayData[]
  height?: number
}

export function VisitsChart({ data, height = 160 }: VisitsChartProps) {
  if (!data.length) {
    return <div className="ta-empty"><p>No visit data yet.</p></div>
  }

  const max = Math.max(...data.map(d => d.visits), 1)
  const barWidth = Math.max(4, Math.floor(560 / data.length) - 2)
  const showLabel = data.length <= 14

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg
        width="100%"
        viewBox={`0 0 ${Math.max(data.length * (barWidth + 2), 560)} ${height + 40}`}
        style={{ display: 'block', minWidth: 320 }}
      >
        {data.map((d, i) => {
          const barH = Math.max(2, Math.round((d.visits / max) * height))
          const x = i * (barWidth + 2)
          const y = height - barH
          return (
            <g key={d.date}>
              <rect
                x={x} y={y}
                width={barWidth} height={barH}
                rx={3}
                fill="var(--ta-blue)"
                opacity={0.85}
              >
                <title>{`${d.date}: ${d.visits} visits`}</title>
              </rect>
              {showLabel && (
                <text
                  x={x + barWidth / 2} y={height + 16}
                  textAnchor="middle"
                  fontSize={9}
                  fill="var(--ta-gray-500)"
                >
                  {d.date.slice(5)} {/* MM-DD */}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
