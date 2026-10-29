// Steam 每日战报 · 纯 Node 入口（不依赖 bash）。
// 串联：结算快照 → 生成战报 → 产出统一输出文件 data/daily-output.md（供 WorkBuddy 读取后邮箱推送）。
// 用法：node --env-file-if-exists=.env run-daily.mjs
import { readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { main as snapshotMain } from "./scripts/snapshot.js";
import { main as reportMain } from "./scripts/report.js";

const DATA = join(dirname(fileURLToPath(import.meta.url)), "data");

function readText(p) {
  return existsSync(p) ? readFileSync(p, "utf8") : "";
}

async function main() {
  // 清空前序产物，确保本次输出只反映当天结果
  for (const f of ["report.md", "report.json", "report-init.md", "report-init.json", "daily-output.md"]) {
    const p = join(DATA, f);
    if (existsSync(p)) rmSync(p);
  }

  console.log(`📸 [${new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}] 开始结算快照…`);
  try {
    await snapshotMain();
  } catch (err) {
    console.error(`❌ 快照阶段异常: ${err.message}`);
  }

  console.log(`📊 [${new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}] 生成战报…`);
  try {
    await reportMain();
  } catch (err) {
    console.error(`❌ 播报阶段异常: ${err.message}`);
  }

  // 决定本次要推送的内容：优先真实战报，其次首日初始化存档确认，最后无战报状态说明
  const reportText = readText(join(DATA, "report.md")).trim();
  const initText = readText(join(DATA, "report-init.md")).trim();
  let result;
  let content;
  if (reportText.length > 0) {
    content = reportText;
    result = "REPORT";
  } else if (initText.length > 0) {
    content = initText;
    result = "INIT";
  } else {
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai" }).format(new Date());
    content =
      `# 🎮 Steam 每日战报\n\n` +
      `_${today} 无新战报_\n\n` +
      `统计窗口尚未形成，或本次窗口已发送过。\n` +
      `（首次运行需连续两天快照才会生成第一份战报；多账号各自独立。）\n\n` +
      `若连续多日无战报，请检查：STEAM_API_KEY / STEAM_ID 是否正确、Steam「游戏详情」隐私是否设为公开。`;
    result = "NONE";
  }

  writeFileSync(join(DATA, "daily-output.md"), content + "\n", "utf8");
  console.log("RESULT=" + result);
  console.log("DONE");
}

main().catch((err) => {
  console.error(`❌ ${err.message}`);
  process.exit(1);
});
