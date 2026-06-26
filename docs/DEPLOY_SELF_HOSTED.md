# Self-Hosted Deployment Guide

Step-by-step guide for deploying the certificate portal on your own server using Node.js.

## Prerequisites

- Linux server (Ubuntu 20.04+ recommended)
- Node.js 16.0.0+ installed
- SSH access to server
- Domain name (optional)
- SSL certificate (Let's Encrypt, recommended)

## Platform Options

- **Railway**: Easiest, excellent free tier
- **Fly.io**: Great performance, global deployment
- **DigitalOcean**: Full control, $6+/month
- **AWS EC2**: Maximum flexibility, pay-as-you-go
- **Azure App Service**: Microsoft ecosystem integration
- **Hetzner**: Affordable, EU-based
- **Your own server**: Maximum control

## Option 1: Railway (Recommended - Easiest)

### Step 1: Prepare GitHub Repository

```bash
git add .
git commit -m "Production ready"
git push origin main
```

### Step 2: Deploy on Railway

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub"
4. Select your repository
5. Click "Deploy"

### Step 3: Configure

1. Click "Variables" tab
2. Add environment variables:
   ```
   NODE_ENV=production
   PORT=3000
   ```

3. Railway automatically sets `PORT` environment variable

### Step 4: Add Domain (Optional)

1. Go to "Settings"
2. Click "Domains"
3. Add your custom domain
4. Update DNS settings

**That's it! Your site is live.**

---

## Option 2: Fly.io (Global Deployment)

### Step 1: Install Fly CLI

```bash
curl -L https://fly.io/install.sh | sh
```

### Step 2: Prepare App

Create `fly.toml`:

```toml
app = "flutter-certificate"
primary_region = "lhr"

[build]
  builder = "heroku/buildpacks:18"

[env]
  NODE_ENV = "production"

[[services]]
  internal_port = 3000
  processes = ["app"]

  [[services.ports]]
    port = 80
    handlers = ["http"]

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]
```

### Step 3: Deploy

```bash
fly auth login
fly launch
fly deploy
```

---

## Option 3: DigitalOcean Droplet

### Step 1: Create Droplet

1. Go to DigitalOcean dashboard
2. Click "Create" → "Droplets"
3. Select Ubuntu 22.04
4. Choose $5-6/month plan
5. Select region
6. Add SSH keys
7. Click "Create Droplet"

### Step 2: Connect to Server

```bash
ssh root@YOUR_DROPLET_IP
```

### Step 3: Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version  # Verify installation
```

### Step 4: Clone Repository

```bash
cd /var/www
git clone https://github.com/YOUR_USERNAME/flutter-workshop-website.git
cd flutter-workshop-website
npm install
```

### Step 5: Setup PM2 (Process Manager)

```bash
sudo npm install -g pm2

# Start application
pm2 start server.js --name "cert-portal"

# Setup auto-restart
pm2 startup
pm2 save
```

### Step 6: Setup Nginx (Reverse Proxy)

```bash
sudo apt-get install -y nginx

# Create Nginx config
sudo tee /etc/nginx/sites-available/default > /dev/null <<EOF
server {
    listen 80;
    server_name YOUR_DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Forwarded-For \$remote_addr;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

### Step 7: Setup SSL Certificate (Let's Encrypt)

```bash
sudo apt-get install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d YOUR_DOMAIN

# Auto-renewal is automatic
```

### Step 8: Setup Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## Option 4: AWS EC2

### Step 1: Launch EC2 Instance

1. Go to AWS Console
2. Click "Launch Instance"
3. Select Ubuntu Server 22.04 LTS
4. Choose t2.micro (free tier eligible)
5. Configure security group:
   - Allow port 22 (SSH)
   - Allow port 80 (HTTP)
   - Allow port 443 (HTTPS)
6. Launch instance

### Step 2: Connect via SSH

```bash
ssh -i your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

### Step 3: Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Step 4: Clone and Setup

```bash
cd /home/ubuntu
git clone https://github.com/YOUR_USERNAME/flutter-workshop-website.git
cd flutter-workshop-website
npm install
```

### Step 5: Setup with Systemd

```bash
sudo tee /etc/systemd/system/cert-portal.service > /dev/null <<EOF
[Unit]
Description=Certificate Portal
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/flutter-workshop-website
ExecStart=/usr/bin/node server.js
Environment="NODE_ENV=production"
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start
sudo systemctl enable cert-portal
sudo systemctl start cert-portal
```

### Step 6: Setup Nginx Reverse Proxy

```bash
sudo apt-get install -y nginx

# Create config
sudo tee /etc/nginx/sites-available/default > /dev/null <<EOF
server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Forwarded-For \$remote_addr;
    }
}
EOF

