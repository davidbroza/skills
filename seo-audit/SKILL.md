---
name: seo-audit
description: >-
  Use when the user wants an SEO audit, asks why a site gets no search
  traffic, wants to "do SEO", prepare a site for launch, or show up in Google,
  Bing, local engines or AI search (ChatGPT, Perplexity, Gemini). Walks
  through the basics the way a professional SEO would and ends with a
  prioritized findings table, quick wins first.
---
# SEO audit

Audit a website's SEO basics like a professional would: goals and queries first, then crawling and indexing, on-page, structured data, performance, AI search, off-page and measurement. Check things on the live site, not just in the code. Every finding needs evidence (a URL, a command output, a screenshot) and a concrete fix.

## 0. Before you start
- Get the site URL, the target country and language(s), the audience, and what counts as a conversion (sign-up, purchase, lead).
- Note what you can access: the repo, Search Console, Bing Webmaster Tools, analytics, DNS/CDN. Missing access is a finding, not a blocker.
- Set expectations: technical fixes and new content usually take days to weeks to show in search. Traffic *today* comes from communities, social and direct outreach (section 7), not SEO.
- Useful shell helpers:
  ```bash
  SITE=https://example.com
  curl -sIL "$SITE" | grep -iE '^(HTTP|location|x-robots-tag|content-security-policy|strict-transport)'
  curl -s "$SITE" | grep -ioE '<title>[^<]*</title>|<meta name="(description|robots)"[^>]*>|<link rel="canonical"[^>]*>|<h1[^>]*>'
  curl -s -A "Googlebot" "$SITE" | wc -c     # compare with a browser UA: does the bot get the same HTML?
  ```

## 1. Goals, keywords and search intent
- Write down 3–5 business goals and the pages that serve them.
- Build a keyword list from how real people search **in the local language**, including colloquial phrasing, questions ("how much sun will my flat get") and misspellings. Don't translate English keywords literally.
- Sources: Google autocomplete and "People also ask", Search Console queries (if any data), Google Keyword Planner, Bing keyword research, competitors' titles and headings, forums and communities, AnswerThePublic-style tools.
- Classify intent per keyword: informational, commercial, transactional, navigational, local. Map each keyword cluster to **one** target page (avoid cannibalization).
- Search the top keywords yourself (incognito, correct country): who ranks, what content type wins (guide, tool, listing, video), which SERP features appear (featured snippet, PAA, local pack, images, AI overview). Match that format.
- List 3–5 real competitors in search (not necessarily business competitors) and note their content gaps.

## 2. Crawlability and indexing
- **robots.txt** (`curl -s $SITE/robots.txt`): exists, returns 200, does not block CSS/JS or important paths, lists `Sitemap: https://…/sitemap.xml`. Check that a CDN/bot-protection layer doesn't inject rules you didn't intend.
- **XML sitemap**: valid XML, only canonical, indexable, 200-status URLs with absolute https URLs; `lastmod` real, not "now" on every build; under 50k URLs/50 MB per file; submitted in Search Console and Bing.
  ```bash
  curl -s $SITE/sitemap.xml | grep -oE '<loc>[^<]+' | sed 's/<loc>//' | while read u; do echo "$(curl -s -o /dev/null -w '%{http_code}' "$u") $u"; done | grep -v '^200'
  ```
- **Canonicals**: every indexable page has a self-referencing absolute `rel=canonical`; no canonical pointing to redirects, 404s or noindex pages; query-parameter variants canonicalize to the clean URL.
- **noindex**: check both `<meta name="robots">` and the `X-Robots-Tag` header. Staging/preview domains must be noindexed; production must not be. Private pages (dashboards, accounts, shares) should be noindex and not in the sitemap.
- **Status codes**: real 404/410 for missing pages (no "soft 404" that returns 200), 301 for permanent moves, no redirect chains (>1 hop) or loops, no 5xx.
- **One host**: `http://` → `https://` and `www` ↔ apex both 301 in a single hop to the chosen host:
  ```bash
  for u in http://example.com http://www.example.com https://www.example.com; do curl -s -o /dev/null -w "%{http_code} %{redirect_url}  <- $u\n" "$u"; done
  ```
