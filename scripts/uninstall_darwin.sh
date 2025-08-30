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

read -r -p "是否进行卸载, 该操作会删除数据和配置文件(y/n)" uninstall
  if [ ! "$uninstall" = "y" ]; then
    echo "取消卸载"
    exit 0
  fi

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
echo "删除xinManager文件"
rm -rf "$xinManager_install_path" || { echo "删除xinManager文件失败"; exit 1; }
echo "xinManager文件已删除"
echo "卸载完成"
