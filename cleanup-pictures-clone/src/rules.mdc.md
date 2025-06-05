# 项目开发规则（rules.mdc）

---

## 一、协作规范

- 所有开发任务需在 `todo.md` 记录，完成后及时更新。
- 重要架构、业务变更需在 `summary.md` 记录。
- 代码、文档、静态资源等均需按功能模块归类存放。
- 采用中英文注释，关键业务逻辑需详细说明。

---

## 二、代码风格

- 统一使用 TypeScript，严格类型检查。
- 代码风格遵循 Biome、ESLint 规则，提交前需通过 lint 检查。
- UI 统一使用 Tailwind CSS + shadcn/ui。
- 图片资源全部放置于 public 目录，引用路径相对 public 根。

---

## 三、分工建议

- 页面开发：`src/app/` 目录下按路由分文件夹，每人负责独立页面或功能块。
- 组件开发：`src/components/` 目录下按业务/通用组件分组，复用优先。
- 工具函数与API：`src/lib/` 目录下统一管理，AI相关API集中于 ai-api.ts。

---

## 四、提交要求

- 每次提交需附带清晰 commit message，描述本次变更内容。
- 功能开发需附带简单测试或演示说明。
- 禁止提交 .env、密钥等敏感信息。

---

## 五、分支管理

- 主分支：main（仅合并稳定、可上线代码）
- 开发分支：feature/xxx、fix/xxx、refactor/xxx
- 合并需发起 Pull Request，至少一人 Code Review 后方可合并。

---

## 六、代码审查

- 重点关注类型安全、边界处理、性能优化、可读性。
- 发现问题及时沟通，必要时同步到 summary.md。

---

## 七、常见问题处理

- 依赖安装、启动、构建等问题优先查阅 README.md、summary.md。
- AI图片API、图片路径、样式冲突等常见问题在 summary.md 归档。
- 重大 bug 需在 todo.md 标记并跟踪解决进度。

---

## 八、参考

- [Next.js 官方文档](https://nextjs.org/docs)
- [shadcn/ui 文档](https://ui.shadcn.com/)
- [Stagewise Dev Tool](https://stagewise.dev/)

如有新规则或优化建议，请及时补充本文件。 