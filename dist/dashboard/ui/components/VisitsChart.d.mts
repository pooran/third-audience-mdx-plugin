import * as react from 'react';

interface DayData {
    date: string;
    visits: number;
}
interface VisitsChartProps {
    data: DayData[];
    height?: number;
}
declare function VisitsChart({ data, height }: VisitsChartProps): react.JSX.Element;

export { VisitsChart };
