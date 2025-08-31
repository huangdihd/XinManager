@echo off
setlocal enabledelayedexpansion

set xinManager_install_path=%LocalAppData%\xinManager
set xinManager_download_addr="https://github.com/huangdihd/xinManager/releases/latest/download/xinManager.zip"

set node_version=v22.18.0
set node_install_path=%xinManager_install_path%\node
set "PATH=%node_install_path%;%PATH%"

set arch=%PROCESSOR_ARCHITECTURE%
if %arch%==AMD64  set "arch=x64"
if %arch%==ARM64  set "arch=arm64"
if %arch%==x86    set "arch=x86"
if %arch%==IA64   set "arch=ia64"

goto :main

:install_node
    if not %arch%==x64 if not %arch%==arm64 if not %arch%==x86 if not %arch%==ia64 (
      echo 不支持的架构：%PROCESSOR_ARCHITECTURE%。请手动安装 Node。
      exit /b 1
    )
    echo 开始安装node
    echo 安装目录: %node_install_path%
    mkdir "%node_install_path%" || ( echo 创建安装目录失败 & exit /b 1 )
    echo node版本: %node_version%
    cd /d "%node_install_path%" || ( echo 进入安装目录失败 & exit /b 1 )
    echo 下载node
    curl -L -o node.zip "https://nodejs.org/dist/%node_version%/node-%node_version%-win-%arch%.zip" || ( echo 下载node失败 & exit /b 1 )
    echo 解压node
    tar -xf node.zip || ( echo 解压node失败 & exit /b 1 )
    echo 删除node压缩包
    del node.zip || ( echo 删除node压缩包失败 & exit /b 1 )
    echo 移动node文件
    robocopy "node-%node_version%-win-%arch%" "." /E /MOVE /R:2 /W:1 >nul
    if %ERRORLEVEL% GEQ 8 ( echo 移动node文件失败 & exit /b 1 )
    echo node安装完成
    exit /b 0

:install_pnpm
    echo 开始安装pnpm
    npm install -g pnpm || ( echo 安装pnpm失败 & exit /b 1 )
    echo pnpm安装完成
    exit /b 0

:uninstall_xinManager
    echo 开始卸载xinManager
    if exist "%xinManager_install_path%\XinManagerSvc.exe" (
        echo 找到服务文件,尝试停止服务
        "%xinManager_install_path%\XinManagerSvc.exe" stop || ( echo 停止服务失败 & exit /b 1 )
        echo 服务已停止,尝试删除服务
        "%xinManager_install_path%\XinManagerSvc.exe" uninstall || ( echo 删除服务失败 & exit /b 1 )
        echo 服务已删除
    )
    set "EMPTY=%xinManager_install_path%\__empty__"
    if exist "%EMPTY%" (
        rd /s /q "%EMPTY%" || ( echo 删除临时文件夹失败 & exit /b 1 )
    )
    mkdir "%EMPTY%" || ( echo 创建临时文件夹失败 & exit /b 1 )

    echo 复制需要删除的文件至临时文件夹

    robocopy "%xinManager_install_path%" "%EMPTY%" /MIR ^
      /XD "%xinManager_install_path%\node" "%xinManager_install_path%\node_modules" "%xinManager_install_path%\web\node_modules" "%xinManager_install_path%\server\node_modules" "%xinManager_install_path%\logs" ^
      /XF "%xinManager_install_path%\config.json" "%xinManager_install_path%\prisma\bots.db" ^
      /R:1 /W:1 >nul
    if %ERRORLEVEL% GEQ 8 ( echo 移动需要卸载的文件至临时文件夹失败 & exit /b 1 )
    echo 删除临时文件夹
    rd /s /q "%EMPTY%" || ( echo 删除临时文件夹失败 & exit /b 1 )
    echo 卸载完成(未删除node相关文件,若需要删除请手动运行del %xinManager_install_path%)
    exit /b 0

:pnpm_install
    pnpm install || ( echo 安装依赖失败 & pause & exit /b 1 )

:generate_prisma_client
    pnpm prisma generate --schema=../prisma/schema.prisma || ( echo 生成prisma client失败 & pause & exit /b 1 )

:push_prisma_db
    pnpm prisma db push --schema=../prisma/schema.prisma || ( echo 推送prisma db失败 & pause & exit /b 1 )