- **hreflang** (multi-language/region only): reciprocal tags, self-reference, valid codes (`cs`, `en-GB`), `x-default`; each URL canonicalizes to itself.
- **JavaScript rendering**: important content, links, titles and meta must be in the server HTML (SSR/SSG). Compare `curl` output with the rendered DOM; use Search Console's URL Inspection → "View crawled page". Links must be `<a href>`, not click handlers.
- **Internal 404s and orphans**: crawl the site (Screaming Frog, `npx linkinator $SITE --recurse`, or `wget --spider -r`) and fix broken links; every important page should be reachable within ~3 clicks.
- **Crawl budget** (large sites): block infinite facets/calendars/search results, avoid parameter explosions, keep sitemaps clean.
- **Webmaster tools**: verify the domain property in Google Search Console and Bing Webmaster Tools (Bing can import from GSC; it also feeds ChatGPT search, Copilot and DuckDuckGo). Add local engines where they matter, e.g. Seznam Webmaster (Czech), Yandex Webmaster, Naver. Use IndexNow (Bing, Seznam, Yandex) to push new/changed URLs.
- Check coverage: `site:example.com` in each engine, and Search Console's Pages report for "Discovered/Crawled – currently not indexed", duplicates and canonical mismatches.

## 3. On-page
- **Title**: unique per page, primary keyword near the front, ~50–60 characters, brand at the end. Not the same title on every route (common SPA bug).
- **Meta description**: unique, ~140–160 characters, states the benefit and a call to action. It drives clicks, not rankings.
- **Headings**: exactly one H1 matching the page's topic; logical H2/H3 hierarchy that reads like an outline; headings used for structure, not styling.
- **URLs**: short, lowercase, hyphenated, readable, in the local language (transliterated if needed), stable. No IDs-only slugs for pages meant to rank.
- **Internal linking**: descriptive anchor text, links from strong pages (home, nav, hubs) to money pages, related-content links, breadcrumbs. No important page linked only from JS menus.
- **Images**: meaningful `alt`, descriptive filenames, modern formats (WebP/AVIF), explicit `width`/`height`, responsive `srcset`, lazy-load below the fold only.
- **Thin and duplicate content**: merge or noindex near-empty pages, template-only pages and duplicate variants; every indexable page needs unique value.
- **Content that answers the query**: answer in the first paragraph, then detail; cover the questions from PAA; use tables, lists, steps, examples and real numbers; keep it current with a visible updated date.
- **E-E-A-T**: show who is behind the site (about page, author bios, contact, company details), real experience (photos, case studies, data), sources, and trust signals (terms, privacy, reviews). Essential for money/health/legal topics.

## 4. Structured data (schema.org JSON-LD)
- Add JSON-LD in the server HTML, matching visible content:
  - `Organization` (name, url, logo, sameAs) and `WebSite` on the home page.
  - `BreadcrumbList` on nested pages.
  - `Article`/`BlogPosting` (headline, author, datePublished, dateModified, image) on guides and posts.
  - `Product` + `Offer` (price, currency, availability) or `SoftwareApplication` for products and apps.
  - `LocalBusiness` (address, geo, openingHours, phone) for physical businesses.
  - `FAQPage` only for genuine Q&A. Google shows FAQ rich results only for a few authoritative sites now, but the markup still helps other engines and AI answers.
