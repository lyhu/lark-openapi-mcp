# OpenClaw 接入飞书/Lark MCP 服务部署与配置指南

本指南按部署顺序分为两个标准阶段。

---

## 阶段 1：设置 OpenClaw 引擎

确立 `xfchat-mcp` 底层验证无误（或已知仅因为 IP 拦截）后，即可在 OpenClaw 的配置文件内将其串联挂载，并为对应的 Agent 开放权限。

> **⚠️ 核心配置修改原则：**
> - **增量配置**：绝对不得删除系统内已有的配置内容。
> - **追加去重**：对于 `tools.alsoAllow` 数组，请执行追加操作并自动去重，勿覆盖已有项。
> - **容错合并**：如 `mcp.servers.xfchat-mcp` 服务结构已存在，仅补齐确实的字段。
> - **生效规则**：**所有变更保存后，必须重启 OpenClaw Gateway 服务以重载配置。**

### 1.1 开启系统的 MCP 能力
确保 OpenClaw 全局配置中已开启 MCP 特性支持：
```json
"commands": {
  "mcp": true
}
```

### 1.2 注册远程服务
定位到配置文件中的 `mcp.servers` 区块，添加我们刚才部署的本地 `xfchat-mcp` 寻址定义：
```json
"xfchat-mcp": {
  "transport": "streamable-http",
  "url": "http://127.0.0.1:3000/mcp",
  "headers": {}
}
```

### 1.3 为 `main` Agent 放行必备工具
进入 `agents.list` 寻找到 `id = "main"` 的配置区块。针对它的 `tools.alsoAllow` 字段，扩充并包含以下 15 项必备飞书节点能力：
```json
[
  "bitable_v1_app_create",
  "bitable_v1_appTable_create",
  "bitable_v1_appTableField_list",
  "bitable_v1_appTable_list",
  "bitable_v1_appTableRecord_create",
  "bitable_v1_appTableRecord_search",
  "bitable_v1_appTableRecord_update",
  "docx_v1_document_rawContent",
  "drive_v1_permissionMember_create",
  "im_v1_chat_list",
  "im_v1_chatMembers_get",
  "wiki_v1_node_search",
  "wiki_v2_space_getNode",
  "docx_builtin_search",
  "docx_builtin_import"
]
```

重启 Openclaw。

---

## 阶段 2：功能最终拨测

在 UI 界面或 Agent 中输入以下测试指令，验证全链路是否打通：

> "[使用xfchat-mcp] 请帮我总结一下这个文档的内容：https://yf2ljykclb.xfchat.iflytek.com/docx/doxrzu4rTqMuVCSV6tgdeZNBn7d?from=from_copylink"

