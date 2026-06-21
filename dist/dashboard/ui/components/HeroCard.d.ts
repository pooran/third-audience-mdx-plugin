import * as react from 'react';
import { ReactNode } from 'react';

interface HeroCardProps {
    label: string;
    value: string | number;
    meta?: string;
    color?: 'blue' | 'green' | 'orange' | 'teal';
    icon: ReactNode;
}
declare function HeroCard({ label, value, meta, color, icon }: HeroCardProps): react.JSX.Element;

export { HeroCard };
