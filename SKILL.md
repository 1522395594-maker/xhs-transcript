---
name: xhs-transcript
description: |
  小红书博主视频逐字稿采集与整理：登录小红书 → 站内搜博主 → 一条条打开视频页 → 读小红书自带的中文自动字幕（.srt）当逐字稿（不下载视频）→ 校对 ASR → 整理成带高亮块（Obsidian callout）的结构化 Markdown。当用户说「爬一下某某的小红书视频」「拿某博主视频的逐字稿」「小红书视频转文字」「把这几条小红书视频整理成文档」时使用。只读：不发帖、不评论、不点赞、不私信，不批量狂刷，不代用户登录。
---

# 小红书视频逐字稿

把一个小红书博主的视频变成**可读、带高亮块的结构化 MD**。核心发现（2026-11-24 实测）：小红书网页版视频页的页面数据里，带着平台自动生成的**中文字幕文件（.srt）链接**，读这个文字文件就等于拿到逐字稿，不用下载视频、不用点点、不用自己跑语音识别。

依赖两个工具：

| 步骤 | 用什么 | 为什么 |
|---|---|---|
| 登录、站内搜索 | **agent-reach** skill（小红书渠道，后端 `opencli`） | 只有站内搜索才搜得到准确的博主笔记；公开网页搜索会搜到一堆不相关的人 |
| 打开视频页、读字幕 | **内置浏览器**（`mcp__Claude_Browser__*`）的 navigate + javascript_tool | agent-reach 的 `read` 只给标题和话题标签，拿不到视频里说的话 |

## 流程

### 1. 登录（用户本人）

```bash
agent-reach doctor --text          # 看 xiaohongshu 渠道状态
agent-reach login xiaohongshu      # 弹出专用浏览器窗口，用户自己扫码/登录
```

- 绝不代登、不要密码。等用户说「登好了」再继续。
- 内置浏览器读字幕**不需要登录**（视频播放要登录，但页面数据里的字幕链接不用）。

### 2. 站内搜博主，挑视频

```bash
agent-reach xiaohongshu search "<博主名>" --limit 10 --backend opencli
```

- **必须加 `--backend opencli`**，否则渠道没 `add` 时会退回公开网页搜索（结果里 `backend: public-web`），搜到的全是无关账号。
- 结果里同时有本人笔记和别人「聊某某」的笔记，按 `author` 只留本人（博主可能有多个号，如「李守洲」「李守洲Demo」）。
- 链接是 `search_result/<note_id>?xsec_token=...`，记下 `note_id` 和 `xsec_token`。
- 先试 2–3 条，用户满意再扩大；同一平台两次搜索至少隔 10 秒。
- 可选：`agent-reach xiaohongshu read "<链接>" --backend opencli` 拿赞/藏/评和话题标签（正文常常只有话题标签，说明是视频笔记）。

### 3. 一条一条读字幕

对每条视频：

1. 内置浏览器打开：`https://www.xiaohongshu.com/explore/<note_id>?xsec_token=<token>&xsec_source=pc_search`
   - 第一次用 `mcp__Claude_Browser__preview_start {url}`，之后用 `navigate`。
2. 用 `mcp__Claude_Browser__javascript_tool` 执行 [scripts/extract_subtitle.js](scripts/extract_subtitle.js) 的内容。它会：等 4 秒（像真人一样等页面加载）→ 从 `window.__INITIAL_STATE__.note` 里找 `"zh-CN":[{"url":"...srt..."}]` → fetch 这份 srt → 返回 `title / time / lines`（`[mm:ss] 句子` 格式）。
3. 每条之间自然停顿，不要并发、不要一口气刷几十条。

**拿不到字幕时**（`n: 0`，或页面数据里 `isSupportSubtitle` 为 false 且没有 srt 链接）：

- 告诉用户这条没有平台字幕，列出来；
- 备选：用户在手机 App 里把视频「分享 → 问点点」让点点给逐字稿（点点**没有网页版**，`diandian.xiaohongshu.com` 只是下载落地页）；
- 不要私自下载视频做语音识别——用户明确说过不下载。

### 4. 校对 ASR

只订正明显错字，不润色口语。常见坑：

- 同音词：「工具理性」→「工具女性 / 攻击女性」、「价值理性」→「价值女性」、「流量」→「浏览」、「百万播放」→「百元播放」、「同质化」→「投资化」、「爆了」→「报了」。
- 人名：「马克斯·韦伯」→「马克思、韦伯」；生僻概念：「祛魅」→「去魅」。
- 一句被字幕切成两行时（如「大号佬 / 号」）合并。
- 拿不准的改法标 `[?]`，所有改动记进文末的订正表。

### 5. 整理成结构化 MD

格式见 [references/doc-template.md](references/doc-template.md)。要点：

- 顶部 `> [!info]` 说明来源（平台自动字幕、没下载视频）、抓取日期、校对原则。
- `> [!tip]` 所有视频一条一行的速览。
- 每条视频一个 `##`：元信息（账号、发布日期、时长、赞藏评、链接、话题）→ `> [!abstract]` 核心判断（可证伪的判断，不是话题标签）→ `> [!example]` 他用的例子/类比/数字 → `> [!warning]` 术语表（优先用博主自己的定义）→ `### 全文`。
- 全文按意思合并成段，每段开头保留一个 `[mm:ss]` 时间戳，便于回查原视频。
- 文末 `> [!info]` 订正表：原字幕 → 改为 → 位置。
- 存放：当前工作目录下 `<博主名>-小红书逐字稿/<博主名>-小红书逐字稿-<说明>.md`。

## 红线

- 只读：不发帖、不评论、不点赞、不私信、不关注。
- 不代登录、不碰密码和 Cookie，不在回复里输出 xsec_token 以外的凭据。
- 不批量爬：先 2–3 条，一条一条来；遇到验证码、风控、限流就停，让用户在官方页面处理。
- 不下载视频文件；只读字幕这种文字文件。
