# 文化指令确认卡

本地运行：

```powershell
cd D:\openai\cultural-directive-card
python server.py
```

打开 `http://127.0.0.1:5174`。

页面支持五段式文化图像工作流：阶段一苏格拉底启发、阶段二文化翻译、阶段三用户确认卡、阶段四多模态生成与对抗解码代理、阶段五文化溯源与话语权可视化。用户也可以离线编辑、导入 JSON、导出 JSON、记录用户修改路径，并将最终 JSON 提交给 Worker 生成绘图 prompt。当前 `server.py` 内置的是本地占位实现，线上 AI 调用由 Cloudflare Worker 处理。

阶段四的文生图采用半自动交接：网页从 CPE 自动生成图像生成交接包和可一键复制的生图指令，用户把指令粘贴到 ChatGPT 或其他文生图工具生成图片，再把生成图像上传回网页。Worker 配置 `AI` binding 后，网页会调用 `@cf/google/gemma-4-26b-a4b-it` 读取上传图像并输出文化批判报告。页面也保留手动批判入口：用户可复制对抗解码指令到 GPT 网页端，把批判报告粘贴回来，并选择重新生成、保留或回到 CPE 手动修改。

阶段五默认使用阶段四上传的图片，也允许单独上传用户最终接受的图片覆盖默认图。溯源会打包阶段一对话、阶段二文化翻译、阶段三用户修改标记、阶段四历次文化批判报告与图像证据，调用 `@cf/google/gemma-4-26b-a4b-it` 生成文化溯源标注。绿色实线标注表示来自用户 CPE/对话的锚定元素，带橙色强调的绿色标注表示来自用户修改标记或修正回路的改动锚点，灰色虚线标注表示模型为画面完整性自动补全的元素。点击标注可查看对应文化溯源码。页面也会生成可一键复制的文化溯源提示词，供用户在 GPT 网页端手动完成同一任务；外部 GPT 返回的 JSON 可粘贴回阶段五文本框，页面会自动绘制标注。

Cloudflare Worker 需要的配置：

- Secret：`DEEPSEEK_API_KEY`，用于阶段一/二文本代理。
- 可选变量：`DEEPSEEK_MODEL`，默认 `deepseek-v4-flash`。
- Workers AI binding：变量名必须是 `AI`，用于阶段四看图批判和阶段五文化溯源标注。

GitHub Pages 部署见 `DEPLOY_GITHUB_PAGES.md`。GitHub Pages 不运行 Python 服务端，页面会自动使用浏览器本地生成 fallback。
