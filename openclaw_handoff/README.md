# OpenClaw Production Handoff: Souvenir Lead-Gen Offer System

Этот пакет — стартовый набор инструкций, skills и задач для реализации MVP через OpenClaw/Codex.

## Как использовать

1. Создай новый GitHub-репозиторий, например `souvenir-leadgen`.
2. Скопируй содержимое этого пакета в корень репозитория.
3. Открой OpenClaw в рабочей директории репозитория.
4. Включи coding-agent skill, если используешь OpenClaw как диспетчер задач.
5. Сначала скорми OpenClaw файл `docs/00_MASTER_PROMPT_OPENCLAW.md`.
6. Затем давай ему задачи по одной из папки `tasks/`.
7. Не запускай больше 1 активной coding-задачи на MacBook Air M1.
8. Каждый issue должен заканчиваться тестами, diff summary и списком изменённых файлов.

## Стратегия

Не строим большой enterprise-продукт. Строим lean production MVP:

- Next.js UI;
- Supabase-first backend;
- local TypeScript worker;
- LM Studio + Gemma 12B;
- Prototype Studio с PSD-source → runtime mockup pack;
- human approval перед отправкой;
- сделки и комиссии.

## Важные ограничения

- No FastAPI in MVP.
- No Redis/Celery/MinIO in MVP.
- No auto-spam.
- No PSD runtime renderer in MVP.
- No secrets in repo.
- No paid external API calls without explicit approval.
