---
name: feishu-fetch-doc
description: |
  当客户端代理已经接入远程 Lark/Feishu MCP 服务时，用于读取飞书 docx 文档内容，或先解析 wiki 再读取其真实 docx 对象。
---

# feishu-fetch-doc

在客户端代理侧读取飞书文档内容的技能。

本技能假设以下前提已经成立：

- 用户正在 Claude Code、Codex 或其他支持 Skill 的客户端中使用该技能
- 该客户端已经连接到你对外提供的远程 MCP HTTP 服务
- 该远程 MCP server 在客户端中的名称为 `xfchat-mcp`
- 远程 MCP 服务已经暴露出本文提到的工具名

本技能只负责指导代理如何使用这些远程 MCP 工具，不负责本地启动服务、安装服务端，或替客户端做连接配置。

当前范围：

- 读取 `docx` 文档纯文本
- 支持 `wiki` 链接或 token 的前置解析
- 实际读取通过远程 MCP 服务暴露的 `docx.v1.document.rawContent`

## 适用场景

- 用户给出飞书文档 URL，希望读取正文内容
- 用户给出飞书知识库 URL，但真实对象可能是 docx
- 用户给出文档 token，希望提取纯文本
- 客户端代理已经可以访问远程 MCP server 中的相关工具

## 依赖前提

如果当前客户端里看不到这些工具，先不要继续假设技能本身能完成读取。应先提示用户：

- 检查名为 `xfchat-mcp` 的远程 MCP HTTP 服务是否已正确接入客户端
- 检查该服务是否已暴露文档和 wiki 相关工具
- 确认当前会话对这些工具有可见性与调用权限

常见配置形态示例：

```json
{
  "mcpServers": {
    "xfchat-mcp": {
      "type": "streamableHttp",
      "url": "http://127.0.0.1:3000/mcp"
    }
  }
}
```

## 本技能依赖的远程 MCP 工具

以下工具名指的是客户端通过远程 MCP 服务可调用到的工具。

### 1. 文档读取

`docx.v1.document.rawContent`

用途：

- 获取 docx 文档纯文本内容

### 2. Wiki 前置解析

当输入是 wiki URL 或 wiki token 时，先使用：

`wiki.v2.space.getNode`

用途：

- 解析 wiki token 背后的真实对象类型
- 获取真实对象 token

## 输入规则

本技能支持以下输入：

- docx 文档 URL
- wiki URL
- docx token
- wiki token

示例：

- `https://xxx.feishu.cn/docx/doxcnXXXXXXXXXXXX`
- `https://xxx.feishu.cn/wiki/wikcnXXXXXXXXXXXX`
- `doxcnXXXXXXXXXXXX`
- `wikcnXXXXXXXXXXXX`

## 执行流程

### 情况 1：输入是 docx URL

1. 从 URL 中提取 docx token
2. 通过远程 MCP 工具调用 `docx.v1.document.rawContent`

推荐调用参数：

```json
{
  "document_id": "doxcnXXXXXXXXXXXX"
}
```

### 情况 2：输入是 docx token

1. 直接通过远程 MCP 工具调用 `docx.v1.document.rawContent`

```json
{
  "document_id": "doxcnXXXXXXXXXXXX"
}
```

### 情况 3：输入是 wiki URL 或 wiki token

1. 先提取 wiki token
2. 通过远程 MCP 工具调用 `wiki.v2.space.getNode`
3. 检查返回中的真实对象类型
4. 如果真实类型是 `docx`，继续通过远程 MCP 工具调用 `docx.v1.document.rawContent`
5. 如果真实类型不是 `docx`，明确告诉用户当前技能不处理该类型

## Wiki 处理约束

不能假设 wiki 一定对应 docx。

wiki 背后可能是：

- docx
- sheet
- bitable
- 其他知识库对象

第一版只处理：

- 真实对象类型为 `docx`

第一版暂不处理：

- `sheet`
- `bitable`
- 其他非 docx 对象

如果遇到非 `docx`，应返回清晰说明，例如：

`当前 feishu-fetch-doc 仅支持读取 docx 文档。该 wiki 实际类型不是 docx，请改用对应技能。`

## 返回结果要求

当调用成功时：

- 返回文档纯文本内容
- 保留必要的上下文说明
- 如果输入是 wiki，说明它已被解析为 docx 后再读取

当调用失败时：

- 说明失败发生在哪一步
- 是 token 提取失败、wiki 解析失败，还是远程 MCP 工具调用失败
- 如有远程 MCP 返回的原始报错，可附带简要错误信息

## 推荐回复风格

- 先给出文档内容或摘要
- 再说明读取来源与所使用的远程 MCP 工具
- 如果是 wiki，补一句“已解析为 docx”

## 示例

### 示例 1：读取 docx URL

用户：

`帮我读取这个飞书文档 https://xxx.feishu.cn/docx/doxcnXXXXXXXXXXXX`

执行：

1. 提取 `doxcnXXXXXXXXXXXX`
2. 通过远程 MCP 服务调用 `docx.v1.document.rawContent`

### 示例 2：读取 wiki URL

用户：

`帮我看一下这个知识库 https://xxx.feishu.cn/wiki/wikcnXXXXXXXXXXXX`

执行：

1. 提取 `wikcnXXXXXXXXXXXX`
2. 通过远程 MCP 服务调用 `wiki.v2.space.getNode`
3. 若返回真实对象类型为 `docx`
4. 通过远程 MCP 服务调用 `docx.v1.document.rawContent`

### 示例 3：wiki 实际不是 docx

如果 `wiki.v2.space.getNode` 返回的真实对象类型不是 `docx`：

- 不要继续假设可用 `docx.v1.document.rawContent`
- 明确告诉用户当前技能不支持该对象类型

## 非目标范围

第一版不包含：

- 多维表格读取
- 图片、附件、画板下载
- 富格式 Markdown 重建
- docx 以外对象的自动分流处理
- 远程 MCP 服务接入与客户端配置说明

这些能力后续由独立技能处理：

- `feishu-bitable`
- `feishu-create-doc`
- `feishu-update-doc`
