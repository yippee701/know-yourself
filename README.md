# Know Yourself - H5移动端应用

一个使用React和Tailwind CSS构建的移动端纯静态H5应用，包含3个交互页面。

## 项目特性

✅ **React 19** - 最新版本的React框架
✅ **Tailwind CSS 4** - 现代化的CSS工具库
✅ **React Router v7** - 页面路由管理
✅ **Vite** - 快速的构建工具
✅ **移动端响应式** - 完全适配各种移动设备
✅ **GitHub Pages部署** - 自动部署工作流

## 项目结构

```
know-yourself/
├── src/
│   ├── pages/
│   │   ├── Page1.jsx    # 第一页
│   │   ├── Page2.jsx    # 第二页
│   │   └── Page3.jsx    # 第三页
│   ├── App.jsx          # 主应用程序
│   ├── main.jsx         # 入口点
│   └── index.css        # 全局样式
├── design/              # 设计稿
│   ├── 1.jpg
│   ├── 2.jpg
│   └── 3.jpg
├── public/              # 静态资源
├── vite.config.js       # Vite配置
├── tailwind.config.js   # Tailwind配置
└── package.json         # 项目依赖
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 本地开发

```bash
npm run dev
```

访问 `http://localhost:5173/know-yourself/` 查看应用

### 生产构建

```bash
npm run build
```

构建结果输出到 `dist` 文件夹

### 预览生产版本

```bash
npm run preview
```

## 部署到GitHub Pages

### 自动部署（使用GitHub Actions）

项目已配置GitHub Actions工作流，每次推送到`main`分支时会自动构建和部署到GitHub Pages。

1. 确保你的仓库设置中，GitHub Pages指向`gh-pages`分支
2. 推送代码到main分支：
   ```bash
   git push origin main
   ```
3. GitHub Actions会自动构建并部署

### 手动部署

如果你想手动部署，可以使用以下命令：

```bash
npm run deploy
```

这将使用`gh-pages`包直接部署到GitHub Pages。

## 页面功能

### Page1 - 欢迎页面
- 欢迎来到Know Yourself应用
- 蓝色主题设计
- 导航到Page2

### Page2 - 探索页面
- 探索自我认知之旅
- 紫色主题设计
- 可返回Page1或前往Page3

### Page3 - 完成页面
- 发现更好的自己
- 绿色主题设计
- 可回到开始或返回前一页

## 访问应用

部署后，你可以在以下地址访问应用：
`https://yippee701.github.io/know-yourself/`

## 技术栈

| 技术 | 版本 | 描述 |
|------|------|------|
| React | ^19.2.0 | 前端框架 |
| React Router | ^7.11.0 | 路由管理 |
| Tailwind CSS | ^4.1.18 | CSS框架 |
| Vite | 7.2.5 | 构建工具 |
| Node.js | 18+ | 运行环境 |

## 开发工具

- **ESLint** - 代码检查
- **Tailwind CSS** - 样式工具
- **PostCSS** - CSS后处理器
- **Vite** - 高速开发服务器

## 脚本命令

- `npm run dev` - 启动开发服务器
- `npm run build` - 生产环境构建
- `npm run preview` - 预览生产构建
- `npm run lint` - 运行代码检查
- `npm run deploy` - 部署到GitHub Pages

## 浏览器兼容性

- Chrome (最新版)
- Firefox (最新版)
- Safari (最新版)
- Edge (最新版)
- 移动浏览器 (iOS Safari, Chrome Mobile等)

## 许可证

MIT

