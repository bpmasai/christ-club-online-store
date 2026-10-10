# Step-by-Step Manual AWS Cloud Setup Guide
**Project:** Christ Club Online Store  
**Course:** MSc AIML Cloud Computing for AI  

This guide walks you through setting up every single AWS resource **manually in the AWS Management Console**. By completing these steps yourself, you will gain hands-on mastery over foundational AWS cloud architecture.

---

## Architecture Overview

```
[ Internet ] 
     │
     ▼ (Port 80)
[ AWS Application Load Balancer ] 
     │
     ├─────────────────────────────────────────┐
     ▼ (Port 3000)                             ▼ (Port 3000)
[ EC2 Instance A ]                        [ EC2 Instance B ]
  Availability Zone: us-east-1a             Availability Zone: us-east-1b
  Attached: 10GB gp3 EBS Volume             IAM Role: S3 Read/Write
  Mount: /mnt/demo-ebs                      Port 3000 (Next.js & PM2)
     │                                         │
     ├─────────────────────────────────────────┤
     │                                         │
     ▼ (Port 5432)                             ▼ (Port 5432)
   [ Amazon RDS PostgreSQL (christclub) ]
     Private DB Subnet Group across us-east-1a & us-east-1b
```

---

## PART 1: VPC and Subnets (Networking Foundation)

### 1.1 Create the VPC
1. Go to the AWS Console and search for **VPC**.
2. Click **Create VPC**.
3. Choose **VPC only**.
4. Settings:
   - **Name tag:** `christ-club-vpc`
   - **IPv4 CIDR block:** `10.0.0.0/16`
   - **Tenancy:** Default
5. Click **Create VPC**.

### 1.2 Create an Internet Gateway (IGW)
1. In the VPC left sidebar, click **Internet gateways** -> **Create internet gateway**.
2. Name tag: `christ-club-igw`. Click **Create internet gateway**.
3. Click **Actions** -> **Attach to VPC**, select `christ-club-vpc`, and click **Attach internet gateway**.

### 1.3 Create Subnets across Two Availability Zones
You will create 4 subnets: 2 Public subnets (for ALB and EC2) and 2 Private subnets (for RDS PostgreSQL).

Click **Subnets** -> **Create subnet**:
1. Select VPC: `christ-club-vpc`
2. **Subnet 1 (Public AZ-a):**
   - Subnet name: `public-subnet-1a`
   - Availability Zone: Select `us-east-1a`
   - IPv4 CIDR: `10.0.1.0/24`
3. Click **Add new subnet**:
   - Subnet name: `public-subnet-1b`
   - Availability Zone: Select `us-east-1b`
   - IPv4 CIDR: `10.0.2.0/24`
4. Click **Add new subnet**:
   - Subnet name: `private-db-subnet-1a`
   - Availability Zone: Select `us-east-1a`
   - IPv4 CIDR: `10.0.10.0/24`
5. Click **Add new subnet**:
   - Subnet name: `private-db-subnet-1b`
   - Availability Zone: Select `us-east-1b`
   - IPv4 CIDR: `10.0.20.0/24`
6. Click **Create subnet**.

> [!TIP]
> Enable auto-assign public IPv4 for both public subnets:
> Select `public-subnet-1a` -> **Actions** -> **Edit subnet settings** -> Check **Enable auto-assign public IPv4 address** -> **Save**. Repeat for `public-subnet-1b`.

### 1.4 Configure Route Tables
1. Click **Route tables** -> Select the route table associated with `christ-club-vpc`.
2. Rename it: `christ-club-public-rt`.
3. In the **Routes** tab, click **Edit routes** -> **Add route**:
   - Destination: `0.0.0.0/0`
   - Target: Select **Internet Gateway** -> choose `christ-club-igw`.
   - Click **Save changes**.
4. In the **Subnet associations** tab, click **Edit subnet associations**:
   - Check `public-subnet-1a` and `public-subnet-1b`.
   - Click **Save associations**.

---

## PART 2: Security Groups (Least-Privilege Firewalls)

Go to **VPC** -> **Security groups** -> **Create security group**. Create three security groups in this order:

