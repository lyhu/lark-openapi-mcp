#!/usr/bin/env bash

set -e

echo "==== 构建 lark-openapi-mcp Docker 镜像 ===="

# 默认情况下使用标准 build 构建适合当前机器架构的镜像
echo "==> 正在构建本地架构使用的镜像..."
docker build -t lark-openapi-mcp:latest .

echo ""
echo "【跨平台构建说明】"
echo "如果你需要构建包含多架构 (linux/amd64, linux/arm64) 的镜像，并且推送到镜像仓库，可以使用 buildx："
echo "  1. 创建构建器 (仅需执行一次)："
echo "     docker buildx create --use"
echo "  2. 构建多架构并推送到仓库 (注意：由于 Docker 限制，多架构镜像默认不能通过 --load 直接加载到本地镜像列表中，必须 --push)："
echo "     docker buildx build --platform linux/amd64,linux/arm64 -t your-registry/lark-openapi-mcp:latest --push ."
echo "  3. 如果只是想在当前 (比如 macOS M系列) 机器上打出 amd64 包并加载到本地："
echo "     docker buildx build --platform linux/amd64 -t lark-openapi-mcp:latest-amd64 --load ."
echo ""
echo "==== 构建完毕 ===="
