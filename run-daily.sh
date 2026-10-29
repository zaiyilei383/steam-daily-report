#!/usr/bin/env bash
# Steam 每日战报 · WorkBuddy 定时任务入口
# 串联：结算快照 → 生成战报 → 产出统一输出文件 data/daily-output.md（供 WorkBuddy 读取后邮箱推送）
# 用法：bash run-daily.sh   （需在本目录，且已配置 .env）
set -u
cd "$(dirname "$0")"

# 清空前序运行产物，确保本次输出只反映当天结果
rm -f data/report.md data/report-init.md data/daily-output.md

echo "📸 [$(date '+%Y-%m-%d %H:%M:%S')] 开始结算快照…"
node --env-file-if-exists=.env scripts/snapshot.js

echo "📊 [$(date '+%Y-%m-%d %H:%M:%S')] 生成战报…"
node --env-file-if-exists=.env scripts/report.js

# 决定本次要推送的内容：优先真实战报，其次首日的初始化存档确认，最后是无战报状态说明
if [ -s data/report.md ]; then
  cp data/report.md data/daily-output.md
  echo "RESULT=REPORT"
elif [ -s data/report-init.md ]; then
  cp data/report-init.md data/daily-output.md
  echo "RESULT=INIT"
else
  {
    echo "# 🎮 Steam 每日战报"
    echo
    echo "_$(date '+%Y-%m-%d') 无新战报_"
    echo
    echo "统计窗口尚未形成，或本次窗口已发送过。"
    echo "（首次运行需连续两天快照才会生成第一份战报；多账号各自独立。）"
    echo
    echo "若连续多日无战报，请检查：STEAM_API_KEY / STEAM_ID 是否正确、Steam「游戏详情」隐私是否设为公开。"
  } > data/daily-output.md
  echo "RESULT=NONE"
fi

echo "DONE"