sudo systemctl reload nginx
```

### Step 7: Setup SSL (AWS Certificate Manager + CloudFront Optional)

---

## Monitoring Setup

### Check Service Status

```bash
# Check if service is running
sudo systemctl status cert-portal

# View logs
sudo journalctl -u cert-portal -n 50 -f

# Or with PM2
pm2 logs cert-portal
```

### Setup Log Rotation

```bash
sudo tee /etc/logrotate.d/cert-portal > /dev/null <<EOF
/var/log/cert-portal/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
}
EOF
```

### Monitor CPU/Memory

```bash
# Install htop
sudo apt-get install -y htop

# View processes
htop
```

---

## Maintenance

### Update Application

```bash
cd /var/www/flutter-workshop-website
git pull origin main
npm install
pm2 restart all
```

### Backup Database

```bash
# Backup certificate files
tar -czf backup_$(date +%Y%m%d).tar.gz assets/

# Backup to S3 (if using AWS)
aws s3 cp backup_*.tar.gz s3://your-bucket/backups/
```

### Monitor Disk Space

```bash
df -h
du -sh /var/www/flutter-workshop-website
```

---

## Troubleshooting

### Application won't start
```bash
pm2 logs cert-portal --err
# Check Node.js version
node --version
```

### Port 3000 already in use
```bash
lsof -i :3000
kill -9 <PID>
```

### Nginx not working
```bash
sudo nginx -t
sudo systemctl restart nginx
```

### SSL certificate renewal failing
```bash
sudo certbot renew --dry-run
```

---

## Performance Tips

### Enable Compression
Already enabled in server.js with compression middleware

### Use CDN for Static Files
Consider CloudFront (AWS), BunnyCDN, or Cloudflare

### Monitor Response Times
```bash
curl -w "\nTime Total: %{time_total}s\n" https://your-site.com/api/verify-certificate?name=test&code=test
```

### Scale Horizontally
Use load balancer (AWS ELB, HAProxy) for multiple instances

---

## Security Hardening

### SSH Hardening
```bash
# Disable password auth
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl reload sshd
```

### Firewall Rules
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Auto Updates
```bash
sudo apt-get install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## Comparison: Self-Hosted vs PaaS

| Feature | Railway | Fly.io | DigitalOcean | AWS |
|---------|---------|--------|--------------|-----|
| Cost | Free tier | Free tier | $6+/month | Free tier |
| Setup Time | 5 min | 10 min | 20 min | 30 min |
| Difficulty | Easy | Easy | Medium | Hard |
| Scaling | Automatic | Automatic | Manual | Automatic |
| Support | Good | Good | Community | Excellent |
| Control | Limited | Limited | Full | Full |

**Recommendation**: Start with Railway for ease, move to self-hosted for cost savings.

---

## Deployment Checklist

- [ ] Server provisioned and SSH access working
- [ ] Node.js 16+ installed
- [ ] Repository cloned
- [ ] npm install completed
- [ ] Application starts locally
- [ ] Environment variables configured
- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] Monitoring setup
- [ ] Backup strategy implemented
- [ ] DNS pointing to server
- [ ] Health check passing: `curl https://your-site/health`

---

**Status**: Ready for Self-Hosted Deployment ✓
**Recommended Platform**: Railway (easiest) or DigitalOcean (cost-effective)
**Next Step**: Choose platform and follow instructions above