- Validate: [Rich Results Test](https://search.google.com/test/rich-results) and [Schema Markup Validator](https://validator.schema.org/); then watch Search Console's Enhancements reports.
- Quick check: `curl -s $SITE | grep -o '<script type="application/ld+json">.*</script>' | head`

## 5. Technical performance and security
- **Core Web Vitals** (field data, 75th percentile, mobile): LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1. Use Search Console's Core Web Vitals report and CrUX; lab tools only explain why.
  ```bash
  curl -s "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=$SITE&strategy=mobile&category=performance&category=seo" \
    | jq '.lighthouseResult.categories | map_values(.score), .loadingExperience.metrics'
  npx lighthouse $SITE --form-factor=mobile --only-categories=performance,seo,accessibility,best-practices --view
  ```
- Typical fixes: preload/prioritize the LCP image, inline critical CSS, defer non-critical JS, split heavy bundles (3D, maps, charts) and load them on interaction, reserve space for images/embeds/fonts (`font-display: swap`), cache static assets at the CDN.
- **Mobile-first**: Google indexes the mobile version. Same content and structured data on mobile, readable without zoom, tap targets ≥ 48 px, no intrusive interstitials.
- **HTTPS**: valid certificate, HSTS, no mixed content.
- **Security headers vs analytics**: a strict `Content-Security-Policy` often silently blocks analytics, tag managers or beacons (`script-src`, `connect-src`). Check the browser console for CSP violations and confirm hits actually arrive. Same for cookie banners that block everything by default.

## 6. AI search / GEO (generative engine optimization)
- **Allow the crawlers you want** in robots.txt and in any CDN bot-blocking settings (managed "block AI bots" toggles often override robots.txt):
  - Search/answer bots: `OAI-SearchBot` and `ChatGPT-User` (ChatGPT), `PerplexityBot`, `Claude-SearchBot`/`Claude-User`, `Bingbot` (ChatGPT search and Copilot lean heavily on Bing's index), `Googlebot` (AI Overviews use the normal index).
  - Training-only tokens (opt in or out as a business decision): `GPTBot`, `ClaudeBot`, `Google-Extended`, `Applebot-Extended`, `CCBot`.
  ```bash
  for ua in GPTBot OAI-SearchBot PerplexityBot ClaudeBot Bingbot; do echo "$(curl -s -o /dev/null -w '%{http_code}' -A "$ua" $SITE) $ua"; done
  ```
- **llms.txt**: optional, cheap to add at `/llms.txt`: a short Markdown summary of the site with links to key pages. Not a ranking factor for Google; treat it as a nice-to-have.
- **Answer-style content**: clear definitions, direct answers in the first sentences, factual statements with numbers, units, dates and sources, comparison tables, FAQs. Pages that are easy to quote get cited.
- **Citation-worthy pages**: original data, calculators, methodology pages, pricing pages with explicit numbers, "X vs Y" comparisons. Keep brand facts (what it is, who it's for, price, location) consistent across the site, profiles and directories.
- Test it: ask ChatGPT, Perplexity, Gemini and Copilot the target questions and note whether the site is mentioned or cited, and which sources are cited instead (those are your outreach targets).

## 7. Off-page
- **Backlinks**: check the current profile (Ahrefs/Semrush free tools, Bing Webmaster backlinks, Search Console Links). Aim for relevant, editorial links: partners, suppliers, industry associations, local news, universities, guest articles, data stories, free tools others link to.
- **Directories and citations**: relevant industry and local directories with consistent name/address/phone (NAP). Skip spammy link directories.
- **Communities**: forums, Facebook groups, Reddit, Discord, Q&A sites where the audience already asks the questions. Answer genuinely, follow each community's rules, disclose affiliation. This is also the fastest source of first visitors.
- **PR**: launch posts (Product Hunt, Hacker News, local startup media), newsletters, podcasts, a press page with assets.
- **Google Business Profile** (and Bing Places, local maps such as Apple Maps or Mapy.cz) for anything with a location or service area: categories, photos, hours, reviews.
- **Social previews**: every shareable page has `og:title`, `og:description`, `og:image` (1200×630, absolute URL), `og:url`, `twitter:card=summary_large_image`. Test with the platforms' debuggers (Facebook Sharing Debugger, LinkedIn Post Inspector).

## 8. Measurement
- **Analytics**: privacy-friendly tools are fine (Plausible, Fathom, Cloudflare Web Analytics, PostHog, Umami). Verify it **actually records**: open the site from a fresh browser, see the hit in real time; check that EU visitors aren't excluded by a setting, blocked by CSP, or dropped by an unaccepted consent banner. Filter internal and test traffic.
- **Search Console / Bing**: track impressions, clicks, CTR and average position per query and page; indexed vs submitted pages; CWV and enhancement errors. Low CTR at good positions → rewrite titles/descriptions.
- **UTM tagging**: tag every link you post off-site (`?utm_source=facebook&utm_medium=community&utm_campaign=launch`) so community and PR traffic is attributable.
- **Funnel**: landing page → key action → sign-up/purchase. SEO that brings traffic which doesn't convert is a content/intent mismatch.
- **Weekly report**: same metrics every week vs the previous week: visitors, top sources, top landing pages, new queries, indexed pages, conversions, plus the fixes shipped. Annotate deploys and campaigns.

## 9. Output
Start with a 3–5 line summary: current state, biggest blocker, expected effect. Then a prioritized table, quick wins (high impact, low effort) first:

| # | Issue (with evidence) | Impact | Effort | Fix |
|---|---|---|---|---|
| 1 | `www` returns 200 instead of 301 (`curl -I https://www.example.com`) | High | Low | 301 www → apex at the CDN |
| 2 | Same `<title>` on all 40 routes | High | Low | Per-route title + description |
| 3 | No `og:image` on shared pages | Medium | Low | Add 1200×630 OG image per page |

- Impact: High / Medium / Low on traffic or conversion. Effort: Low (< 1 h) / Medium (< 1 day) / High.
- Group the rest by section, then list content opportunities (keyword cluster → target page → format) and off-page actions separately.
- After fixes ship: re-run the checks, request indexing for changed key pages, resubmit sitemaps, ping IndexNow, and note the date so the next report can measure the effect.
- Don't promise rankings or timelines. Don't recommend link buying, cloaking, keyword stuffing or mass AI-generated pages.
