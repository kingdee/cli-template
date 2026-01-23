import 'react';

declare module 'react' {

    namespace JSX {
        interface IntrinsicElements {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            'sl-card': any;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            'sl-input': any;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            'sl-button': any;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            'sl-icon': any;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            'sl-table': any;
        }
    }
}
