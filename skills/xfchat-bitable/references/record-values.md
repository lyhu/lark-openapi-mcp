# 飞书多维表格记录值格式

本文件说明写入记录时 `fields` 的常见值格式。

## 常见字段值速查

| 字段类型 | 写入格式 |
|---------|---------|
| 文本 | `"任务描述"` |
| 数字 | `12.5` |
| 单选 | `"进行中"` |
| 多选 | `["紧急", "重要"]` |
| 日期 | `1675526400000` |
| 复选框 | `true` |
| 人员 | `[{ "id": "ou_xxx" }]` |
| 电话 | `"17899870000"` |
| 超链接 | `{ "text": "飞书", "link": "https://www.feishu.cn" }` |
| 附件 | `[{ "file_token": "file_xxx" }]` |
| 关联 | `{ "link_record_ids": ["recxxx"] }` |

## 逐项说明

### 文本 `type=1`

```json
{
  "fields": {
    "任务描述": "维护客户关系"
  }
}
```

### 数字 `type=2`

```json
{
  "fields": {
    "工时": 10,
    "完成率": 0.75
  }
}
```

### 单选 `type=3`

```json
{
  "fields": {
    "状态": "进行中"
  }
}
```

### 多选 `type=4`

```json
{
  "fields": {
    "标签": ["审批", "办公"]
  }
}
```

### 日期 `type=5`

必须是 Unix 毫秒时间戳：

```json
{
  "fields": {
    "截止日期": 1675526400000
  }
}
```

### 复选框 `type=7`

```json
{
  "fields": {
    "是否完成": true
  }
}
```

### 人员 `type=11`

```json
{
  "fields": {
    "负责人": [
      { "id": "ou_xxx" }
    ]
  }
}
```

注意：

- 必须是数组
- 每个元素至少要有 `id`
- 不要只传字符串

### 超链接 `type=15`

```json
{
  "fields": {
    "资料链接": {
      "text": "飞书官网",
      "link": "https://www.feishu.cn"
    }
  }
}
```

### 附件 `type=17`

```json
{
  "fields": {
    "附件": [
      { "file_token": "file_xxx" }
    ]
  }
}
```

注意：

- 必须先上传文件到当前多维表格上下文
- 不能直接传外部 URL 或本地路径

### 关联字段 `type=18 / type=21`

```json
{
  "fields": {
    "关联需求": {
      "link_record_ids": ["recxxx", "recyyy"]
    }
  }
}
```

## 高风险错误

### 日期字段错误

错误做法：

```json
{
  "fields": {
    "截止日期": "2026-02-27"
  }
}
```

正确做法：

```json
{
  "fields": {
    "截止日期": 1772121600000
  }
}
```

### 人员字段错误

错误做法：

```json
{
  "fields": {
    "负责人": "ou_xxx"
  }
}
```

正确做法：

```json
{
  "fields": {
    "负责人": [
      { "id": "ou_xxx" }
    ]
  }
}
```

## 实践建议

写记录前总是先做这三步：

1. `bitable.v1.appTableField.list`
2. 根据字段类型构造值
3. 再执行 create / update / batchCreate / batchUpdate
