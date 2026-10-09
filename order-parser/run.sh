#!/usr/bin/env bash
# Запуск на Linux/macOS: создаёт .venv, ставит зависимости, запускает парсер.
# Аргументы передаются дальше: ./run.sh --dry-run --once
set -euo pipefail
cd "$(dirname "$0")"

PY="${PYTHON:-}"
if [ -z "$PY" ]; then
  for candidate in python3.13 python3.12 python3.11 python3 python; do
    if command -v "$candidate" >/dev/null 2>&1 &&
       "$candidate" -c 'import sys; sys.exit(sys.version_info < (3, 11))' 2>/dev/null; then
      PY="$candidate"
      break
    fi
  done
fi
if [ -z "$PY" ]; then
  echo "Нужен Python 3.11 или новее. Установите его (например: sudo apt install python3 python3-venv)." >&2
  exit 1
fi

# venv без pip остаётся после неудачной попытки (например, не был установлен python3-venv) — пересоздаём
if [ -d .venv ] && ! .venv/bin/python -m pip --version >/dev/null 2>&1; then
  echo "Окружение .venv повреждено — пересоздаю..."
  rm -rf .venv
fi
if [ ! -x .venv/bin/python ]; then
  echo "Создаю виртуальное окружение .venv ($PY)..."
  if ! "$PY" -m venv .venv; then
    rm -rf .venv
    echo "Не удалось создать venv. На Debian/Ubuntu: sudo apt install python3-venv" >&2
    exit 1
  fi
fi
VENV_PY=.venv/bin/python

REQ_HASH=$("$VENV_PY" -c "import hashlib;print(hashlib.sha256(open('requirements.txt','rb').read()).hexdigest())")
if [ ! -f .venv/.requirements.sha ] || [ "$(cat .venv/.requirements.sha)" != "$REQ_HASH" ]; then
  echo "Устанавливаю зависимости..."
  "$VENV_PY" -m pip install --upgrade pip
  "$VENV_PY" -m pip install -r requirements.txt
  echo "$REQ_HASH" > .venv/.requirements.sha
fi

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Создан файл .env из .env.example — заполните BOT_TOKEN, ADMIN_ID (и TG_* для Telegram) и запустите снова."
  echo "Свой ADMIN_ID можно узнать так: укажите только BOT_TOKEN, запустите и напишите боту /start."
  echo "Проверить парсинг без бота можно так: ./run.sh --dry-run --once"
  exit 1
fi

exec "$VENV_PY" -m order_parser "$@"
