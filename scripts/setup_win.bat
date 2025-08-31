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
      echo ��֧�ֵļܹ���%PROCESSOR_ARCHITECTURE%�����ֶ���װ Node��
      exit /b 1
    )
    echo ��ʼ��װnode
    echo ��װĿ¼: %node_install_path%
    mkdir "%node_install_path%" || ( echo ������װĿ¼ʧ�� & exit /b 1 )
    echo node�汾: %node_version%
    cd /d "%node_install_path%" || ( echo ���밲װĿ¼ʧ�� & exit /b 1 )
    echo ����node
    curl -L -o node.zip "https://nodejs.org/dist/%node_version%/node-%node_version%-win-%arch%.zip" || ( echo ����nodeʧ�� & exit /b 1 )
    echo ��ѹnode
    tar -xf node.zip || ( echo ��ѹnodeʧ�� & exit /b 1 )
    echo ɾ��nodeѹ����
    del node.zip || ( echo ɾ��nodeѹ����ʧ�� & exit /b 1 )
    echo �ƶ�node�ļ�
    robocopy "node-%node_version%-win-%arch%" "." /E /MOVE /R:2 /W:1 >nul
    if %ERRORLEVEL% GEQ 8 ( echo �ƶ�node�ļ�ʧ�� & exit /b 1 )
    echo node��װ���
    exit /b 0

:install_pnpm
    echo ��ʼ��װpnpm
    npm install -g pnpm || ( echo ��װpnpmʧ�� & exit /b 1 )
    echo pnpm��װ���
    exit /b 0

:uninstall_xinManager
    echo ��ʼж��xinManager
    if exist "%xinManager_install_path%\XinManagerSvc.exe" (
        echo �ҵ������ļ�,����ֹͣ����
        "%xinManager_install_path%\XinManagerSvc.exe" stop || ( echo ֹͣ����ʧ�� & exit /b 1 )
        echo ������ֹͣ,����ɾ������
        "%xinManager_install_path%\XinManagerSvc.exe" uninstall || ( echo ɾ������ʧ�� & exit /b 1 )
        echo ������ɾ��
    )
    set "EMPTY=%xinManager_install_path%\__empty__"
    if exist "%EMPTY%" (
        rd /s /q "%EMPTY%" || ( echo ɾ����ʱ�ļ���ʧ�� & exit /b 1 )
    )
    mkdir "%EMPTY%" || ( echo ������ʱ�ļ���ʧ�� & exit /b 1 )

    echo ������Ҫɾ�����ļ�����ʱ�ļ���

    robocopy "%xinManager_install_path%" "%EMPTY%" /MIR ^
      /XD "%xinManager_install_path%\node" "%xinManager_install_path%\node_modules" "%xinManager_install_path%\web\node_modules" "%xinManager_install_path%\server\node_modules" "%xinManager_install_path%\logs" ^
      /XF "%xinManager_install_path%\config.json" "%xinManager_install_path%\prisma\bots.db" ^
      /R:1 /W:1 >nul
    if %ERRORLEVEL% GEQ 8 ( echo �ƶ���Ҫж�ص��ļ�����ʱ�ļ���ʧ�� & exit /b 1 )
    echo ɾ����ʱ�ļ���
    rd /s /q "%EMPTY%" || ( echo ɾ����ʱ�ļ���ʧ�� & exit /b 1 )
    echo ж�����(δɾ��node����ļ�,����Ҫɾ�����ֶ�����del %xinManager_install_path%)
    exit /b 0

:pnpm_install
    pnpm install || ( echo ��װ����ʧ�� & pause & exit /b 1 )

:generate_prisma_client
    pnpm prisma generate --schema=../prisma/schema.prisma || ( echo ����prisma clientʧ�� & pause & exit /b 1 )

:push_prisma_db
    pnpm prisma db push --schema=../prisma/schema.prisma || ( echo ����prisma dbʧ�� & pause & exit /b 1 )

