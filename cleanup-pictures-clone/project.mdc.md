# Cleanup Pictures Clone 项目文档（mdc）

---

## 一、项目简介

本项目基于 Next.js 15，旨在实现 AI 图片生成、前后对比展示、风格化处理及周边定制等功能，支持图片上传、AI 生成、风格选择、结果预览等业务场景。

---

## 二、技术栈

- **前端框架**：Next.js 15（App Router 架构）
- **UI 组件**：shadcn/ui、Tailwind CSS、lucide-react
- **AI 工具栏**：@stagewise/toolbar-next（仅开发环境）
- **类型系统**：TypeScript
- **代码规范**：Biome、ESLint
- **部署**：Netlify
- **数据分析支持**：可选 Python 3.12 + Dash + Pandas + Numpy

---

## 三、目录结构

```text
cleanup-pictures-clone/
├── src/                # 前端主代码
│   ├── app/            # 页面、布局、全局样式
│   ├── components/     # 页面级与复用组件
│   ├── lib/            # 工具函数与AI API
│   └── .cursorrules    # 协作与开发规则
├── public/             # 静态资源
├── node_modules/       # 依赖包
├── package.json        # Node依赖与脚本
├── tsconfig.json       # TypeScript配置
├── next.config.js      # Next.js配置
├── tailwind.config.ts  # Tailwind CSS配置
├── postcss.config.mjs  # PostCSS配置
├── biome.json          # Biome代码规范
├── eslint.config.mjs   # ESLint配置
├── netlify.toml        # Netlify部署
├── components.json     # shadcn/ui配置
├── .gitignore          # Git忽略
├── README.md           # 项目说明
├── todo.md             # 任务清单
├── summary.md          # 项目总结
└── project.mdc.md      # 本文档
```

---

## 四、主要配置文件说明

- **package.json**：依赖、脚本、项目元信息
- **tsconfig.json**：TypeScript 编译与路径别名
- **next.config.js**：图片域名白名单、Next.js 相关配置
- **tailwind.config.ts**：主题色、动画、字体等 Tailwind 配置
- **postcss.config.mjs**：集成 Tailwind 的 PostCSS 配置
- **biome.json**：代码风格、格式化、Lint 规则
- **eslint.config.mjs**：ESLint 规则，适配 Next.js + TypeScript
- **components.json**：shadcn/ui 组件库配置
- **netlify.toml**：Netlify 部署命令与插件
- **.gitignore**：版本控制忽略规则

---

## 五、开发规范

1. **优先使用 App Router 与 Server Components**
2. **类型安全**：全项目 TypeScript 严格模式
3. **代码风格**：Biome + ESLint 双重保障
4. **UI 规范**：Tailwind + shadcn/ui 统一风格
5. **图片资源**：全部放置于 public 目录
6. **AI 工具栏**：仅开发环境下可见
7. **任务推进**：所有开发任务记录于 todo.md，完成后及时更新
8. **总结与优化**：每阶段总结写入 summary.md

---

## 六、部署说明

- 本地开发：
  ```bash
  cd cleanup-pictures-clone
  npm run dev
  # 或 bun dev
  ```
- 生产部署：
  - 推荐使用 Netlify，已配置 netlify.toml
  - 构建命令：`bun run build`，发布目录：`.next`

---

## 七、数据分析支持（可选）

如需 Python 数据分析/可视化支持，建议在项目根目录新增：
- `pyproject.toml`（推荐 uv 管理）
- `requirements.txt`（兼容传统 Python 环境）
- 推荐依赖：numpy、pandas、dash、plotly

---

## 八、参考与文档

- [Next.js 官方文档](https://nextjs.org/docs)
- [shadcn/ui 文档](https://ui.shadcn.com/)
- [Stagewise Dev Tool](https://stagewise.dev/)
- [Netlify 部署文档](https://docs.netlify.com/)

---

如需补充/调整请随时告知。 