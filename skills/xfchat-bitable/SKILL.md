---
name: feishu-bitable
description: |
  当客户端代理已经接入远程 Lark/Feishu MCP 服务时，用于创建、查询、编辑和管理飞书多维表格（Bitable）。
---

# Feishu Bitable SKILL

在客户端代理侧操作飞书多维表格 App、数据表、字段、记录、视图的技能。

本技能假设以下前提已经成立：

- 用户正在 Claude Code、Codex 或其他支持 Skill 的客户端中使用该技能
- 该客户端已经连接到你对外提供的远程 MCP HTTP 服务
- 该远程 MCP server 在客户端中的名称为 `xfchat-mcp`
- 远程 MCP 服务已经暴露出本文提到的 `bitable.v1.*` 工具

本技能只负责指导代理如何使用这些远程 MCP 工具，不负责本地启动服务、安装服务端，或替客户端做连接配置。

## 适用场景

- 需要创建或管理多维表格 App
- 需要新增、查询、修改、删除记录
- 需要管理字段、数据表、视图
- 用户提到“多维表格”“bitable”“数据表”“记录”“字段”
- 需要批量导入或批量更新多维表格
- 客户端代理已经可以访问远程 MCP server 中的相关工具

## 依赖前提

如果当前客户端里看不到这些工具，先不要继续假设技能本身能完成操作。应先提示用户：

- 检查名为 `xfchat-mcp` 的远程 MCP HTTP 服务是否已正确接入客户端
- 检查该服务是否已暴露 `bitable.v1.*` 相关工具
- 确认当前会话对这些工具有可见性与调用权限

常见配置形态示例：

```json
{
  "mcpServers": {
    "xfchat-mcp": {
      "type": "streamableHttp",
      "url": "http://<your-host>:<your-port>/mcp"
    }
  }
}
```

## 本技能依赖的远程 MCP 工具

以下工具名指的是客户端通过远程 MCP 服务可调用到的工具。

## 执行前必读

- 创建数据表支持两种模式：
  - 字段需求明确时，优先通过远程 MCP 工具调用 `bitable.v1.appTable.create` 一次性定义字段
  - 探索式场景时，先建表再逐步增改字段
- 默认表可能存在空记录，批量写入前建议先通过远程 MCP 工具列出并删除空行
- 写记录前，先通过远程 MCP 工具调用 `bitable.v1.appTableField.list` 确认字段 `type` / `ui_type`
- 人员字段默认用 open_id，值格式必须是 `[{ "id": "ou_xxx" }]`
- 日期字段必须使用 Unix 毫秒时间戳
- 单选字段是字符串，多选字段是字符串数组
- 附件字段必须先上传到当前多维表格，再使用返回的 `file_token`
- 批量操作单次不要超过 500 条，超出时分批
- 同一张表不建议并发写，尽量串行执行

## 快速索引：意图 → 工具

| 用户意图 | 远程 MCP 工具 | 关键参数 |
|---------|---------|---------|
| 创建多维表格 | `bitable.v1.app.create` | `body.name`, `body.folder_token` |
| 获取多维表格元数据 | `bitable.v1.app.get` | `path.app_token` |
| 列出数据表 | `bitable.v1.appTable.list` | `path.app_token` |
| 创建数据表 | `bitable.v1.appTable.create` | `path.app_token`, `body.table` |
| 列出字段 | `bitable.v1.appTableField.list` | `path.app_token`, `path.table_id` |
| 创建字段 | `bitable.v1.appTableField.create` | `path.app_token`, `path.table_id`, `body.field_name`, `body.type` |
| 列出记录 | `bitable.v1.appTableRecord.list` | `path.app_token`, `path.table_id` |
| 查询记录 | `bitable.v1.appTableRecord.search` | `path.app_token`, `path.table_id`, `body.filter` |
| 创建记录 | `bitable.v1.appTableRecord.create` | `path.app_token`, `path.table_id`, `body.fields` |
| 批量创建记录 | `bitable.v1.appTableRecord.batchCreate` | `path.app_token`, `path.table_id`, `body.records` |
| 更新记录 | `bitable.v1.appTableRecord.update` | `path.app_token`, `path.table_id`, `path.record_id`, `body.fields` |
| 批量更新记录 | `bitable.v1.appTableRecord.batchUpdate` | `path.app_token`, `path.table_id`, `body.records` |
| 删除记录 | `bitable.v1.appTableRecord.delete` | `path.app_token`, `path.table_id`, `path.record_id` |
| 批量删除记录 | `bitable.v1.appTableRecord.batchDelete` | `path.app_token`, `path.table_id`, `body.records` |
| 列出视图 | `bitable.v1.appTableView.list` | `path.app_token`, `path.table_id` |
| 创建视图 | `bitable.v1.appTableView.create` | `path.app_token`, `path.table_id`, `body.view_name`, `body.view_type` |

