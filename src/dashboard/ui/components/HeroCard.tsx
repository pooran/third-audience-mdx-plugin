import type { ReactNode } from 'react'

interface HeroCardProps {
  label: string
  value: string | number
  meta?: string
  color?: 'blue' | 'green' | 'orange' | 'teal'
  icon: ReactNode
}

export function HeroCard({ label, value, meta, color = 'blue', icon }: HeroCardProps) {
  return (
    <div className={`ta-hero-card ta-hero-card--${color}`}>
      <div className="ta-hero-icon">{icon}</div>
      <div>
        <div className="ta-hero-label">{label}</div>
        <div className="ta-hero-value">{value}</div>
        {meta && <div className="ta-hero-meta">{meta}</div>}
      </div>
    </div>
  )
}
