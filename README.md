# 文化指令确认卡

本地运行：

```powershell
cd D:\openai\cultural-directive-card
python server.py
```

打开 `http://127.0.0.1:5174`。

页面支持离线编辑、导入 JSON、导出 JSON、记录用户修改路径，并将最终 JSON 提交到 `/api/cpe-translate`。当前 `server.py` 内置的是模块 2 接口契约的本地占位实现，后续可直接替换为真实翻译 Agent。

GitHub Pages 部署见 `DEPLOY_GITHUB_PAGES.md`。GitHub Pages 不运行 Python 服务端，页面会自动使用浏览器本地生成 fallback。
