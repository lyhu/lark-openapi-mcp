# 飞书多维表格场景示例

本文件给出常见的 Bitable 操作示例。

## 场景 1：创建多维表格 App

工具：

`bitable.v1.app.create`

示例：

```json
{
  "body": {
    "name": "客户管理系统",
    "folder_token": "fld_xxx"
  }
}
```

## 场景 2：创建数据表并一次性定义字段

工具：

`bitable.v1.appTable.create`

示例：

```json
{
  "path": {
    "app_token": "app_xxx"
  },
  "body": {
    "table": {
      "name": "客户管理表",
      "default_view_name": "全部客户",
      "fields": [
        { "field_name": "客户名称", "type": 1 },
        { "field_name": "负责人", "type": 11, "property": { "multiple": false } },
        { "field_name": "签约日期", "type": 5, "property": { "date_formatter": "yyyy-MM-dd" } },
        {
          "field_name": "状态",
          "type": 3,
          "property": {
            "options": [
              { "name": "进行中", "color": 0 },
              { "name": "已完成", "color": 10 }
            ]
          }
        }
      ]
    }
  }
}
```

## 场景 3：查询字段类型

工具：

`bitable.v1.appTableField.list`

示例：

```json
{
  "path": {
    "app_token": "app_xxx",
    "table_id": "tbl_xxx"
  }
}
```

用途：

- 获取字段 `field_id`
- 获取字段 `type`
- 获取字段 `ui_type`

## 场景 4：批量导入记录

工具：

`bitable.v1.appTableRecord.batchCreate`

示例：

```json
{
  "path": {
    "app_token": "app_xxx",
    "table_id": "tbl_xxx"
  },
  "body": {
    "records": [
      {
        "fields": {
          "客户名称": "Bytedance",
          "负责人": [{ "id": "ou_xxx" }],
          "签约日期": 1674206443000,
          "状态": "进行中"
        }
      },
      {
        "fields": {
          "客户名称": "Feishu",
          "负责人": [{ "id": "ou_yyy" }],
          "签约日期": 1675416243000,
          "状态": "已完成"
        }
      }
    ]
  }
}
```

## 场景 5：查询记录

简单列出：

工具：

`bitable.v1.appTableRecord.list`

```json
{
  "path": {
    "app_token": "app_xxx",
    "table_id": "tbl_xxx"
  }
}
```

带过滤查询：

工具：

`bitable.v1.appTableRecord.search`

```json
{
  "path": {
    "app_token": "app_xxx",
    "table_id": "tbl_xxx"
  },
  "body": {
    "filter": {
      "conjunction": "and",
      "conditions": [
        {
          "field_name": "状态",
          "operator": "is",
          "value": ["进行中"]
        }
      ]
    }
  }
}
```

## 场景 6：更新单条记录

工具：

`bitable.v1.appTableRecord.update`

```json
{
  "path": {
    "app_token": "app_xxx",
    "table_id": "tbl_xxx",
    "record_id": "rec_xxx"
  },
  "body": {
    "fields": {
      "状态": "已完成",
      "截止日期": 1772121600000
    }
  }
}
```

## 场景 7：批量更新记录

工具：

`bitable.v1.appTableRecord.batchUpdate`

```json
{
  "path": {
    "app_token": "app_xxx",
    "table_id": "tbl_xxx"
  },
  "body": {
    "records": [
      {
        "record_id": "rec_1",
        "fields": {
          "状态": "已完成"
        }
      },
      {
        "record_id": "rec_2",
        "fields": {
          "状态": "已暂停"
        }
      }
    ]
  }
}
```

## 场景 8：删除默认空行

先列出记录：

`bitable.v1.appTableRecord.list`

再批量删除空记录：

`bitable.v1.appTableRecord.batchDelete`

```json
{
  "path": {
    "app_token": "app_xxx",
    "table_id": "tbl_xxx"
  },
  "body": {
    "records": ["rec_empty_1", "rec_empty_2"]
  }
}
```

## 使用建议

- 先查字段，再写记录
- 先清理空行，再做批量导入
- 批量操作尽量控制在 500 条以内
- 同一张表尽量串行写入