### 2.1 ALB Security Group (`alb-sg`)
- **Security group name:** `alb-sg`
- **Description:** Allow public HTTP inbound to Load Balancer
- **VPC:** `christ-club-vpc`
- **Inbound rules:**
  - Type: **HTTP** | Port: `80` | Source: `Anywhere-IPv4` (`0.0.0.0/0`)
- **Outbound rules:** Default (All traffic)
- Click **Create security group**.

### 2.2 EC2 Security Group (`ec2-sg`)
- **Security group name:** `ec2-sg`
- **Description:** Allow traffic from ALB on port 3000
- **VPC:** `christ-club-vpc`
- **Inbound rules:**
  - **Rule 1 (From ALB):** Type: **Custom TCP** | Port: `3000` | Source: Select **Custom** -> choose `alb-sg` (Security Group reference!).
  - **Rule 2 (Optional SSH for debugging):** Type: **SSH** | Port: `22` | Source: `My IP` (Never use 0.0.0.0/0).
- **Outbound rules:** Default (All traffic)
- Click **Create security group**.

### 2.3 RDS PostgreSQL Security Group (`rds-sg`)
- **Security group name:** `rds-sg`
- **Description:** Allow PostgreSQL from EC2 instances only
- **VPC:** `christ-club-vpc`
- **Inbound rules:**
  - Type: **PostgreSQL** | Port: `5432` | Source: Select **Custom** -> choose `ec2-sg`.
- **Outbound rules:** Default (All traffic)
- Click **Create security group**.

---

## PART 3: IAM Role for EC2 Instances

To access Amazon S3 and allow secure AWS Systems Manager (SSM) Session Manager console access without keeping SSH port 22 open:

1. Search for **IAM** in AWS Console.
2. Click **Roles** -> **Create role**.
3. Select **AWS service**, use case: **EC2**. Click **Next**.
4. In Permissions policies, search and attach:
   - `AmazonSSMManagedInstanceCore`
5. Click **Next**, name the role: `ChristClubEC2Role`, and click **Create role**.
6. Open `ChristClubEC2Role`, under **Permissions**, click **Add permissions** -> **Create inline policy**:
   - Choose **JSON** and paste:
     ```json
     {
       "Version": "2012-10-17",
       "Statement": [
         {
           "Effect": "Allow",
           "Action": [
             "s3:PutObject",
             "s3:GetObject",
             "s3:ListBucket"
           ],
           "Resource": "*"
         }
       ]
     }
     ```
   - Click **Next**, name the policy `S3AccessPolicy`, and click **Create policy**.

---

## PART 4: Amazon RDS for PostgreSQL

### 4.1 Create DB Subnet Group
1. Search for **RDS** -> In the left menu, click **Subnet groups** -> **Create DB subnet group**.
2. Name: `christ-club-db-subnet-group`
3. Description: `Private subnets for RDS PostgreSQL`
4. VPC: `christ-club-vpc`
5. Under **Add subnets**:
   - Availability Zones: Select `us-east-1a` and `us-east-1b`
   - Subnets: Select `10.0.10.0/24` (`private-db-subnet-1a`) and `10.0.20.0/24` (`private-db-subnet-1b`).
6. Click **Create**.

### 4.2 Create the PostgreSQL Database
1. In RDS, click **Databases** -> **Create database**.
2. Choose **Standard create**.
3. Engine type: **PostgreSQL** (version PostgreSQL 16.x).
4. Templates: Select **Free tier** (uses `db.t3.micro` or `db.t4g.micro`).
5. Settings:
   - **DB instance identifier:** `christ-club-db`
   - **Master username:** `postgres`
   - **Master password:** `ChristClub2026!` (Choose a secure password and record it).
6. Connectivity:
   - **VPC:** `christ-club-vpc`
   - **DB Subnet group:** `christ-club-db-subnet-group`
   - **Public access:** **No** (Ensures private database isolation)
   - **VPC security group:** Choose **Existing** -> select `rds-sg` (Remove default SG).
7. Additional configuration:
   - **Initial database name:** `christclub`
8. Click **Create database**. (Takes ~5-7 minutes to become "Available").
9. Once available, copy the **Endpoint** (e.g. `christ-club-db.c123456789.us-east-1.rds.amazonaws.com`).

---

## PART 5: Amazon S3 Bucket Creation

