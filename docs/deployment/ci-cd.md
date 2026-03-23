# CI/CD 部署策略详解

## GitHub Actions 工作流配置

### 工作流触发规则

#### 1. 前端部署工作流

**文件路径**: `.github/workflows/deploy-frontend.yml`

```yaml
name: Deploy Frontend

on:
  push:
    branches: [main, develop]
    paths:
      - 'apps/frontend/**'
      - 'packages/types/**'
      - 'packages/utils/**'
  pull_request:
    paths:
      - 'apps/frontend/**'
      - 'packages/types/**'
      - 'packages/utils/**'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Get pnpm store directory
        shell: bash
        run: |
          echo "STORE_PATH=$(pnpm store path --silent)" >> $GITHUB_ENV
      
      - name: Setup pnpm cache
        uses: actions/cache@v3
        with:
          path: ${{ env.STORE_PATH }}
          key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-store-
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Build with Turborepo
        run: pnpm turbo build --filter=frontend
      
      - name: Run tests
        run: pnpm turbo test --filter=frontend
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

#### 2. API 网关部署工作流

**文件路径**: `.github/workflows/deploy-api-gateway.yml`

```yaml
name: Deploy API Gateway

on:
  push:
    branches: [main, develop]
    paths:
      - 'apps/api-gateway/**'
      - 'packages/shared/**'
  pull_request:
    paths:
      - 'apps/api-gateway/**'
      - 'packages/shared/**'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
          cache: 'pip'
      
      - name: Install dependencies
        working-directory: apps/api-gateway
        run: |
          pip install -r requirements.txt
      
      - name: Run linting
        working-directory: apps/api-gateway
        run: |
          flake8 .
          black --check .
          mypy .
      
      - name: Run tests
        working-directory: apps/api-gateway
        run: pytest
      
      - name: Build Docker image
        run: |
          docker build -t api-gateway:${{ github.sha }} -f apps/api-gateway/Dockerfile .
      
      - name: Push to registry
        run: |
          echo "${{ secrets.DOCKER_PASSWORD }}" | docker login -u "${{ secrets.DOCKER_USERNAME }}" --password-stdin
          docker tag api-gateway:${{ github.sha }} ${{ secrets.DOCKER_REGISTRY }}/api-gateway:${{ github.sha }}
          docker push ${{ secrets.DOCKER_REGISTRY }}/api-gateway:${{ github.sha }}
      
      - name: Deploy to server
        run: |
          # 部署脚本，更新 Kubernetes 或 Docker Swarm
          kubectl set image deployment/api-gateway api-gateway=${{ secrets.DOCKER_REGISTRY }}/api-gateway:${{ github.sha }}
```

#### 3. 服务部署工作流（通用模板）

**文件路径**: `.github/workflows/deploy-service.yml`

```yaml
name: Deploy Service

on:
  push:
    branches: [main, develop]
    paths:
      - 'apps/${{ matrix.service }}/**'
      - 'packages/shared/**'
  workflow_dispatch:
    inputs:
      service:
        description: 'Service name'
        required: true
        type: choice
        options:
          - user-service
          - product-service
          - order-service

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [user-service, product-service, order-service]
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
          cache: 'pip'
      
      - name: Install dependencies
        working-directory: apps/${{ matrix.service }}
        run: |
          pip install -r requirements.txt
      
      - name: Run tests
        working-directory: apps/${{ matrix.service }}
        run: pytest
      
      - name: Build Docker image
        run: |
          docker build -t ${{ matrix.service }}:${{ github.sha }} -f apps/${{ matrix.service }}/Dockerfile .
      
      - name: Push to registry
        run: |
          echo "${{ secrets.DOCKER_PASSWORD }}" | docker login -u "${{ secrets.DOCKER_USERNAME }}" --password-stdin
          docker tag ${{ matrix.service }}:${{ github.sha }} ${{ secrets.DOCKER_REGISTRY }}/${{ matrix.service }}:${{ github.sha }}
          docker push ${{ secrets.DOCKER_REGISTRY }}/${{ matrix.service }}:${{ github.sha }}
      
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/${{ matrix.service }} ${{ matrix.service }}=${{ secrets.DOCKER_REGISTRY }}/${{ matrix.service }}:${{ github.sha }}
```

## 部署环境

### 开发环境 (Development)
- **触发条件**: `develop` 分支推送
- **部署目标**: 开发服务器
- **特点**: 快速迭代，允许失败

### 测试环境 (Staging)
- **触发条件**: PR 合并到 `develop`
- **部署目标**: 测试服务器
- **特点**: 完整测试，接近生产环境

### 生产环境 (Production)
- **触发条件**: `main` 分支推送
- **部署目标**: 生产服务器
- **特点**: 严格审核，自动回滚

## 部署策略

### 1. 蓝绿部署
- 保持两个相同的生产环境
- 新版本部署到绿色环境
- 验证通过后切换流量
- 失败时快速切回蓝色环境

### 2. 滚动更新
- 逐步替换旧实例
- 保持服务可用性
- 自动健康检查
- 失败时自动回滚

### 3. 金丝雀发布
- 先部署到少量实例
- 监控指标和错误率
- 逐步扩大范围
- 验证通过后全量部署

## 监控和告警

### 部署后检查
- 健康检查端点验证
- 关键功能冒烟测试
- 性能指标监控
- 错误日志检查

### 自动回滚条件
- 健康检查失败超过阈值
- 错误率超过 5%
- 响应时间超过 2 秒
- 关键功能测试失败

## 缓存策略

### Turborepo 缓存
- 构建产物缓存
- 测试结果缓存
- 依赖安装缓存
- 跨工作流共享缓存

### Docker 层缓存
- 基础镜像缓存
- 依赖层缓存
- 代码层缓存
- 多阶段构建优化

## 安全措施

### 密钥管理
- 使用 GitHub Secrets 存储敏感信息
- 环境变量注入
- 密钥轮换策略
- 最小权限原则

### 代码安全
- 依赖漏洞扫描
- 代码安全扫描
- 容器镜像扫描
- 许可证检查

## 性能优化

### 构建优化
- 并行构建多个服务
- 增量构建未变更模块
- 缓存依赖和构建产物
- 优化 Docker 镜像大小

### 部署优化
- 预热新实例
- 优雅关闭旧实例
- 连接池管理
- 数据库连接优化

