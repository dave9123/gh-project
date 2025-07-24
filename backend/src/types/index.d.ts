declare global {
    namespace NodeJS {
        interface ProcessEnv {
            DATABASE_HOST: string;
            DATABASE_USER: string;
            DATABASE_PASSWORD: string;
            DATABASE_NAME: string;
            DATABASE_PORT?: string;
            DATABASE_SSL?: string;
            DATABASE_REJECT_UNAUTHORIZED?: string;

            CLOUDFLARE_ACCOUNT_ID?: string;
            CLOUDFLARE_DATABASE_ID?: string;
            CLOUDFLARE_D1_TOKEN?: string;
        }
    }
}