#!/bin/bash
# article-image-health.sh — REWRITE-PIPELINE Stage 4.5f hard gate (v2.20)
#
# 檢查 article 圖片健康度：
#   1. 文中所有 ![]() 連結對應檔案是否存在
#   2. frontmatter image 是否存在
#   3. 是否有外部熱連結（http/https URL 不在 /article-images/）
#   4. 是否有 ## 圖片來源 section
#   5. 攝影者 / license / source URL 是否齊全
#
# Usage:
#   bash scripts/tools/article-image-health.sh knowledge/People/林琪兒.md
#   bash scripts/tools/article-image-health.sh knowledge/People/*.md
#
# Exit codes:
#   0 — 全綠
#   1 — 至少一個檢查失敗
#
# Canonical: REWRITE-PIPELINE Stage 4.5f / DNA #30

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
GRAY='\033[0;90m'
BOLD='\033[1m'
NC='\033[0m'

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

if [ $# -eq 0 ]; then
  echo "Usage: $0 <article.md> [<article2.md> ...]"
  exit 1
fi

total=0
fail=0

for article in "$@"; do
  if [ ! -f "$article" ]; then
    echo -e "${RED}❌ $article: 檔案不存在${NC}"
    fail=$((fail + 1))
    continue
  fi

  total=$((total + 1))
  article_fail=0
  echo -e "${BOLD}🖼️  $article${NC}"

  # 1. Extract frontmatter image (hero)
  hero=$(awk '/^---$/{n++; next} n==1{print} n>=2{exit}' "$article" | grep -E "^image:" | sed -E "s/^image: *['\"]?([^'\"]+)['\"]?$/\1/")

  if [ -n "$hero" ]; then
    # Strip leading slash for filesystem check
    hero_path="public${hero}"
    if [ -f "$hero_path" ]; then
      echo -e "  ${GREEN}✅ Frontmatter hero 存在${NC} ${GRAY}$hero${NC}"
    else
      echo -e "  ${RED}❌ Frontmatter hero 連結但檔案不存在${NC} ${GRAY}$hero_path${NC}"
      article_fail=1
    fi

    # Check imageCredit / imageLicense / imageSource frontmatter
    for field in imageCredit imageLicense imageSource; do
      val=$(awk '/^---$/{n++; next} n==1{print} n>=2{exit}' "$article" | grep -E "^${field}:" || true)
      if [ -z "$val" ]; then
        echo -e "  ${YELLOW}⚠️  Frontmatter 缺 ${field}${NC}"
        article_fail=1
      fi
    done
  else
    echo -e "  ${YELLOW}⚠️  Frontmatter 無 image:（hero 圖未設定）${NC}"
    # hero 不強制（短文 / Hub 可無），不算 fail
  fi

  # 2. Extract all ![]() inline image references
  inline_imgs=$(grep -oE '!\[[^]]*\]\(([^)]+)\)' "$article" | sed -E 's/!\[[^]]*\]\(([^)]+)\)/\1/' || true)

  if [ -n "$inline_imgs" ]; then
    while IFS= read -r img_url; do
      [ -z "$img_url" ] && continue

      # 3. Check for external hot-link (絕對禁止)
      if echo "$img_url" | grep -qE '^https?://'; then
        echo -e "  ${RED}❌ 熱連結外部圖片（禁止）${NC} ${GRAY}$img_url${NC}"
        echo -e "     ${GRAY}必須 cache 到 public/article-images/{cat}/ 後改本地路徑${NC}"
        article_fail=1
        continue
      fi

      # Local path — verify existence
      img_path="public${img_url}"
      if [ -f "$img_path" ]; then
        echo -e "  ${GREEN}✅ Inline 圖存在${NC} ${GRAY}$img_url${NC}"
      else
        echo -e "  ${RED}❌ Inline 圖連結但檔案不存在${NC} ${GRAY}$img_path${NC}"
        article_fail=1
      fi
    done <<< "$inline_imgs"
  fi

  # 4. Check for ## 圖片來源 section（若有任何 hero 或 inline 圖）
  if [ -n "$hero" ] || [ -n "$inline_imgs" ]; then
    if grep -qE '^## 圖片來源' "$article"; then
      echo -e "  ${GREEN}✅ ## 圖片來源 section 存在${NC}"

      # 5. 抽 ## 圖片來源 section 內容驗證 metadata 齊全
      sec_content=$(awk '/^## 圖片來源/{flag=1; next} /^## /{flag=0} flag' "$article")

      # 每張圖至少有 — Photo: + License 標
      # 簡化檢查：section 不可為空 + 至少含一個「Photo:」
      if echo "$sec_content" | grep -qE 'Photo:|攝影者|©'; then
        echo -e "  ${GREEN}✅ 圖片來源 section 含攝影者 credit${NC}"
      else
        echo -e "  ${YELLOW}⚠️  圖片來源 section 缺 Photo / 攝影者 / © 標記${NC}"
        article_fail=1
      fi

      if echo "$sec_content" | grep -qiE 'license|public domain|cc by|cc0|授權'; then
        echo -e "  ${GREEN}✅ 圖片來源 section 含 license 資訊${NC}"
      else
        echo -e "  ${YELLOW}⚠️  圖片來源 section 缺 license 資訊${NC}"
        article_fail=1
      fi
    else
      echo -e "  ${RED}❌ 缺 ## 圖片來源 section${NC}"
      echo -e "     ${GRAY}所有用圖文章必須在文末加 ## 圖片來源 列出 source / 攝影者 / license${NC}"
      article_fail=1
    fi
  else
    echo -e "  ${GRAY}（無圖文章，跳過 ## 圖片來源 檢查）${NC}"
  fi

  # 結果
  if [ $article_fail -eq 0 ]; then
    echo -e "  ${GREEN}━━ ALL GREEN ━━${NC}"
  else
    fail=$((fail + 1))
  fi
  echo ""
done

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BOLD}📊 Article 圖片健康度摘要${NC}"
echo "   檢查: ${BOLD}$total${NC} 篇"
if [ $fail -eq 0 ]; then
  echo -e "   ${GREEN}✅ 全部通過${NC}"
else
  echo -e "   ${RED}❌ $fail 篇不合格${NC}"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

[ $fail -eq 0 ]
