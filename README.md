# xhs-transcript

小红书博主视频逐字稿采集与整理的 Claude Code skill。

- 读小红书网页版视频页自带的中文自动字幕（.srt），不下载视频、不跑语音识别
- 配合 Agent Reach 的小红书渠道做站内搜索，内置浏览器一条条打开视频页
- 校对 ASR 错字，整理成带 Obsidian 高亮块（callout）的结构化 Markdown

安装：把本仓库放到 `~/.claude/skills/xhs-transcript/`。说明见 [SKILL.md](SKILL.md)，文档格式见 [references/doc-template.md](references/doc-template.md)。

只读：不发帖、不评论、不点赞、不私信，不批量爬取，不代用户登录。