1. Search for **S3** in the AWS Console.
2. Click **Create bucket**.
3. Bucket name: `christ-club-store-storage-<YOUR_NAME>` (e.g. `christ-club-store-storage-bppanwar`). Must be globally unique.
4. AWS Region: `us-east-1`
5. **Block Public Access settings for this bucket:** Ensure **Block all public access** is **CHECKED** (all 4 boxes checked).
6. **Bucket Versioning:** Enable.
7. **Default encryption:** Server-side encryption with Amazon S3 managed keys (SSE-S3 / AES256).
8. Click **Create bucket**.

---

## PART 6: Launching the Two EC2 Instances

### 6.1 Launch EC2 Instance A (in AZ `us-east-1a`)
1. Search for **EC2** -> **Instances** -> **Launch instances**.
2. **Name:** `ChristClub-Instance-A`
3. **Application and OS Images:** Amazon Linux 2023 AMI.
4. **Instance type:** `t3.micro` (or `t4g.micro` if using ARM64).
5. **Key pair:** Select your existing key pair or choose "Proceed without a key pair" if using SSM Session Manager.
6. **Network settings** (Click **Edit**):
   - VPC: `christ-club-vpc`
   - Subnet: `public-subnet-1a` (Availability Zone `us-east-1a`)
   - Auto-assign public IP: **Enable**
   - Firewall (security groups): **Select existing security group** -> choose `ec2-sg`.
7. **Advanced details**:
   - **IAM instance profile:** Select `ChristClubEC2Role`.
   - **User data:** Copy and paste the contents of `scripts/ec2-user-data.sh`.
8. Click **Launch instance**.

### 6.2 Launch EC2 Instance B (in AZ `us-east-1b`)
Repeat the exact same steps above, with these two differences:
- **Name:** `ChristClub-Instance-B`
- **Subnet:** Select `public-subnet-1b` (Availability Zone `us-east-1b`!).
- Click **Launch instance**.

---

## PART 7: Amazon EBS gp3 Volume Attachment (Requirement 4)

1. In EC2 left sidebar, click **Volumes** -> **Create volume**.
2. Volume type: **General Purpose SSD (gp3)**.
3. Size: `10 GiB`.
4. **Availability Zone:** Must match EC2 Instance A: **`us-east-1a`**!
5. Encryption: Check **Encrypt this volume**.
6. Name tag: `ChristClub-EBS-Volume-A`.
7. Click **Create volume**.
8. Select the created volume -> Click **Actions** -> **Attach volume**:
   - Instance: Select `ChristClub-Instance-A`.
   - Device name: `/dev/sdf` (or `/dev/xvdf`).
   - Click **Attach volume**.

### 7.1 Mount the EBS Volume inside EC2 Instance A
1. Connect to `ChristClub-Instance-A` using **EC2 Instance Connect** or **Session Manager** in the AWS console.
2. In the terminal, run:
   ```bash
   sudo bash /opt/christ-club-store/scripts/setup-ebs.sh
   # (or clone repo first and run: sudo bash scripts/setup-ebs.sh)
   ```
3. Verify the mount:
   ```bash
   df -h /mnt/demo-ebs
   cat /mnt/demo-ebs/sample-order-file.txt
   ```

---

## PART 8: Deploying the Application Code to Both Instances

Perform these steps on **BOTH** `ChristClub-Instance-A` and `ChristClub-Instance-B`:

1. Connect to the instance in AWS Console (**Connect** -> **EC2 Instance Connect**).
2. Clone your GitHub repository:
   ```bash
   cd /opt/christ-club-store
   sudo git clone https://github.com/<YOUR_GITHUB_USERNAME>/christ-club-online-store.git .
   sudo chown -R ec2-user:ec2-user /opt/christ-club-store
   ```
3. Install dependencies and build:
   ```bash
   npm install
   ```
4. Create the production `.env` file:
   ```bash
   nano .env
   ```
   Add:
   ```env
   PORT=3000
   NODE_ENV=production
   APP_VERSION=1.0.0
   DATABASE_URL="postgresql://postgres:ChristClub2026!@<RDS_ENDPOINT>:5432/christclub?schema=public"
   EBS_MOUNT_PATH=/mnt/demo-ebs
   S3_BUCKET_NAME=<YOUR_S3_BUCKET_NAME>
   AWS_REGION=us-east-1
   MOCK_S3_LOCAL=false
   ```
