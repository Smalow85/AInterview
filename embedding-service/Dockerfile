# Use official Python image with slim variant
FROM python:3.11-slim

# Установка системных зависимостей для fitz (PyMuPDF), docx, nltk
RUN apt-get update && apt-get install -y \
    build-essential \
    libgl1-mesa-glx \
    libglib2.0-0 \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Создаем рабочую директорию
WORKDIR /app

# Создаем директорию для NLTK данных
RUN mkdir -p /usr/local/nltk_data

# Копируем зависимости
COPY requirements.txt .

# Устанавливаем зависимости
RUN pip install --no-cache-dir -r requirements.txt

# Копируем исходники
COPY main.py .

# Предварительно скачиваем NLTK данные (новый формат punkt_tab)
RUN python -c "import nltk; nltk.download('punkt_tab', download_dir='/usr/local/nltk_data')" || \
    python -c "import nltk; nltk.download('punkt', download_dir='/usr/local/nltk_data')"

# Устанавливаем переменную окружения для NLTK
ENV NLTK_DATA=/usr/local/nltk_data

# Запуск сервера
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]