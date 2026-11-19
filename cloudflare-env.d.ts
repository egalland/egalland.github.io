declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    STRATE_OWNER_EMAIL_SHA256?: string;
    BUCKET?: R2Bucket;
  }
}
