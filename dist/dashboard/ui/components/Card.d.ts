import * as react from 'react';
import { ReactNode } from 'react';

interface CardProps {
    title: string;
    action?: ReactNode;
    children: ReactNode;
}
declare function Card({ title, action, children }: CardProps): react.JSX.Element;

export { Card };