5. Apply database migrations & seed:
   *(Only needed on Instance A once, since both connect to the same RDS)*:
   ```bash
   npx prisma db push
   node scripts/seed.mjs
   ```
6. Build and start with PM2:
   ```bash
   npm run build
   pm2 start npm --name "christ-store" -- start
   pm2 save
   pm2 startup
   ```
7. Verify the local port:
   ```bash
   curl http://localhost:3000/api/health
   ```

---

## PART 9: Application Load Balancer (ALB) Setup (Requirement 2)

### 9.1 Create the Target Group
1. In EC2 left sidebar, click **Target Groups** -> **Create target group**.
2. Target type: **Instances**.
3. Target group name: `christ-club-tg`.
4. Protocol: **HTTP** | Port: `3000`.
5. VPC: `christ-club-vpc`.
6. Health checks:
   - Health check protocol: **HTTP**
   - Health check path: `/api/health`
   - Advanced health check settings:
     - Healthy threshold: `2`
     - Unhealthy threshold: `2`
     - Timeout: `5`
     - Interval: `15`
     - Success codes: `200`
7. Click **Next**.
8. Under **Register targets**:
   - Select both `ChristClub-Instance-A` and `ChristClub-Instance-B`.
   - Ensure port is `3000`.
   - Click **Include as pending below**.
9. Click **Create target group**.

### 9.2 Create the Application Load Balancer
1. In EC2 sidebar, click **Load Balancers** -> **Create load balancer**.
2. Choose **Application Load Balancer** -> Click **Create**.
3. Name: `christ-club-alb`.
4. Scheme: **Internet-facing**.
5. IP address type: **IPv4**.
6. Network mapping:
   - VPC: `christ-club-vpc`
   - Mappings:
     - Check `us-east-1a` -> choose `public-subnet-1a`.
     - Check `us-east-1b` -> choose `public-subnet-1b`.
7. Security groups:
   - Remove default and select `alb-sg`.
8. Listeners and routing:
   - Protocol: **HTTP** | Port: `80`
   - Default action: Forward to `christ-club-tg`.
9. Click **Create load balancer**.
10. Wait ~2 minutes for state to change to **Active**. Copy the **DNS name** (e.g., `christ-club-alb-123456789.us-east-1.elb.amazonaws.com`).

---

## PART 10: Testing Traffic Distribution and Safe Failover

### 10.1 Test Traffic Distribution
On your laptop PowerShell:
```powershell
powershell -File scripts/verify-alb-traffic.ps1 -TargetUrl http://<YOUR_ALB_DNS_NAME> -RequestCount 30
```
Observe requests alternating between `i-xxxxxx-Instance-A` and `i-yyyyyy-Instance-B`!

### 10.2 Demonstrate Safe Failover (Viva Demonstration)
1. In EC2 Instance A console, simulate a failure by stopping the app:
   ```bash
   pm2 stop christ-store
   ```
2. Wait 30 seconds for ALB health checks (`/api/health`) on Instance A to fail.
3. Check the Target Group in AWS Console: Instance A will show **Unhealthy**, Instance B remains **Healthy**.
4. Re-run `verify-alb-traffic.ps1`:
   - 100% of requests are now smoothly routed to Instance B with zero user errors!
5. Restore the application on Instance A:
   ```bash
   pm2 start christ-store
   ```
6. Observe Instance A transition back to **Healthy** and traffic resume balancing!

---

## PART 11: Cleaning Up AWS Resources (Prevent Billing!)

When you have captured your screenshots and completed your assignment evaluation, delete resources in this order:

1. **EC2 Instances:** Terminate `ChristClub-Instance-A` and `ChristClub-Instance-B`.
2. **Load Balancer:** Delete `christ-club-alb` and target group `christ-club-tg`.
3. **EBS Volume:** Delete `ChristClub-EBS-Volume-A`.
4. **RDS Database:** Select `christ-club-db` -> **Actions** -> **Delete** (Uncheck "Create final snapshot", check acknowledgment).
5. **S3 Bucket:** Empty and delete `christ-club-store-storage-<name>`.
6. **VPC:** Delete `christ-club-vpc` (this automatically removes subnets, IGW, route tables, and security groups).
