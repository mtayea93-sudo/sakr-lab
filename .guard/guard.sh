#!/bin/bash
cd "$GITHUB_WORKSPACE"
FIXED=0
if ! grep -q 'rescueMode' index.html || ! grep -q "sakr_mt_'+k,'0'" index.html || ! grep -q '201095756594' index.html; then cp .guard/index.html index.html; FIXED=1; fi
if ! grep -q 'sakr-v7' sw.js; then cp .guard/sw.js sw.js; FIXED=1; fi
if [ "$FIXED" = "1" ]; then
  git config user.name "github-actions[bot]"
  git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
  git add -A
  git commit -m "guard: إصلاح تلقائي لحماية البيانات 🤖"
  git pull --rebase origin main || true
  git push origin main
  echo "guard: اتصلحت الملفات"
else
  echo "guard: كل حاجة سليمة"
fi