:setup_service
    if not %arch%==x64 if not %arch%==x86 (
      echo ��֧�ֵļܹ���%PROCESSOR_ARCHITECTURE%�����ֶ����÷���
      exit /b 1
    )
    echo ʹ��WinSW���÷���
    echo ��ʼ����WinSW�ļ�
    curl -L -o "XinManagerSvc.exe" ^
      "https://github.com/winsw/winsw/releases/latest/download/WinSW-%arch%.exe" || ( echo ����WinSW�ļ�ʧ�� & exit /b 1 )
    echo �������
    echo ��ʼ���÷���
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
    echo ��ʼ��װ����
    XinManagerSvc.exe install || ( echo ��װ����ʧ�� & exit /b 1 )
    echo ����װ���
    echo ��ʼ��������
    XinManagerSvc.exe start || ( echo ��������ʧ�� & exit /b 1 )
    echo �����������
    exit /b 0

:main
    echo ��ʼ��װxinManager
    echo ��װĿ¼: %xinManager_install_path%
    if exist "%xinManager_install_path%" (
        echo xinManager�Ѱ�װ
        set /p "uninstall=�Ƿ����ж��, �ò�������ɾ������(y/n): "
        if /i "!uninstall!"=="y" (
            call :uninstall_xinManager || ( echo ж��xinManagerʧ�� & exit /b 1 )
        ) else (
            echo ȡ��ж��xinManager
            exit /b 0
        )
    ) else (
        mkdir "%xinManager_install_path%" || ( echo ������װĿ¼ʧ�� & exit /b 1 )
    )
    if not exist "%node_install_path%/node.exe" (
        echo nodeδ��װ
        rmdir /s /q "%node_install_path%"
        call :install_node || ( echo ��װnodeʧ�� & exit /b 1 )
    ) else (
        echo node�Ѱ�װ,������װ����
    )
    if not exist "%node_install_path%/pnpm.cmd" (
        echo pnpmδ��װ
        call :install_pnpm || ( echo ��װpnpmʧ�� & exit /b 1 )
    ) else (
        echo pnpm�Ѱ�װ,������װ����
    )

    cd /d "%xinManager_install_path%" || ( echo ���밲װĿ¼ʧ�� & exit /b 1 )
    echo ����xinManager
    curl -L -o xinManager.zip "%xinManager_download_addr%" || ( echo ����xinManagerʧ�� & exit /b 1 )
    echo ��ѹxinManager
    tar -xf xinManager.zip || ( echo ��ѹxinManagerʧ�� & exit /b 1 )
    echo ɾ��xinManagerѹ����
    del xinManager.zip || ( echo ɾ��xinManagerѹ����ʧ�� & exit /b 1 )
    echo ��װserver����
    cd /d server || ( echo ����serverĿ¼ʧ�� & pause & exit /b 1 )
    call :pnpm_install || ( echo ��װserver����ʧ�� & pause & exit /b 1 )

    echo ����prisma client
    call :generate_prisma_client || ( echo ����prisma clientʧ�� & pause & exit /b 1 )

    echo ����prisma db
    call :push_prisma_db || ( echo ����prisma dbʧ�� & pause & exit /b 1 )


    echo ��װ����Ŀ����
    cd /d .. || ( echo ��������ĿĿ¼ʧ�� & exit /b 1 )
    call :pnpm_install || ( echo ��װ����Ŀ����ʧ�� & pause & exit /b 1 )

    echo ���������ű�
    echo @echo off > start.bat
    echo set "PATH=%node_install_path%;%%PATH%%" >> start.bat
    echo cd /d %xinManager_install_path% >> start.bat
    echo pnpm start:installed >> start.bat

    echo �����ű�λ��:%xinManager_install_path%\start.bat
    call :setup_service || ( echo ���÷���ʧ�� & exit /b 1 )
    echo xinManager��װ���

    echo ���� http://localhost:3000 ���ɿ�ʼʹ��

    echo �����ļ���ַ: %xinManager_install_path%\config.json

    type %xinManager_install_path%\config.json

    exit /b 0




