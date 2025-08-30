#!/bin/bash

#
#   Copyright (C) 2025 huangdihd
#
#   This program is free software: you can redistribute it and/or modify
#   it under the terms of the GNU General Public License as published by
#   the Free Software Foundation, either version 3 of the License, or
#   (at your option) any later version.
#
#   This program is distributed in the hope that it will be useful,
#   but WITHOUT ANY WARRANTY; without even the implied warranty of
#   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#   GNU General Public License for more details.
#
#   You should have received a copy of the GNU General Public License
#   along with this program.  If not, see <https://www.gnu.org/licenses/>.
#

xinManager_install_path="/opt/xinManager"
xinManager_download_addr="https://github.com/huangdihd/xinManager/releases/latest/download/xinManager.zip"

node_version=v22.18.0

node_install_path="$xinManager_install_path/node"
node_path="$node_install_path/bin/node"
npm_path="$node_install_path/bin/npm"
pnpm_path="$node_install_path/bin/pnpm"
npm_command="env $node_path $npm_path"
pnpm_command="env $node_path $pnpm_path"

arch=$(uname -m)

install_node() {
  arch=$(uname -m)
  case "$arch" in
    x86_64)  arch="x64" ;;
    aarch64) arch="arm64" ;;
    armv7l)  arch="armv7l" ;;
    ppc64le) arch="ppc64le" ;;
    s390x)   arch="s390x" ;;
    *)
      err "不支持的架构：$(uname -m)。请手动安装 Node。"
      exit 1
      ;;
  esac
  echo "开始安装node"
  echo "安装目录: $node_install_path"
  mkdir "$node_install_path" || { echo "创建安装目录失败"; exit 1; }
  echo "node版本: $node_version"
  cd "$node_install_path" || { echo "进入安装目录失败"; exit 1; }
  echo "下载node"
  curl -L -o node.tar.gz "https://nodejs.org/dist/$node_version/node-$node_version-linux-$arch.tar.gz" || { echo "下载node失败"; exit 1; }
  echo "解压node"
  tar -xzvf node.tar.gz >> /dev/null || { echo "解压node失败"; exit 1; }
  echo "删除node压缩包"
  rm node.tar.gz || { echo "删除node压缩包失败"; exit 1; }
  echo "移动node文件"
  mv "node-$node_version-linux-$arch"/* . || { echo "移动node文件失败"; exit 1; }
  echo "删除node缓存目录"
  rm -rf "node-$node_version-linux-$arch" || { echo "删除node缓存目录失败"; exit 1; }
  echo "node安装完成"
}

install_pnpm() {
  echo "开始安装pnpm"
  $npm_command install -g pnpm || { echo "安装pnpm失败"; exit 1; }
  echo "pnpm安装完成"
}

uninstall_xinManager() {
  cd "$xinManager_install_path" || { echo "进入安装目录失败"; exit 1; }
  echo "开始卸载xinManager"
  if systemctl list-unit-files | grep -q "^xinmanager.service"; then
    echo "找到xinManager服务文件"
    if systemctl is-active --quiet "xinmanager.service"; then
      echo "xinManager服务正在运行, 尝试停止"
      systemctl stop xinmanager.service || { echo "停止xinManager服务失败"; exit 1; }
    fi
    echo "xinManager服务已停止"
    echo "尝试禁用xinManager服务"
    systemctl disable xinmanager.service || { echo "禁用xinManager服务失败"; exit 1; }
    echo "xinManager服务已禁用"
    echo "尝试删除xinManager服务文件"
    rm -f /etc/systemd/system/xinmanager.service || { echo "删除xinManager服务文件失败"; exit 1; }
    echo "xinManager服务文件已删除"
    echo "尝试重新加载systemd"
    systemctl daemon-reload || { echo "重新加载systemd失败"; exit 1; }
    echo "systemd已重新加载"
  fi
  find . -mindepth 1 \
    ! -path './config.json' \
    ! -path './prisma/bots.db' \
    ! -path './node' \
    ! -path './node/*' \
    ! -path './node_modules' \
    ! -path './node_modules/*' \
    ! -path './web/node_modules' \
    ! -path './web/node_modules/*' \
    ! -path './server/node_modules' \
    ! -path './server/node_modules/*' \
    -exec rm -rf {} + >> /dev/null
  echo "卸载完成(未删除node相关文件,若需要删除请手动运行\"sudo rm -rf $xinManager_install_path\")"
}

if [ "$(id -u)" -ne 0 ]; then
  echo "请用 root 或 sudo 运行"
  exit 1
fi


echo "开始安装xinManager"
echo "安装目录: $xinManager_install_path"

# 检查是否已安装xinManager
if [ -d "$xinManager_install_path" ]; then
    echo "xinManager已安装"
    read -r -p "是否进行卸载, 该操作不会删除数据(y/n)" uninstall
    if [ "$uninstall" = "y" ]; then
        uninstall_xinManager
    else
        echo "取消卸载"
        exit 0
    fi
else
    mkdir "$xinManager_install_path" || { echo "创建安装目录失败"; exit 1; }
fi

cd "$xinManager_install_path" || { echo "进入安装目录失败"; exit 1; }

# 安装node

if [ ! -x "$node_path" ]; then
    echo "node未安装"
    rm -rf "$node_install_path" >> /dev/null
    install_node || { echo "安装node失败"; exit 1; }
else
    echo "node已安装,跳过安装过程"
fi

# 安装pnpm
if [ ! -x "$pnpm_path" ]; then
    echo "pnpm未安装"
    install_pnpm || { echo "安装pnpm失败"; exit 1; }
else
    echo "pnpm已安装,跳过安装过程"
fi

cd "$xinManager_install_path" || { echo "进入安装目录失败"; exit 1; }

echo "下载xinManager"
curl -L -o xinManager.zip "$xinManager_download_addr" || { echo "下载xinManager失败"; exit 1; }

echo "解压xinManager"
unzip xinManager.zip -d . -x "prisma/bots.db" "config.json" >> /dev/null || { echo "解压xinManager失败"; exit 1; }

echo "安装server依赖"
cd server || { echo "进入server目录失败"; exit 1; }
$pnpm_command install --dangerously-allow-all-builds || { echo "安装server依赖失败"; exit 1; }

echo "生成prisma client"
PATH="$node_install_path/bin:$PATH" $pnpm_command prisma generate --schema=../prisma/schema.prisma || { echo "生成prisma client失败"; exit 1; }

echo "推送prisma db"
PATH="$node_install_path/bin:$PATH" $pnpm_command prisma db push --schema=../prisma/schema.prisma || { echo "推送prisma db失败"; exit 1; }

cd ..

echo "安装总项目依赖"
$pnpm_command install || { echo "安装总项目依赖失败"; exit 1; }

echo "生成启动脚本"
cat << EOF > start.sh || { echo "生成启动脚本失败"; exit 1; }
#!/bin/bash
cd "$xinManager_install_path"
$pnpm_command start:installed
EOF
chmod +x start.sh || { echo "设置启动脚本权限失败"; exit 1; }

echo "启动脚本位于:$xinManager_install_path/start.sh"

echo "使用systemd管理xinManager"

cat << EOF > /etc/systemd/system/xinmanager.service || { echo "生成systemd服务文件失败"; exit 1; }
[Unit]
Description=XinManager Service
After=network.target

[Service]
User=$(whoami)
Group=$(whoami)

WorkingDirectory=$xinManager_install_path

ExecStart=$xinManager_install_path/start.sh

Restart=always
RestartSec=5

StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

echo "xinManager 服务创建成功"

systemctl daemon-reload || { echo "重新加载systemd失败"; exit 1; }

systemctl enable xinmanager.service || { echo "启用xinManager服务失败"; exit 1; }
systemctl start xinmanager.service || { echo "启动xinManager服务失败"; exit 1; }

echo "xinManager 服务已启动, 可以使用 systemctl status xinmanager.service 查看服务状态"

echo "xinManager安装完成"

echo "访问 http://localhost:3000 即可开始使用"

echo "配置文件地址: $xinManager_install_path/config.json"

cat "$xinManager_install_path/config.json"
