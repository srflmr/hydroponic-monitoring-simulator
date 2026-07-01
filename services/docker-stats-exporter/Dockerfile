FROM python:3.12.13-slim-bookworm
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY src ./src
RUN groupadd --gid 1000 app \
 && useradd --no-log-init --uid 1000 --gid app --create-home app \
 && chown -R app:app /app
EXPOSE 9338
USER app
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "9338"]