## 核心使用原则

### 1. 写记录前先查字段

强制流程：

1. 先通过远程 MCP 工具调用 `bitable.v1.appTableField.list`
2. 确认每个字段的 `type`、`ui_type`
3. 按字段类型构造正确的 `fields`

如果收到字段类型不匹配、转换失败等错误：

- 优先检查字段值格式
- 查阅 `references/record-values.md`

### 2. 建表有两种推荐路径

#### 路径 A：一次性定义字段

适合字段结构明确的场景：

- 通过远程 MCP 工具调用 `bitable.v1.appTable.create`
- 在 `body.table.fields` 里一次性声明字段

#### 路径 B：先建表再慢慢补字段

适合探索式场景：

- 先通过远程 MCP 工具调用 `bitable.v1.app.create` 或 `bitable.v1.appTable.create`
- 再通过远程 MCP 工具调用 `bitable.v1.appTableField.create` / `update`
- 最后写入数据

### 3. 默认空行问题

如果你通过创建 App 或默认表开始写数据：

1. 先通过远程 MCP 工具调用 `bitable.v1.appTableRecord.list`
2. 找出空记录
3. 用远程 MCP 工具调用 `bitable.v1.appTableRecord.batchDelete` 清掉
4. 再批量写入

## 最易错字段格式

| 字段类型 | 正确格式 | 常见错误 |
|---------|---------|---------|
| 人员 | `[{ "id": "ou_xxx" }]` | 传 `"ou_xxx"` |
| 日期 | `1674206443000` | 传日期字符串或秒时间戳 |
| 单选 | `"进行中"` | 传数组 |
| 多选 | `["A", "B"]` | 传单字符串 |
| 超链接 | `{ "text": "飞书", "link": "https://..." }` | 只传 URL 字符串 |
| 附件 | `[{ "file_token": "..." }]` | 传外部 URL |

## 常见工作流

### 场景 1：查询字段

优先调用：

`bitable.v1.appTableField.list`

目标：

- 获取 `field_id`
- 获取 `field_name`
- 获取 `type`
- 获取 `ui_type`
- 获取 `property`

### 场景 2：批量导入记录

顺序建议：

1. 通过远程 MCP 工具调用 `bitable.v1.appTableField.list`
2. 如有空行，调用 `bitable.v1.appTableRecord.list` 后再调用 `bitable.v1.appTableRecord.batchDelete`
3. 通过远程 MCP 工具调用 `bitable.v1.appTableRecord.batchCreate`

### 场景 3：按条件查询记录

推荐优先使用：

`bitable.v1.appTableRecord.search`

如果只是简单列出：

`bitable.v1.appTableRecord.list`

### 场景 4：更新一条或多条记录

- 单条：`bitable.v1.appTableRecord.update`
- 批量：`bitable.v1.appTableRecord.batchUpdate`

## 常见错误与处理

| 错误现象 | 常见原因 | 处理方式 |
|---------|---------|---------|
| 日期字段写入失败 | 不是毫秒时间戳 | 改成 Unix 毫秒时间戳 |
| 人员字段写入失败 | 人员值格式不对 | 改成 `[{id:"ou_xxx"}]` |
| 字段类型不匹配 | 没先查字段类型 | 先通过远程 MCP 工具调用 `appTableField.list` |
| 批量创建失败 | 单次过多 | 拆分批次 |
| 写冲突 | 同表并发写 | 改成串行 |
| 字段名不存在 | 字段名拼错 | 先重新列字段 |

## 返回结果要求

当调用成功时：

- 返回当前操作结果或关键数据
- 保留必要的上下文说明，例如 app、table、record 范围
- 说明本次使用了哪些远程 MCP 工具

当调用失败时：

- 说明失败发生在哪一步
- 说明是参数构造错误、字段格式错误，还是远程 MCP 工具调用失败
- 如有远程 MCP 返回的原始报错，可附带简要错误信息

## 参考文档

- [字段 Property 配置](./references/field-properties.md)
- [记录值格式](./references/record-values.md)
- [使用场景示例](./references/examples.md)

## 非目标范围

第一版不包含：

- 自动上传附件素材
- 复杂权限协作者管理
- 仪表盘高级配置
- 多维表格与文档/任务之间的联动自动化
- 远程 MCP 服务接入与客户端配置说明

## 建议输出风格

- 先说明当前要操作的 app/table
- 再说明将要调用的远程 MCP 工具
- 批量写入前提醒字段值格式要求
- 失败时明确指出是哪一个字段或哪一步失败
