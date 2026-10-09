@echo off
rem Запуск на Windows: создаёт .venv, ставит зависимости, запускает парсер.
rem Аргументы передаются дальше: run.bat --dry-run --once
chcp 65001 >nul
setlocal
cd /d "%~dp0"
set PYTHONUTF8=1
set PYTHONIOENCODING=utf-8

if exist ".venv\Scripts\python.exe" goto :venv_ready

set "PY="
where py >nul 2>nul
if %errorlevel%==0 (
  py -3 -c "import sys; sys.exit(sys.version_info < (3, 11))" >nul 2>nul && set "PY=py -3"
)
if not defined PY (
  python -c "import sys; sys.exit(sys.version_info < (3, 11))" >nul 2>nul && set "PY=python"
)
if not defined PY goto :no_python

echo Создаю виртуальное окружение .venv...
%PY% -m venv .venv
if errorlevel 1 goto :venv_fail

:venv_ready
set "VENV_PY=.venv\Scripts\python.exe"
set "REQ_HASH="
set "OLD_HASH="
for /f "usebackq delims=" %%h in (`%VENV_PY% -c "import hashlib;print(hashlib.sha256(open('requirements.txt','rb').read()).hexdigest())"`) do set "REQ_HASH=%%h"
if exist ".venv\.requirements.sha" set /p OLD_HASH=<".venv\.requirements.sha"
if "%REQ_HASH%"=="%OLD_HASH%" goto :deps_ready

echo Устанавливаю зависимости...
"%VENV_PY%" -m pip install --upgrade pip
"%VENV_PY%" -m pip install -r requirements.txt
if errorlevel 1 goto :pip_fail
>".venv\.requirements.sha" echo %REQ_HASH%

:deps_ready
if exist ".env" goto :run
copy ".env.example" ".env" >nul
echo Создан файл .env из .env.example.
echo Заполните BOT_TOKEN, ADMIN_ID и, для Telegram-чатов, TG_API_ID, TG_API_HASH, TG_PHONE.
echo Проверить парсинг без бота: run.bat --dry-run --once
start "" notepad ".env"
pause
exit /b 1

:run
"%VENV_PY%" -m order_parser %*
set "CODE=%errorlevel%"
if not "%CODE%"=="0" pause
exit /b %CODE%

:no_python
echo Не найден Python 3.11 или новее. Установите его с https://www.python.org/downloads/
echo При установке отметьте галочку "Add python.exe to PATH".
pause
exit /b 1

:venv_fail
echo Не удалось создать виртуальное окружение .venv
pause
exit /b 1

:pip_fail
echo Не удалось установить зависимости. Проверьте интернет и запустите снова.
pause
exit /b 1
