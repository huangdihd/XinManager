@echo off
setlocal enabledelayedexpansion

set xinManager_install_path=%LocalAppData%\xinManager


set /p "uninstall=�Ƿ����ж��, �ò�����ɾ������(y/n): "
if /i not "!uninstall!"=="y" (
    echo ȡ��ж��xinManager
        exit /b 0
)
echo ��ʼж��xinManager
if exist "%xinManager_install_path%\XinManagerSvc.exe" (
    echo �ҵ������ļ�,����ֹͣ����
    "%xinManager_install_path%\XinManagerSvc.exe" stop || ( echo ֹͣ����ʧ�� & exit /b 1 )
    echo ������ֹͣ,����ɾ������
    "%xinManager_install_path%\XinManagerSvc.exe" uninstall || ( echo ɾ������ʧ�� & exit /b 1 )
    echo ������ɾ��
)
echo ��ʼɾ���ļ�
rmdir /s /q "%xinManager_install_path%" || (echo ɾ���ļ�ʧ�� & exit /b 1)
echo ɾ�����
echo ж�����
exit /b 0