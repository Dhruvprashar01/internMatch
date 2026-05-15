# 🎓 InternMatch: Production Infrastructure Presentation Guide

This document serves as your "Executive Summary" and "Live Demo Script" for your Capstone presentation.

---

## 🏗️ 1. The Production Tech Stack (The "Why")

| Tool | Role | Why we used it? |
| :--- | :--- | :--- |
| **AWS EKS** | Orchestration | Industry standard for high-availability. It manages our containers so they never go down. |
| **Terraform** | IaC | "Infrastructure as Code." We can rebuild our entire data center in 10 minutes with one command. |
| **Docker** | Containerization | "Works on my machine" is gone. The app is packaged with all its needs inside a container. |
| **Jenkins** | CI/CD | Full automation. Every time we push code to GitHub, the robot builds and deploys it. |
| **Prometheus** | Monitoring | The "Eyes" of the system. It tracks CPU, Memory, and health 24/7. |
| **Grafana** | Visualization | The "Dashboard." It turns raw data into beautiful, professional graphs for the team. |
| **HPA** | Auto-Scaling | Cost efficiency. When traffic hits, we grow. When it's quiet, we shrink to save money. |

---

## 📺 2. The Live Demo Flow (How to "Wow" the judges)

### Step A: Show the Cloud
- **Action**: Open the AWS Console -> EKS.
- **Talking Point**: "Here is our live production cluster running in North Virginia. It's managed by Terraform."

### Step B: Show the Automation (The Jenkins "Magic")
- **Action**: Go to Jenkins (`localhost:8080`) and click **"Build Now"**.
- **Talking Point**: "Watch this. I don't manually upload code. Our CI/CD pipeline handles the build, security, and deployment automatically."

### Step C: Show the Monitoring (The "Grafana" View)
- **Action**: Open Grafana. Show the **Node Exporter** dashboard.
- **Talking Point**: "We have full observability. We can see every Pod's CPU usage in real-time."

### Step D: Show the Auto-Scaling (The "Stress Test")
- **Action**: Run `kubectl get hpa -n internmatch -w` in your terminal.
- **Talking Point**: "When I simulate 1,000 users, you'll see the system automatically scale from 2 pods to 10 pods to handle the load."

---

## 🔋 3. The "Morning After" (Restart Guide)

If you shut down your laptop and need to start everything again for the presentation:

### 1. Set your AWS Environment
```powershell

```

### 2. Connect to the Cluster
```powershell
aws eks update-kubeconfig --region us-east-1 --name internmatch-eks
```

### 3. Open your Port-Forwards (Keep these terminals open!)
- **To see Jenkins**: (It runs as a Windows Service, just open `http://localhost:8080`)
- **To see Grafana**:
  ```powershell
  kubectl port-forward svc/grafana -n monitoring 3000:80
  ```
- **To see Prometheus**:
  ```powershell
  kubectl port-forward svc/prometheus-server -n monitoring 9090:80
  ```

---

## ⚠️ 4. The "Final Kill" (Stopping the Costs)
**IMPORTANT**: Once your presentation is 100% finished and you are graded, run this to avoid AWS charges:
```powershell
cd terraform/
terraform destroy -auto-approve
```

---
**Good luck! You've built a professional-grade DevOps ecosystem.** 🚀🏅
