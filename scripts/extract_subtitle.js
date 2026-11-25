// 在小红书视频笔记页（www.xiaohongshu.com/explore/<note_id>?xsec_token=...）里执行，
// 例如通过 mcp__Claude_Browser__javascript_tool。只读取平台自带的中文自动字幕（.srt 文字文件），不下载视频。
// 返回：{ title, time, n, location, lines }，lines 为 "[mm:ss] 句子" 一行一句；n=0 表示这条没有字幕。
await new Promise(r => setTimeout(r, 4000)); // 像真人一样等页面加载
const seen = new WeakSet();
const s = JSON.stringify(window.__INITIAL_STATE__?.note || {}, (k, v) => {
  if (k === 'dep' || k === 'deps' || k === 'sub' || k === 'subs') return undefined; // 去掉 Vue 响应式的循环引用
  if (v && typeof v === 'object') { if (seen.has(v)) return undefined; seen.add(v); }
  return v;
}).replace(/\\+/g, '');
const title = (s.match(/"title":"([^"]+)"/) || [])[1];
const time = (s.match(/"time":(\d{13})/) || [])[1];
const urls = [...s.matchAll(/"zh-CN":\[\{"url":"(https:[^"]+?\.srt[^"]*)"/g)].map(x => x[1]);
const srt = urls[0] ? await fetch(urls[0]).then(r => r.text()) : null;
const lines = srt ? srt.trim().split(/\n\n/).map(b => {
  const p = b.split('\n');
  return '[' + p[1].slice(3, 8) + '] ' + p.slice(2).join(' ');
}).join('\n') : null;
({ title, time: time && new Date(+time).toISOString(), n: urls.length, location: location.pathname, lines })
