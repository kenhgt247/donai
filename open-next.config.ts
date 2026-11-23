import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Cấu hình mặc định, không dùng bộ nhớ đệm R2 (để không phát sinh phí).
export default defineCloudflareConfig({});
