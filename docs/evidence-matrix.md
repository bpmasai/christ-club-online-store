# Requirements-to-Evidence Matrix
**Project:** Christ Club Online Store  
**Course:** MSc AIML Cloud Computing for AI  

This document serves as your assignment grading rubric and viva defense reference, linking each of the four core AWS assignment requirements directly to its implementation files, execution commands, and expected evidence.

---

## Assignment Evidence Matrix

| Requirement # | AWS Service & Resources | Implementation Files | Exact Verification Command(s) | Evidence / Screenshot Checklist |
|---|---|---|---|---|
| **Requirement 1**<br>Deploy on at least two Linux EC2 instances in separate AZs | - 2x Amazon Linux 2023 EC2 (`t3.micro` or `t4g.micro`)<br>- EC2 Instance A (AZ `us-east-1a`)<br>- EC2 Instance B (AZ `us-east-1b`)<br>- PM2 Process Manager | - `scripts/ec2-user-data.sh`<br>- `lib/ec2-metadata.ts`<br>- `app/api/instance/route.ts`<br>- `app/infrastructure/page.tsx` | **From Laptop/Browser:**<br>1. Open ALB DNS in browser: `http://<ALB_DNS>/infrastructure`<br>2. Run in terminal:<br>`powershell -File scripts/verify-alb-traffic.ps1 -TargetUrl http://<ALB_DNS>` | 1. AWS EC2 Console: "Instances" list showing 2 running instances in 2 different Availability Zones (e.g. `us-east-1a` and `us-east-1b`).<br>2. Terminal output showing `instanceId` and `availabilityZone` returned by IMDSv2. |
| **Requirement 2**<br>Configure an AWS ALB and demonstrate traffic distribution | - AWS Application Load Balancer (Internet-facing)<br>- Target Group (Port 3000, HTTP)<br>- Health Check `/api/health`<br>- Listener on Port 80 | - `app/api/health/route.ts`<br>- `components/instance-badge.tsx`<br>- `scripts/verify-alb-traffic.ps1`<br>- `scripts/verify-alb-traffic.sh` | **1. Traffic Distribution:**<br>`powershell -File scripts/verify-alb-traffic.ps1 -TargetUrl http://<ALB_DNS> -RequestCount 30`<br><br>**2. Safe Failover Test:**<br>On EC2 A: `pm2 stop christ-store`<br>Re-run script: observe 100% traffic goes to EC2 B.<br>On EC2 A: `pm2 restart christ-store` | 1. AWS ALB Console: Target Group showing both EC2 instances with **Healthy** status.<br>2. Summary table screenshot showing balanced request count across both instances.<br>3. Failover test screenshot showing ALB automatically diverting traffic from unhealthy instance. |
| **Requirement 3**<br>Amazon RDS PostgreSQL database, connection from EC2, seed orders, execute SQL | - Amazon RDS PostgreSQL 16 (Free Tier `db.t4g.micro` or `db.t3.micro`)<br>- Private DB Subnet Group<br>- Security group `rds-sg` allowing port 5432 from `ec2-sg` only | - `prisma/schema.prisma`<br>- `scripts/seed.mjs`<br>- `scripts/sample-queries.sql`<br>- `scripts/test-rds-psql.sh`<br>- `app/api/ready/route.ts`<br>- `app/orders/page.tsx` | **From EC2 via SSM Session Manager:**<br>`sudo dnf install -y postgresql15`<br>`psql -h <RDS_ENDPOINT> -U postgres -d christclub -f scripts/sample-queries.sql`<br><br>**From Web App:**<br>Open `http://<ALB_DNS>/orders` | 1. AWS RDS Console: Database showing "Available", "Multi-AZ / Single-AZ", Private Accessibility "No".<br>2. Terminal screenshot of `psql` executing: (1) List orders, (2) Filter by status, (3) Total revenue `SUM(amount)`, (4) `GROUP BY status`.<br>3. Web UI Orders Page showing orders fetched from RDS. |
| **Requirement 4**<br>EBS block storage file & separate S3 object storage file | - Amazon EBS gp3 volume (10 GB, Encrypted) attached to EC2 A<br>- Amazon S3 Private Bucket with Block Public Access<br>- IAM Role attached to EC2 with S3 policy | - `scripts/setup-ebs.sh`<br>- `lib/storage-service.ts`<br>- `app/storage/page.tsx`<br>- `app/api/storage/ebs/route.ts`<br>- `app/api/storage/s3/route.ts` | **EBS on EC2 A:**<br>`df -h /mnt/demo-ebs`<br>`cat /mnt/demo-ebs/sample-order-file.txt`<br><br>**S3 from AWS CLI / Browser:**<br>`aws s3 ls s3://<BUCKET_NAME>/`<br>`aws s3 cp s3://<BUCKET_NAME>/sample-s3-file.txt -` | 1. AWS EC2 Console: "Volumes" showing gp3 volume attached to EC2 Instance A.<br>2. Terminal output of `df -h` and `cat /mnt/demo-ebs/sample-order-file.txt`.<br>3. AWS S3 Console: Bucket showing `sample-s3-file.txt` with AES256 encryption.<br>4. Web UI Storage Demo page (`/storage`) showing verified status of both. |

---

## Evaluation Presentation Script (Viva Talking Points)

1. **Why multi-AZ?** High availability. If AWS has a localized data center outage in `us-east-1a`, the ALB health check marks EC2 A as unhealthy and redirects 100% of user traffic to EC2 B in `us-east-1b` without user downtime.
2. **Why private subnets for RDS?** Security in depth. The database should never have a public IPv4 address. Only instances in `ec2-sg` can open connections to PostgreSQL on port 5432.
3. **What is the difference between EBS and S3?**
   - **EBS** is raw block storage attached directly over high-speed NVMe to an EC2 instance hypervisor, confined to a single Availability Zone.
   - **S3** is internet/IAM accessible object storage that is replicated across a minimum of 3 Availability Zones automatically, giving 99.999999999% (11 9s) of durability.
4. **Why IMDSv2 instead of IMDSv1?** IMDSv2 requires session tokens (PUT request first) to protect against Server-Side Request Forgery (SSRF) vulnerabilities.
