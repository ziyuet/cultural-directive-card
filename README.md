# 文化指令确认卡

本地运行：

```powershell
cd D:\openai\cultural-directive-card
python server.py
```

打开 `http://127.0.0.1:5174`。

页面支持三段式文化图像工作流：阶段一苏格拉底启发、阶段二文化翻译、阶段三用户确认卡。用户也可以离线编辑、导入 JSON、导出 JSON、记录用户修改路径，并将最终 JSON 提交给 Worker 生成绘图 prompt。当前 `server.py` 内置的是本地占位实现，线上 AI 调用由 Cloudflare Worker 处理。

GitHub Pages 部署见 `DEPLOY_GITHUB_PAGES.md`。GitHub Pages 不运行 Python 服务端，页面会自动使用浏览器本地生成 fallback。
