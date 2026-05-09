# Dockerfile - 混合入侵检测系统前端
# 使用 Python 3 内置的 http.server 提供静态文件服务

FROM python:3.9-slim

# 设置工作目录
WORKDIR /app

# 复制静态文件到工作目录
COPY index.html /app/
COPY css/ /app/css/
COPY js/ /app/js/

# 暴露端口
EXPOSE 3000


# 直接运行 Python HTTP 服务器
CMD ["python3", "-m", "http.server", "3000", "--bind", "0.0.0.0"]