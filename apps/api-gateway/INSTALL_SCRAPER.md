# 爬虫模块安装说明

## 快速开始

### 1. 安装 Python 依赖

```bash
cd apps/api-gateway
pip install -r requirements.txt
```

### 2. 安装 Playwright 浏览器（重要！）

Playwright 需要单独安装浏览器二进制文件。这是必需的步骤：

```bash
# 只安装 Chromium（推荐，体积较小）
playwright install chromium

# 或者安装所有浏览器
playwright install
```

### 3. 验证安装

运行以下命令验证 Playwright 是否正常工作：

```bash
python -c "from playwright.sync_api import sync_playwright; p = sync_playwright().start(); print('Playwright 安装成功！')"
```

## 常见问题

### Q: 为什么需要单独安装浏览器？

A: Playwright 是一个浏览器自动化工具，它需要实际的浏览器二进制文件来运行。这些文件体积较大（约 100-300MB），所以没有包含在 pip 包中，需要单独下载。

### Q: 安装浏览器需要多长时间？

A: 通常需要 1-5 分钟，取决于网络速度。Chromium 浏览器大小约为 150MB。

### Q: 可以在生产环境中使用吗？

A: 可以。Playwright 支持 headless 模式，适合服务器环境。确保在部署时也安装了浏览器二进制文件。

### Q: Docker 环境如何安装？

在 Dockerfile 中添加：

```dockerfile
# 安装 Playwright 和浏览器
RUN pip install playwright && \
    playwright install chromium && \
    playwright install-deps chromium
```

## 下一步

安装完成后，可以开始使用爬虫功能：

- 查看 [API 文档](../core/scraper/README.md) 了解使用方法
- 测试 API 端点：`POST /api/v1/ai/import-from-link`
