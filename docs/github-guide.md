# GitHub Repository Setup Guide
**Project:** Christ Club Online Store  
**Course:** MSc AIML Cloud Computing for AI  

Follow these steps to create a GitHub repository under your personal GitHub account and push this project codebase.

---

## Step 1: Create a New Repository on GitHub

1. Log into your account at [github.com](https://github.com).
2. In the top right corner, click the **`+`** icon and select **New repository**.
3. Fill in the repository details:
   - **Repository name:** `christ-club-online-store` (or `college-club-store`)
   - **Description:** `AWS-hosted modern order management web application demonstrating multi-AZ EC2, ALB, Amazon RDS PostgreSQL, EBS, and S3.`
   - **Visibility:** Choose **Public** (recommended for coursework submission) or **Private**.
   - **Initialize this repository with:** **DO NOT** check "Add a README file", "Add .gitignore", or choose a license (we already have customized versions of these files in the workspace).
4. Click **Create repository**.
5. Copy the repository URL (e.g., `https://github.com/<YOUR_GITHUB_USERNAME>/christ-club-online-store.git`).

---

## Step 2: Initialize Git and Commit Locally

Open PowerShell in this project folder (`c:\Users\BP Panwar\Documents\Projects\CollegeClubStore`) and run:

```powershell
# 1. Initialize git tracking
git init

# 2. Verify git status (confirm .env and node_modules are ignored by .gitignore)
git status

# 3. Stage all project files
git add .

# 4. Create your initial commit
git commit -m "feat: complete Christ Club Online Store with AWS manual deployment guides"
```

---

## Step 3: Link and Push to Your GitHub Account

Replace `<YOUR_GITHUB_USERNAME>` and `<REPO_NAME>` with your actual GitHub username and repository name:

```powershell
# 1. Set the default branch to main
git branch -M main

# 2. Add your remote GitHub repository
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/christ-club-online-store.git

# 3. Push the code to GitHub
git push -u origin main
```

*(If prompted, log in with your GitHub credentials or Personal Access Token).*

---

## Step 4: Making Updates in the Future

Whenever you make changes or add assignment notes:

```powershell
git add .
git commit -m "docs: update assignment verification screenshots"
git push
```
