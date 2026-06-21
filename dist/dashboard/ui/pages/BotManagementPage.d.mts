import * as react from 'react';

interface BotConfig {
    allowlist: string[];
    blocklist: string[];
    track_unknown: boolean;
}
interface BotManagementPageProps {
    config: BotConfig;
}
declare function BotManagementPage({ config }: BotManagementPageProps): react.JSX.Element;

export { BotManagementPage };
