// 本地文件通知适配器：不调用任何外部 Webhook，把战报写入工作区 data/report.md（Markdown）
// 与 data/report.json（结构化），并打印到 stdout，供 WorkBuddy 定时任务读取后通过智能体邮箱推送。
// 这是对原飞书/钉钉/企业微信推送的替换：输出渠道由 IM 群机器人改为 WorkBuddy 邮箱推送。
import { writeFileSync, appendFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildReportMarkdown, buildInitMarkdown } from "./markdown.js";

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "data");

function writeReport(payload) {
  mkdirSync(DATA_DIR, { recursive: true });
  // payload 可能是 { title, text }（markdown 适配器）或卡片对象（飞书）；统一落盘为文本
  const text = typeof payload?.text === "string" ? payload.text : JSON.stringify(payload, null, 2);
  // 初始化卡片（首次建基线）标题含「存档已创建」，单独成文件，便于首日用邮件确认链路存活
  const isInit = typeof payload?.title === "string" && payload.title.includes("存档已创建");
  const base = isInit ? "report-init" : "report";
  // 多账号时逐个追加，避免覆盖；每次运行前由 run-daily.sh 清空前序文件
  appendFileSync(join(DATA_DIR, `${base}.md`), text + "\n\n", "utf8");
  writeFileSync(join(DATA_DIR, `${base}.json`), JSON.stringify(payload, null, 2) + "\n", "utf8");
  // 同时打印到 stdout，方便自动化直接捕获
  console.log("\n========== STEAM_REPORT_START ==========");
  console.log(text);
  console.log("========== STEAM_REPORT_END ==========\n");
  return join(DATA_DIR, `${base}.md`);
}

export const file = {
  name: "file",
  // webhook 为空，或显式配置 workbuddy/file/stdout/local 时走本地文件输出
  matches: (webhook) => !webhook || /^(workbuddy|file|stdout|local)$/i.test(String(webhook).trim()),
  buildReport: buildReportMarkdown,
  buildInit: buildInitMarkdown,
  send: ({ payload }) => writeReport(payload),
};
