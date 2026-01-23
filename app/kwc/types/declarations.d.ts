declare module '@kdcloudjs/kwc-shared-utils/sendBosPlatformEvent';

declare module '@kdcloudjs/shoelace/dist/utilities/base-path.js' {
    export function setBasePath(path: string): void;
}

interface ImportMetaEnv {
    readonly SHOELACE_BASE_URL: string;
}

