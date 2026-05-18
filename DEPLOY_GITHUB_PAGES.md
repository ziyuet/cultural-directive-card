# GitHub Pages 部署

GitHub Pages 适合托管本项目的静态前端。它不会运行 `server.py`，但页面已经内置浏览器本地生成 fallback，所以导入、编辑、导出和“确认并生成”都可以在静态页面中使用。

## 需要上传的文件

```text
index.html
styles.css
app.js
.nojekyll
README.md
DEPLOY_GITHUB_PAGES.md
```

`server.py`、`package.json` 可以不上传；如果上传也不会影响 GitHub Pages，但 Python 服务端不会被执行。

如果启用 Cloudflare Worker AI 生成，需要同时把仓库上级目录中的 `workers.js` 部署到 Cloudflare Worker。前端的 `app.js` 已配置为通过 Worker 完成阶段一苏格拉底启发和阶段二文化翻译；最终确认卡生成失败时会回退到浏览器本地生成。

当前 Worker 使用 DeepSeek OpenAI-compatible API：

```text
base_url: https://api.deepseek.com
endpoint: /chat/completions
default model: deepseek-v4-flash
```

Cloudflare Worker 需要配置 Secret：

```text
DEEPSEEK_API_KEY
```

可选配置变量：

```text
DEEPSEEK_MODEL=deepseek-v4-pro
```

当前 Worker 地址配置在 `app.js`：

```text
https://ai-assistant-proxy.ziyuet97.workers.dev/
```

## 网页端部署步骤

1. 登录 GitHub。
2. 新建一个 Public repository，例如 `cultural-directive-card`。
3. 把上述文件上传到仓库根目录。
4. 进入仓库 `Settings` -> `Pages`。
5. `Build and deployment` 选择 `Deploy from a branch`。
6. Branch 选择 `main`，目录选择 `/root`，保存。
7. 等待 GitHub Actions 部署完成。

访问地址通常是：

```text
https://你的用户名.github.io/cultural-directive-card/
```

如果仓库名是 `你的用户名.github.io`，访问地址通常是：

```text
https://你的用户名.github.io/
```
