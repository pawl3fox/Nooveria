# Тех обзор

## Назначение системы
**Платформа арбитража токенов** с отраслевой защитой от злоупотреблений с помощью многоуровневой идентификации устройств.

## Архитектура ядра

### Технологический стек
- **Бэкенд**: FastAPI (Python) + PostgreSQL + Redis
- **Фронтенд**: React + Vite
- **Развёртывание**: Docker Compose
- **Аутентификация**: токены JWT
- **Отслеживание устройств**: многоуровневая идентификация оборудования

### Основные компоненты

#### 1. Система отслеживания устройств (`backend/app/services/device_tracking.py`)
```python
class DeviceTracker:
    def create_device_signatures(self, fingerprint_data):
        # Первичный: Полная сигнатура оборудования
        # Вторичный: Соответствие основному оборудованию
        # Третичный: Соответствие базовому оборудованию
        
    def find_matching_device(self, db, fingerprint_data):
        # Тестовая: первичный → вторичный → третичный
        # Обновите сигнатуры при обнаружении
```

**Ключевые особенности:**
- **Многоуровневое сопоставление**: Точное → Аналогичное → Базовое оборудование
- **Кроссбраузерное определение**: Одно и то же устройство во всех браузерах
- **Эволюция сигнатуры**: Автоматические обновления для большей точности
- **Фокус на оборудовании**: Характеристики графического процессора, экрана, центрального процессора, аудио

#### 2. Система кошелька (`backend/app/services/wallet.py`)
```python
def charge_tokens(db, user_id, total_tokens, prefer_communal=False):
    # Атомарная транзакция с блокировкой базы данных
    personal_wallet = db.query(Wallet).with_for_update().first()
    # Личный счёт → общак → недостаточно средств
```

**Приоритет оплаты:**
1. Личный кошелёк (приобретённые токены)
2. Общий кошелёк (бесплатный тариф с дневными лимитами)
3. Ошибка «Недостаточно средств»

#### 3. Прокси OpenAI (`backend/app/services/openai_client.py`)
```python
async def chat_completion(messages, model="gpt-3.5-turbo"):
    # Пул соединений + асинхронные запросы
    # Режим имитации для разработки
    # Отслеживание использования без сохранения содержимого чата
```

**Возможности:**
- **Пул соединений**: повторное использование HTTP-соединений
- **Модельный режим**: тестирование без затрат на OpenAI
- **Конфиденциальность**: содержимое чата не сохраняется

## 🔄 Конвейер потока запросов

### 1. Поток доступа пользователя
```
Browser → Device Fingerprint → Multi-tier Matching → User Binding → JWT Token
```

**Выполнение:**
```javascript
// Frontend: Collect hardware signals
const fingerprint = {
    screen: "1920x1080x24x24",
    webglRenderer: "nvidia-gtx-1060", 
    hardwareConcurrency: 8,
    deviceMemory: 8
}

// Backend: Multi-tier matching
signatures = {
    primary: hash(screen + gpu + cpu + timezone),
    secondary: hash(screen + gpu + platform),
    tertiary: hash(screen + timezone + platform)
}
```

### 2. Процесс запроса чата
```
Валидация JWT → User extraction → Проверка кошелька → Оценка токена →
Атомарный биллинг → Прокси OpenAI → Регистрация использования → Ответ
```

**Ключевые моменты:**
- **Атомарный биллинг**: Блокировки базы данных предотвращают возникновение гонок
- **Отсутствие хранения чата**: Сохраняются только метаданные использования
- **Обработка в режиме реального времени**: Асинхронный FastAPI обрабатывает параллельные запросы

### 3. Сопоставление сигнатур устройств
```python
# Сначала проверка по точному совпадению
device = find_by_primary_signature(fingerprint_hash)
\
# Фолбек на аналогичное оборудование
if not device:
    device = find_by_secondary_signature(screen + gpu)
    if device:
        device.fingerprint_hash = primary_signature  # Upgrade

# Фолбек на базовое соответствие
if not device:
    device = find_by_tertiary_signature(screen + timezone)
    if device:
        device.fingerprint_hash = primary_signature  # Upgrade
```

## Механизмы противодействия абьюзу

### Уровни идентификации устройств

#### Уровень 1: Идентификация оборудования
- **Модель графического процессора**: Нормализация строк рендерера WebGL
- **Характеристики экрана**: Разрешение + глубина цвета + доступное пространство
- **Информация о процессоре**: Параллелизм оборудования (количество ядер)
- **Аудиооборудование**: Частота дискретизации + конфигурация каналов

#### Уровень 2: Характеристики системы
- **Платформа**: Идентификатор операционной системы
- **Часовой пояс**: Часовой пояс системы + смещение UTC
- **Язык**: Языковые настройки браузера
- **Сеть**: Тип подключения + пропускная способность

#### Уровень 3: Кроссбраузерная согласованность
```python
def normalize_gpu(gpu_string):
    # "ANGLE (NVIDIA GeForce RTX 4060)" → "nvidia-rtx-4060"
    # Удалить информацию, специфичную для драйвера/API
    # Уделить внимание идентификации модели оборудования
```

