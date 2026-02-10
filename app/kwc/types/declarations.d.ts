declare module '@kdcloudjs/kwc-shared-utils/sendBosPlatformEvent';

declare module '@kdcloudjs/shoelace/dist/react/button/index.js';
declare module '@kdcloudjs/shoelace/dist/react/icon/index.js';

declare module '@kdcloudjs/shoelace/dist/react/input/index.js' {
    import { FunctionComponent, ComponentProps } from 'react';
    import { SlInputEvent } from '@kdcloudjs/shoelace/dist/events/events';

    const SlInput: FunctionComponent<ComponentProps<'sl-input'> & {
        onSlInput?: (event: SlInputEvent) => void;
    }>;
    export default SlInput;
    export type { SlInputEvent };
}

declare module '@kdcloudjs/shoelace/dist/components/input/input.js' {
    export default class SlInput extends HTMLElement {
        value: string;
    }
}

declare module '@kdcloudjs/shoelace/dist/components/button/button.js';
declare module '@kdcloudjs/shoelace/dist/components/icon/icon.js';

declare module '@kdcloudjs/shoelace/dist/utilities/base-path.js' {
    export function setBasePath(path: string): void;
}

interface ImportMetaEnv {
    readonly SHOELACE_BASE_URL: string;
}

