\# DHCaaS Deployment Guide



Complete step-by-step guide for deploying DHCaaS to production environments.



\## Pre-Deployment Checklist



\### Required Accounts \& Services

\- MongoDB Atlas account (or self-hosted MongoDB 6.0+)

\- Domain name registered (e.g., dhcaas.com)

\- Cloudflare account (for CDN and DNS)

\- VPS/Cloud server (Ubuntu 22.04 LTS recommended)

\- SSL certificate (Let's Encrypt or Cloudflare)

\- Zoho Desk account (optional, for ticketing)

\- Google Analytics 4 property (optional, for analytics)



\### Local Requirements

\- Git installed

\- SSH key for server access

\- All environment variables documented



\## Option 1: Ubuntu Server Deployment



\### Step 1: Server Setup



Connect to your server:

ssh root@your-server-ip



Update system:

sudo apt update \&\& sudo apt upgrade -y



Install required packages:

sudo apt install -y python3.11 python3.11-venv python3-pip nginx certbot python3-certbot-nginx nodejs npm git



Verify installations:

python3.11 --version

node --version

npm --version



\### Step 2: Create Application User



sudo adduser dhcaas

sudo usermod -aG sudo dhcaas

su - dhcaas



\### Step 3: Clone and Setup Backend



cd /home/dhcaas

git clone https://github.com/your-org/dhcaas.git

cd dhcaas/backend



python3.11 -m venv venv

source venv/bin/activate

pip install -r requirements.txt



Create .env file with production credentials:

MONGODB\_URL=mongodb+srv://user:password@cluster.mongodb.net/dhcaas\_prod

DATABASE\_NAME=dhcaas\_prod

SECRET\_KEY=your-secret-key-32-chars-minimum

ALGORITHM=HS256

ACCESS\_TOKEN\_EXPIRE\_MINUTES=43200

ZOHO\_ORG\_ID=your\_zoho\_org\_id

ZOHO\_ACCESS\_TOKEN=your\_zoho\_token

HOST=0.0.0.0

PORT=8000

ENVIRONMENT=production



\### Step 4: Create Systemd Service



sudo nano /etc/systemd/system/dhcaas-backend.service



Service file content:

\[Unit]

Description=DHCaaS Backend API

After=network.target



\[Service]

Type=simple

User=dhcaas

WorkingDirectory=/home/dhcaas/dhcaas/backend

Environment="PATH=/home/dhcaas/dhcaas/backend/venv/bin"

ExecStart=/home/dhcaas/dhcaas/backend/venv/bin/python main.py

Restart=always

RestartSec=10



\[Install]

WantedBy=multi-user.target



Start the service:

sudo systemctl daemon-reload

sudo systemctl enable dhcaas-backend

sudo systemctl start dhcaas-backend

sudo systemctl status dhcaas-backend



\### Step 5: Frontend Setup



cd /home/dhcaas/dhcaas/frontend

npm install



Create .env.production file:

VITE\_API\_BASE\_URL=https://api.dhcaas.com

VITE\_GA\_MEASUREMENT\_ID=G-YOUR-GA4-ID



Build frontend:

npm run build



\### Step 6: Nginx Configuration



sudo nano /etc/nginx/sites-available/dhcaas



Nginx configuration:

server {

&nbsp;   listen 80;

&nbsp;   server\_name api.dhcaas.com;

&nbsp;   

&nbsp;   location / {

&nbsp;       proxy\_pass http://localhost:8000;

&nbsp;       proxy\_http\_version 1.1;

&nbsp;       proxy\_set\_header Upgrade $http\_upgrade;

&nbsp;       proxy\_set\_header Connection 'upgrade';

&nbsp;       proxy\_set\_header Host $host;

&nbsp;       proxy\_set\_header X-Real-IP $remote\_addr;

&nbsp;       proxy\_set\_header X-Forwarded-For $proxy\_add\_x\_forwarded\_for;

&nbsp;   }

}



server {

&nbsp;   listen 80;

&nbsp;   server\_name app.dhcaas.com dhcaas.com www.dhcaas.com;

&nbsp;   

&nbsp;   root /home/dhcaas/dhcaas/frontend/dist;

&nbsp;   index index.html;

&nbsp;   

&nbsp;   location / {

&nbsp;       try\_files $uri $uri/ /index.html;

&nbsp;   }

&nbsp;   

&nbsp;   location ~\* \\.(js|css|png|jpg|jpeg|gif|ico|svg)$ {

&nbsp;       expires 1y;

&nbsp;       add\_header Cache-Control "public, immutable";

&nbsp;   }

}



Enable site:

sudo ln -s /etc/nginx/sites-available/dhcaas /etc/nginx/sites-enabled/

sudo nginx -t

sudo systemctl restart nginx



\### Step 7: SSL Certificate



sudo certbot --nginx -d api.dhcaas.com

sudo certbot --nginx -d dhcaas.com -d www.dhcaas.com -d app.dhcaas.com



\### Step 8: Firewall Configuration



sudo ufw allow 22/tcp

sudo ufw allow 80/tcp

sudo ufw allow 443/tcp

sudo ufw enable

sudo ufw status



\### Step 9: MongoDB Indexes



Connect to MongoDB and create indexes:



use dhcaas\_prod



db.scans.createIndex({ "created\_at": -1 })

db.scans.createIndex({ "compliance\_score": 1 })

db.scans.createIndex({ "status": 1 })



db.incidents.createIndex({ "created\_at": -1 })

db.incidents.createIndex({ "severity": 1 })

db.incidents.createIndex({ "status": 1 })

db.incidents.createIndex({ "scan\_id": 1 })



db.users.createIndex({ "email": 1 }, { unique: true })

db.users.createIndex({ "username": 1 }, { unique: true })



\## Option 2: Docker Deployment



Create docker-compose.yml:



version: '3.8'



services:

&nbsp; backend:

&nbsp;   build: ./backend

&nbsp;   ports:

&nbsp;     - "8000:8000"

&nbsp;   env\_file:

&nbsp;     - ./backend/.env

&nbsp;   restart: always



&nbsp; frontend:

&nbsp;   build: ./frontend

&nbsp;   ports:

&nbsp;     - "80:80"

&nbsp;   depends\_on:

&nbsp;     - backend

&nbsp;   restart: always



Deploy:

docker-compose up -d



\## Post-Deployment Verification



Test API:

curl https://api.dhcaas.com/



Test Frontend:

curl https://app.dhcaas.com/



Check backend logs:

sudo journalctl -u dhcaas-backend -f



View Nginx logs:

sudo tail -f /var/log/nginx/access.log

sudo tail -f /var/log/nginx/error.log



\## Troubleshooting



\### Backend Not Starting



sudo systemctl status dhcaas-backend

sudo journalctl -u dhcaas-backend -n 50



Test manually:

cd /home/dhcaas/dhcaas/backend

source venv/bin/activate

python main.py



\### Database Connection Issues



Test MongoDB connection:

python3 -c "from pymongo import MongoClient; client = MongoClient('your\_mongodb\_url'); print(client.server\_info())"



\### Nginx Issues



Test configuration:

sudo nginx -t



Reload Nginx:

sudo systemctl reload nginx



View error logs:

sudo tail -f /var/log/nginx/error.log



\## Security Hardening



\### SSH Configuration



Edit /etc/ssh/sshd\_config:

PermitRootLogin no

PasswordAuthentication no

PubkeyAuthentication yes

Port 2222



Restart SSH:

sudo systemctl restart sshd



\### Install Fail2Ban



sudo apt install fail2ban

sudo systemctl enable fail2ban

sudo systemctl start fail2ban



\### Auto-Updates



sudo apt install unattended-upgrades

sudo dpkg-reconfigure --priority=low unattended-upgrades



\## Monitoring



Install monitoring tools:

sudo apt install htop iotop nethogs



Monitor system:

htop



Check disk usage:

df -h



Check memory usage:

free -h



\## Backup Strategy



\### Database Backup



mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/dhcaas\_prod" --out=/backup/$(date +%Y%m%d)



\### Automated Backups



Create backup script:

\#!/bin/bash

DATE=$(date +%Y%m%d\_%H%M%S)

mongodump --uri="$MONGODB\_URL" --out=/backup/$DATE

find /backup -mtime +7 -delete



Add to crontab:

0 2 \* \* \* /home/dhcaas/backup.sh



\## Support



For deployment support: devops@dhcaas.com



Last Updated: January 31, 2026



