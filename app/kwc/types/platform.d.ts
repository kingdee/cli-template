/* eslint-disable @typescript-eslint/no-explicit-any */

declare global {
    /**
     * KWC data change event interface
     */
    interface KwcDataChangeEvent<T = any> {
        /** Callback ID */
        callBackId: string;
        /** Actual data */
        data: T;
    }

    /**
     * KWC component context interface definition
     */
    interface KwcContext {
        /** Dispatch action */
        dispatchAction: (action: string, params?: any) => void;
        /** Context data */
        data: any;
        /** Method to get data */
        getData: () => any;
        /** Add data change listener */
        addDataChangeListener: (callback: (event: KwcDataChangeEvent) => void) => () => void;
        /** Close component/page */
        close: (params?: any) => void;
    }

    /**
     * KWC component configuration object interface definition
     */
    interface KwcConfig {
        /** Original properties */
        metaProps: Record<string, any>;
        /** Context object */
        context: KwcContext;
        /** Page ID */
        pageId: string;
        /** Form ID */
        formId: string;
        /** Control ID */
        controlId: string;
        /** ISV ID */
        isvId: string;
        /** Module ID */
        moduleId: string;
        /** App */
        app?: string;
    }
}

export { };
