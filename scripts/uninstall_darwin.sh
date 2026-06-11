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

if [ "$(id -u)" -ne 0 ]; then
  echo "请用 root 或 sudo 运行"
  exit 1
fi

read -r -p "是否进行卸载, 该操作会删除数据和配置文件(y/n)" uninstall < /dev/tty
  if [ ! "$uninstall" = "y" ]; then
    echo "取消卸载"
    exit 0
  fi

cd "$xinManager_install_path" || { echo "进入安装目录失败"; exit 1; }
echo "开始卸载xinManager"
if launchctl print system/xin.bbtt.xinmanager > /dev/null 2>&1; then
  echo "找到xinManager服务, 尝试停止"
  launchctl bootout system/xin.bbtt.xinmanager || true
fi
rm -f /Library/LaunchDaemons/xin.bbtt.xinmanager.plist
# 清理旧版本错误安装到 root LaunchAgents 的服务
launchctl unload /var/root/Library/LaunchAgents/xin.bbtt.xinmanager.plist 2>/dev/null || true
rm -f /var/root/Library/LaunchAgents/xin.bbtt.xinmanager.plist
echo "删除xinManager文件"
rm -rf "$xinManager_install_path" || { echo "删除xinManager文件失败"; exit 1; }
echo "xinManager文件已删除"
echo "卸载完成"
