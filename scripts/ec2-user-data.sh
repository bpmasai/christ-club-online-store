#!/usr/bin/env bash
# ==============================================================================
# CHRIST CLUB ONLINE STORE - EC2 USER DATA & BOOTSTRAP SCRIPT
# ==============================================================================
# OS: Amazon Linux 2023 (x86_64 or arm64)
# Paste into AWS Console: EC2 Launch Instance -> Advanced Details -> User Data
# ==============================================================================
set -euo pipefail

echo "============================================================"
echo " Starting EC2 Bootstrap for Christ Club Online Store..."
echo "============================================================"

# 1. Update OS packages and install git
dnf update -y
dnf install -y git

# 2. Install Node.js 20 LTS
dnf install -y nodejs20 npm

# 3. Install PM2 process manager globally
npm install -g pm2

# 4. Create application directory
APP_DIR="/opt/christ-club-store"
mkdir -p "${APP_DIR}"
chown -R ec2-user:ec2-user "${APP_DIR}"

echo "Node.js version: $(node -v)"
echo "NPM version:     $(npm -v)"
echo "PM2 version:     $(pm2 -v)"
echo "EC2 bootstrap completed. Ready for application code deployment."
