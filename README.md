# slzcn.github.io

Sean Zhang（@slzcn）的 GitHub Pages 个人项目主页。

## 项目如何自动出现在主页

- 页面每次打开都会调用 GitHub 公开仓库接口 `https://api.github.com/users/slzcn/repos`，拉取最新公开仓库并渲染成卡片；新建公开仓库无需手动改主页。
- `.github/workflows/refresh-repos.yml` 每天凌晨把当前仓库列表缓存到 `data/repos.json`，作为离线/限流兜底；页面先读缓存、再用在线接口刷新。
- 个人主页仓库本身（`slzcn.github.io`）会被自动排除。

## 本地预览

直接用任意静态服务器打开即可，例如：

```bash
npx serve .
# 或
python3 -m http.server 8080
```

## 目录

```
index.html            页面结构
assets/style.css      样式（暗色 + 青/紫渐变）
assets/app.js         拉取、过滤、搜索、排序与渲染逻辑
data/repos.json       定时刷新的仓库缓存
.github/workflows/    仓库列表缓存定时任务
```

## 说明

未登录调用 GitHub API 的限额为每 IP 每小时 60 次；单页加载只发一次请求，正常浏览足够。如需更高限额，可后续接入 GitHub OAuth token。