### Стратегия эволюции подписи
```python
# При обнаружении вторичного совпадения
if device_found_via_secondary_signature:
    device.fingerprint_hash = primary_signature
    db.commit()
    # В будущих запросах используется более точная подпись
```

## Проектирование баз данных

### Основные таблицы
```sql
-- Device fingerprints with multi-tier signatures
device_fingerprints (
    id SERIAL PRIMARY KEY,
    fingerprint_hash VARCHAR(64),     -- Основная подпись
    device_metadata JSONB,            -- Все сигнатуры + профиль оборудования
    bound_user_id UUID REFERENCES users(id),
    created_at TIMESTAMP,
    last_seen_at TIMESTAMP
);

-- Аккаунты юзеров (anonymous \ registered)
users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE,        -- NULL для анонимусов
    role_id INTEGER REFERENCES roles(id),
    display_name VARCHAR(100),
    created_at TIMESTAMP
);

-- Token wallets (personal + communal)
wallets (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    type wallet_type,                 -- личный или общак
    balance_tokens DECIMAL(15,2),
    created_at TIMESTAMP
);

-- Atomic transaction log
transactions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    type transaction_type,            -- debit или credit
    amount_tokens DECIMAL(15,2),
    description TEXT,
    created_at TIMESTAMP
);
```

### Индексы производительности
```sql
CREATE INDEX idx_device_fingerprint_hash ON device_fingerprints(fingerprint_hash);
CREATE INDEX idx_device_bound_user ON device_fingerprints(bound_user_id);
CREATE INDEX idx_transactions_user_date ON transactions(user_id, created_at);
CREATE INDEX idx_usage_records_date ON usage_records(created_at);
```

## Оптимизация производительности

### Оптимизация бэкенда
```python
# Пул HTTP соединений
http_client = httpx.AsyncClient(
    limits=httpx.Limits(max_connections=100, max_keepalive_connections=20)
)

# Redis кэширование
cache.setex(f"wallet:{user_id}", 300, wallet_data)  # 5min TTL
cache.incrby(f"daily_usage:{user_id}", tokens)      # Daily counters
```

### Оптимизация базы данных
- **Пул соединений**: PgBouncer для продакшена
- **Блокировка на уровне строк**: `SELECT ... FOR UPDATE` для операций с кошельком
- **Подготовленные операторы**: SQLAlchemy ORM с оптимизацией запросов
- **Использование индексов**: все внешние ключи и часто запрашиваемые столбцы

### Оптимизация фронтенда
```javascript
// Эф. генерация фингерперинтов
const fingerprint = generateDeviceFingerprint();
// Отправить как строку JSON для обработки на сервере
authService.createAnonymousSession(fingerprint);
```

## Реализация безопасности

### Защита данных
- **Отсутствие хранилища чатов**: сообщения никогда не сохраняются в базе данных
- **HMAC-отпечатки**: аппаратные подписи криптографически хешируются
- **JWT-токены**: безопасное управление сеансами с истечением срока действия
- **Секреты среды**: ключи API хранятся в переменных среды

### Процесс аутентификации
```python
def get_current_user(authorization: str = Header(None)):
    token = authorization.split(" ")[1]  # Извлечь токен на предъявителя
    payload = verify_token(token)        # Проверка JWT
    return payload["sub"]                # Вернуть идентификатор пользователя
```

### Стратегия ограничения скорости
- **Ограничения на пользователя**: Ежедневные лимиты общих токенов
- **Ограничения на устройство**: Аппаратное регулирование запросов
- **Ограничения на IP**: Предотвращение злоупотреблений на уровне сети
- **Ограничения на основе ролей**: Различные уровни для анонимных и зарегистрированных пользователей

## 📊 Бизнес-аналитика

### Отслеживание доходов
```sql
-- Расчет профита риал-тайм
SELECT 
    SUM(amount_tokens) * 0.003 / 1000 as revenue_usd,
    SUM(amount_tokens) * 0.002 / 1000 as openai_cost_usd,
    SUM(amount_tokens) * 0.001 / 1000 as profit_usd
FROM transactions 
WHERE type = 'debit' AND created_at >= CURRENT_DATE;
```

### Аналитика использования
```sql
-- Анализ сигнатуры устройства
SELECT 
    COUNT(DISTINCT fingerprint_hash) as unique_devices,
    COUNT(DISTINCT bound_user_id) as unique_users,
    AVG(EXTRACT(EPOCH FROM (last_seen_at - created_at))/86400) as avg_retention_days
FROM device_fingerprints;
```

## Архитектура развертывания

### Среда разработки
```yaml
# docker-compose.yml
services:
  backend:    # Приложение FastAPI
  frontend:   # Сервер разработки React  
  postgres:   # БД
  redis:      # Кэширующий слой
```

### Производственная среда
```yaml
# docker-compose.prod.yml
services:
  backend:
    command: uvicorn app.main:app --workers 4  # Несколько воркеров
  frontend:
    environment:
      - VITE_API_URL=https://api.yourdomain.com
```

### Вопросы масштабирования
- **Горизонтальное масштабирование**: несколько экземпляров бэкенда за балансировщиком нагрузки
- **Масштабирование базы данных**: реплики чтения + пул подключений (PgBouncer)
- **Масштабирование кэша**: кластер Redis для высокой доступности
- **CDN**: доставка статических ресурсов для фронтенда