@echo off
echo Automeo v0.1.0 启动脚本
echo.

echo [1/3] 启动 PostgreSQL 和 Redis...
cd config
docker-compose up -d postgres redis
cd ..

echo [2/3] 初始化数据库...
cd api
npx prisma generate
npx prisma db push
cd ..

echo [3/3] 启动后端服务...
cd api
node main.js
