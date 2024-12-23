/// <reference types="vite/client" />

// eslint-disable-next-line @typescript-eslint/naming-convention
interface ImportMetaEnv {
    VS_PATH?: string;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
interface ImportMeta {
    readonly env: ImportMetaEnv;
}
