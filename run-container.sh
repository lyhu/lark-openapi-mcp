#!/usr/bin/env bash

echo "==== 启动 lark-openapi-mcp 容器 ===="

# 镜像名称和容器名称
IMAGE_NAME="lark-openapi-mcp:latest"
CONTAINER_NAME="lark-mcp-service"

# 检查镜像是否存在
if [[ "$(docker images -q ${IMAGE_NAME} 2> /dev/null)" == "" ]]; then
  echo "❌ 错误: 找不到镜像 ${IMAGE_NAME}。请先运行 ./build-image.sh 构建镜像。"
  exit 1
fi

# 清理可能存在的旧容器
if docker ps -a --format '{{.Names}}' | grep -Eq "^${CONTAINER_NAME}\$"; then
  echo "==> 删除已存在的旧容器..."
  docker rm -f ${CONTAINER_NAME}
fi

echo "==> 启动容器并注入参数..."

# 启动容器
docker run -d \
  --name ${CONTAINER_NAME} \
  -p 3000:3000 \
  --restart unless-stopped \
  ${IMAGE_NAME} \
  mcp \
  -a ${appId} \
  -s ${appSecret} \
  --domain https://open.xfchat.iflytek.com \
  --token-mode user_access_token \
  -m streamable \
  --host 0.0.0.0 \
  -p 3000 \
  -l zh

echo ""
echo "✅ 容器启动成功！"
echo "🌐 服务监听在可用端口 3000, 可以通过 http://127.0.0.1:3000 访问 (如果需要 OAuth Callback 等)。"
echo "📄 您可以使用以命令下方查看实时日志输出:"
echo "   docker logs -f ${CONTAINER_NAME}"
