# 飞书多维表格字段 Property 配置

本文件总结常见字段在创建或更新时的 `property` 结构。

当字段创建报错、选项字段配置失败、关联字段不生效时，优先查看这里。

## 基础字段

### 文本 `type=1`

```json
{
  "field_name": "任务描述",
  "type": 1,
  "property": {}
}
```

### 数字 `type=2`

```json
{
  "field_name": "工时",
  "type": 2,
  "property": {
    "formatter": "0.00"
  }
}
```

常见 `formatter`：

- `0`
- `0.0`
- `0.00`
- `0,000`
- `0.00%`

### 日期 `type=5`

```json
{
  "field_name": "截止日期",
  "type": 5,
  "property": {
    "date_formatter": "yyyy-MM-dd",
    "auto_fill": false
  }
}
```

## 选择字段

### 单选 `type=3`

```json
{
  "field_name": "状态",
  "type": 3,
  "property": {
    "options": [
      { "name": "待开始", "color": 0 },
      { "name": "进行中", "color": 20 },
      { "name": "已完成", "color": 10 }
    ]
  }
}
```

### 多选 `type=4`

```json
{
  "field_name": "标签",
  "type": 4,
  "property": {
    "options": [
      { "name": "紧急", "color": 0 },
      { "name": "重要", "color": 10 }
    ]
  }
}
```

## 常见特殊字段

### 人员 `type=11`

```json
{
  "field_name": "负责人",
  "type": 11,
  "property": {
    "multiple": false
  }
}
```

### 超链接 `type=15`

```json
{
  "field_name": "资料链接",
  "type": 15,
  "property": {}
}
```

### 附件 `type=17`

```json
{
  "field_name": "附件",
  "type": 17,
  "property": {}
}
```

### 单向关联 `type=18`

```json
{
  "field_name": "关联需求",
  "type": 18,
  "property": {
    "table_id": "tbl_xxx",
    "multiple": true
  }
}
```

### 双向关联 `type=21`

```json
{
  "field_name": "双向关联客户",
  "type": 21,
  "property": {
    "table_id": "tbl_xxx",
    "multiple": true
  }
}
```

## 复杂显示类型提示

### 进度

- 底层通常仍是数字字段
- 常见需要 `min` / `max`

### 货币

- 底层通常仍是数字字段
- 常见需要货币代码与格式化

### 评分

- 底层通常仍是数字字段
- 一般用整数值

## 排查建议

- 字段创建失败时，先核对 `type`
- 选项字段失败时，先核对 `options`
- 关联字段失败时，优先检查 `table_id`
- 更新字段时注意很多场景是全量覆盖 `property`
