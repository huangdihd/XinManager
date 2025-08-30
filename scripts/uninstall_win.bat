@echo off
setlocal enabledelayedexpansion

set xinManager_install_path=%LocalAppData%\xinManager


set /p "uninstall=是否进行卸载, 该操作会删除数据(y/n): "
if /i not "!uninstall!"=="y" (
    echo 取消卸载xinManager
        exit /b 0
)
echo 开始卸载xinManager
if exist "%xinManager_install_path%\XinManagerSvc.exe" (
    echo 找到服务文件,尝试停止服务
    "%xinManager_install_path%\XinManagerSvc.exe" stop || ( echo 停止服务失败 & exit /b 1 )
    echo 服务已停止,尝试删除服务
    "%xinManager_install_path%\XinManagerSvc.exe" uninstall || ( echo 删除服务失败 & exit /b 1 )
    echo 服务已删除
)
echo 开始删除文件
rmdir /s /q "%xinManager_install_path%" || (echo 删除文件失败 & exit /b 1)
echo 删除完成
echo 卸载完成
exit /b 0