:setup_service
    if not %arch%==x64 if not %arch%==x86 (
      echo 不支持的架构：%PROCESSOR_ARCHITECTURE%。请手动设置服务。
      exit /b 1
    )
    echo 使用WinSW设置服务
    echo 开始下载WinSW文件
    curl -L -o "XinManagerSvc.exe" ^
      "https://github.com/winsw/winsw/releases/latest/download/WinSW-%arch%.exe" || ( echo 下载WinSW文件失败 & exit /b 1 )
    echo 下载完成
    echo 开始设置服务
    echo ^<service^> > XinManagerSvc.xml
    echo   ^<id^>XinManagerSvc^</id^> >> XinManagerSvc.xml
    echo   ^<name^>XinManagerSvc^</name^> >> XinManagerSvc.xml
    echo   ^<description^>Xin Manager Service^</description^> >> XinManagerSvc.xml
    echo   ^<executable^>cmd.exe^</executable^> >> XinManagerSvc.xml
    echo   ^<arguments^>/c "%xinManager_install_path%\start.bat"^</arguments^> >> XinManagerSvc.xml
    echo   ^<workingdirectory^>%xinManager_install_path%^</workingdirectory^> >> XinManagerSvc.xml
    echo   ^<logpath^>%xinManager_install_path%\logs^</logpath^> >> XinManagerSvc.xml
    echo   ^<onfailure action="restart" delay="10 sec" /^> >> XinManagerSvc.xml
    echo ^</service^> >> XinManagerSvc.xml
    echo 开始安装服务
    XinManagerSvc.exe install || ( echo 安装服务失败 & exit /b 1 )
    echo 服务安装完成
    echo 开始启动服务
    XinManagerSvc.exe start || ( echo 启动服务失败 & exit /b 1 )
    echo 服务启动完成
    exit /b 0

:main
    echo 开始安装xinManager
    echo 安装目录: %xinManager_install_path%
    if exist "%xinManager_install_path%" (
        echo xinManager已安装
        set /p "uninstall=是否进行卸载, 该操作不会删除数据(y/n): "
        if /i "!uninstall!"=="y" (
            call :uninstall_xinManager || ( echo 卸载xinManager失败 & exit /b 1 )
        ) else (
            echo 取消卸载xinManager
            exit /b 0
        )
    ) else (
        mkdir "%xinManager_install_path%" || ( echo 创建安装目录失败 & exit /b 1 )
    )
    if not exist "%node_install_path%/node.exe" (
        echo node未安装
        rmdir /s /q "%node_install_path%"
        call :install_node || ( echo 安装node失败 & exit /b 1 )
    ) else (
        echo node已安装,跳过安装过程
    )
    if not exist "%node_install_path%/pnpm.cmd" (
        echo pnpm未安装
        call :install_pnpm || ( echo 安装pnpm失败 & exit /b 1 )
    ) else (
        echo pnpm已安装,跳过安装过程
    )

    cd /d "%xinManager_install_path%" || ( echo 进入安装目录失败 & exit /b 1 )
    echo 下载xinManager
    curl -L -o xinManager.zip "%xinManager_download_addr%" || ( echo 下载xinManager失败 & exit /b 1 )
    echo 解压xinManager
    tar -xf xinManager.zip || ( echo 解压xinManager失败 & exit /b 1 )
    echo 删除xinManager压缩包
    del xinManager.zip || ( echo 删除xinManager压缩包失败 & exit /b 1 )
    echo 安装server依赖
    cd /d server || ( echo 进入server目录失败 & pause & exit /b 1 )
    call :pnpm_install || ( echo 安装server依赖失败 & pause & exit /b 1 )

    echo 生成prisma client
    call :generate_prisma_client || ( echo 生成prisma client失败 & pause & exit /b 1 )

    echo 推送prisma db
    call :push_prisma_db || ( echo 推送prisma db失败 & pause & exit /b 1 )


    echo 安装总项目依赖
    cd /d .. || ( echo 进入总项目目录失败 & exit /b 1 )
    call :pnpm_install || ( echo 安装总项目依赖失败 & pause & exit /b 1 )

    echo 生成启动脚本
    echo @echo off > start.bat
    echo set "PATH=%node_install_path%;%%PATH%%" >> start.bat
    echo cd /d %xinManager_install_path% >> start.bat
    echo pnpm start:installed >> start.bat

    echo 启动脚本位于:%xinManager_install_path%\start.bat
    call :setup_service || ( echo 设置服务失败 & exit /b 1 )
    echo xinManager安装完成

    echo 访问 http://localhost:3000 即可开始使用

    echo 配置文件地址: %xinManager_install_path%\config.json

    type %xinManager_install_path%\config.json

    exit /b 0




