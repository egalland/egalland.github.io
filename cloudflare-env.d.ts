declare namespace Cloudflare {
  interface Env {
    PRODUCT_LAB_OWNER_ID?: string;
    DB?: D1Database;
    BUCKET?: R2Bucket;
  }
}
