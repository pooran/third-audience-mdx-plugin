import type { ReactNode } from 'react'

interface CardProps {
  title: string
  action?: ReactNode
  children: ReactNode
}

export function Card({ title, action, children }: CardProps) {
  return (
    <div className="ta-card ta-section">
      <div className="ta-card-header">
        <h2>{title}</h2>
        {action}
      </div>
      <div className="ta-card-body">{children}</div>
    </div>
  )
}
