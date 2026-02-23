# 🚀 Guía de Deployment a Producción

## Índice

- [Requisitos](#requisitos-previos)
- [Database Setup](#database-setup)
- [Backend Deployment](#backend-deployment)
- [Frontend Deployment](#frontend-deployment)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

---

## Requisitos Previos

### Servidor/Cloud

- Recomendado: AWS EC2, Azure VM, DigitalOcean, Heroku, Render, o similar
- Sistema Operativo: Ubuntu 20.04+ o similar
- CPU: 2+ vCPU mínimo
- RAM: 4GB mínimo (8GB recomendado)
- Almacenamiento: 20GB mínimo (SSD)

### Software Requerido

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Python 3.11+
sudo apt install python3.11 python3.11-venv python3-pip

# Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# MySQL 5.7+ o MariaDB
sudo apt install mysql-server

# Nginx (opcional, para reverse proxy)
sudo apt install nginx

# Git
sudo apt install git
```

---

## Database Setup

### 1. Crear Base de Datos

```bash
# Conectar a MySQL
mysql -u root -p

# Crear database
CREATE DATABASE tfm_drones CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'tfm_user'@'localhost' IDENTIFIED BY 'strong_password_here';
GRANT ALL PRIVILEGES ON tfm_drones.* TO 'tfm_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 2. Backup Strategy

```bash
# Backup diario
0 2 * * * mysqldump -u tfm_user -p'password' tfm_drones > /backups/tfm_drones_$(date +\%Y\%m\%d).sql

# Configurar en crontab
sudo crontab -e
```

### 3. Performance Tuning

```sql
-- En my.cnf agregar:
[mysqld]
max_connections=200
default_storage_engine=InnoDB
innodb_buffer_pool_size=1G
query_cache_type=1
query_cache_size=32M
slow_query_log=1
slow_query_log_file=/var/log/mysql/slow.log
long_query_time=2
```

---

## Backend Deployment

### 1. Preparar Servidor

```bash
# Clonar repositorio
git clone https://github.com/AgustinHi/tfm-drones.git
cd tfm-drones/backend

# Crear virtual environment
python3.11 -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# Instalar dependencias
pip install --upgrade pip
pip install -r requirements.txt
```

### 2. Configuración de Producción

```bash
# Crear .env
cat > .env << EOF
# Database
DATABASE_URL=mysql+pymysql://tfm_user:strong_password_here@localhost:3306/tfm_drones

# JWT
SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Allowed Origins
ALLOWED_ORIGINS=https://tu-dominio.com,https://www.tu-dominio.com

# Server
HOST=0.0.0.0
PORT=8000
DEBUG=False

# File Upload
MAX_UPLOAD_SIZE_MB=20
UPLOAD_DIRECTORY=/var/www/tfm-drones/uploads/
EOF

# Permisos
chmod 600 .env
```

### 3. Systemd Service

```bash
# Crear /etc/systemd/system/tfm-drones-backend.service
sudo tee /etc/systemd/system/tfm-drones-backend.service > /dev/null << EOF
[Unit]
Description=TFM Drones FastAPI Backend
After=network.target mysql.service
Wants=mysql.service

[Service]
Type=notify
User=www-data
WorkingDirectory=/var/www/tfm-drones/backend
Environment="PATH=/var/www/tfm-drones/backend/venv/bin"
ExecStart=/var/www/tfm-drones/backend/venv/bin/uvicorn main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --workers 4 \
    --loop uvloop
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Activar servicio
sudo systemctl daemon-reload
sudo systemctl enable tfm-drones-backend
sudo systemctl start tfm-drones-backend
```

### 4. SSL/TLS con Let's Encrypt

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Generar certificado
sudo certbot certonly --standalone -d tu-dominio.com -d www.tu-dominio.com

# Auto-renovación
sudo systemctl enable certbot.timer
```

---

## Frontend Deployment

### 1. Build Optimizado

```bash
cd frontend

# Install dependencies
npm ci  # (más seguro que npm install)

# Build para producción
npm run build

# Resultado en ./dist/
```

### 2. Nginx Configuration

```nginx
# /etc/nginx/sites-available/tfm-drones

# Backend upstream
upstream backend {
    server localhost:8000;
}

# HTTP redirect a HTTPS
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS
server {
    listen 443 ssl http2;
    server_name tu-dominio.com www.tu-dominio.com;

    # SSL
    ssl_certificate /etc/letsencrypt/live/tu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tu-dominio.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    # Frontend
    location / {
        root /var/www/tfm-drones/frontend/dist;
        try_files $uri $uri/ /index.html;
        expires 1d;
        add_header Cache-Control "public, max-age=86400, immutable";
    }

    # API Backend
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_request_buffering off;
    }

    # Uploads
    location /uploads/ {
        alias /var/www/tfm-drones/uploads/;
        expires 7d;
        add_header Cache-Control "public, max-age=604800";
    }

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript;
    gzip_min_length 1024;
}
```

### 3. Activar Nginx

```bash
# Test configuración
sudo nginx -t

# Link
sudo ln -s /etc/nginx/sites-available/tfm-drones /etc/nginx/sites-enabled/

# Reboot
sudo systemctl reload nginx
```

---

## Monitoring & Maintenance

### 1. Logs

```bash
# Backend logs
sudo journalctl -f -u tfm-drones-backend

# Nginx access
tail -f /var/log/nginx/access.log

# Nginx errors
tail -f /var/log/nginx/error.log

# MySQL slow queries
tail -f /var/log/mysql/slow.log
```

### 2. Uptime Monitoring

```bash
# Instalar monit
sudo apt install monit

# Configuración en /etc/monit/monitrc
```

### 3. Backups Automáticos

```bash
# Script de backup
#!/bin/bash
# /usr/local/bin/backup-tfm-drones.sh

BACKUP_DIR="/backups/tfm-drones"
DATE=$(date +%Y%m%d_%H%M%S)

# Database
mysqldump -u tfm_user -p'password' tfm_drones > $BACKUP_DIR/db_$DATE.sql
gzip $BACKUP_DIR/db_$DATE.sql

# Uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/www/tfm-drones/uploads/

# Limpiar backups antiguos (>30 días)
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup completado: $DATE"
```

---

## Performance Optimization

### 1. Caching

```bash
# Redis (opcional)
sudo apt install redis-server
sudo systemctl enable redis-server
```

### 2. CDN (Cloudflare, AWS CloudFront, etc.)

```nginx
# En caso de usar CDN, actualizar CORS
ALLOWED_ORIGINS=https://tu-dominio.com,https://cdn.tu-dominio.com
```

### 3. Database Indexing

```sql
-- Crear índices recomendados
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_drones_user_id ON drones(user_id);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_drone_dumps_drone_id ON drone_dumps(drone_id);
```

---

## Troubleshooting

### Backend No Inicia

```bash
# Ver el error
sudo systemctl status tfm-drones-backend
sudo journalctl -u tfm-drones-backend -n 50

# Verificar dependencias
pip list

# DB connection
mysql -u tfm_user -p -h localhost -D tfm_drones -e "SELECT 1;"
```

### 502 Bad Gateway

```bash
# Verificar backend
curl http://localhost:8000/docs

# Verificar logs
tail -f /var/log/nginx/error.log

# Reiniciar backend
sudo systemctl restart tfm-drones-backend
```

### Uploads No Funcionan

```bash
# Permisos
sudo chown -R www-data:www-data /var/www/tfm-drones/uploads/
sudo chmod -R 755 /var/www/tfm-drones/uploads/

# Espacio en disco
df -h
```

---

## Seguridad en Producción

- ✅ Update sistema: `sudo apt update && sudo apt upgrade`
- ✅ Firewall: `sudo ufw enable`
- ✅ SSH: Cambiar puerto 22, usar keys
- ✅ Secrets: Variables de entorno (.env no en git)
- ✅ HTTPS: Let's Encrypt certificados
- ✅ Headers: Security headers en Nginx
- ✅ Logs: Revisar regularmente

---

## Rollback Procedure

```bash
# Si algo falla, rollback:
cd /var/www/tfm-drones/backend

# Ver histórico
git log --oneline -10

# Rollback a versión anterior
git checkout <commit-hash>

# Reiniciar
sudo systemctl restart tfm-drones-backend
```

---

**Última actualización:** 19 de Febrero de 2026
**Versión:** 1.0.0

