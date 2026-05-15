# 🎓 InternMatch - Presentation Demo Cheat Sheet

Use this file during your demo to quickly copy-paste commands and show the judges the power of your infrastructure.

**Project Path:** `c:\Users\ASUS\Downloads\internMatchC\internMatch`

---

## 📋 PRE-PRESENTATION CHECKLIST (If you just turned on your laptop)
1.  **Start Jenkins:** Run Command #1 below (keep terminal open).
2.  **Start ngrok:** Run `ngrok http 8080` (keep terminal open).
3.  **Update GitHub:** Copy the new `https://...` link from ngrok and paste it into **GitHub > Settings > Webhooks**.
4.  **Open Browser:** Go to `http://localhost:8080` and `http://localhost:3000`.

---

## 🚀 1. Jenkins & CI/CD (The Automation)
**How to start Jenkins manually (if it closes):**
```powershell
# Run this in Administrator PowerShell
$env:AWS_ACCESS_KEY_ID="YOUR_ACCESS_KEY"; $env:AWS_SECRET_ACCESS_KEY="YOUR_SECRET_KEY"; $env:JENKINS_HOME="C:\ProgramData\Jenkins\.jenkins"; & "C:\Program Files\Java\jdk-21\bin\java.exe" -Xmx1g -jar "C:\Program Files\Jenkins\jenkins.war" --httpPort=8080
```

**How to start the public bridge (for automatic GitHub triggers):**
```powershell
# Run this in a separate terminal
ngrok http 8080
```

---

## ☸️ 2. Kubernetes (The Orchestration)
**Check if your application is healthy:**
```powershell
# See all pods in the internmatch namespace
kubectl get pods -n internmatch

# See the external IP (URL) of your application
kubectl get ingress -n internmatch
```

**Check logs (if a judge asks how you debug):**
```powershell
# Replace <pod-name> with a name from the command above
kubectl logs <pod-name> -n internmatch
```

---

## 📊 3. Monitoring (Prometheus & Grafana)
**Access your Dashboards locally:**
```powershell
# Run this to "tunnel" Grafana to your laptop
kubectl port-forward svc/grafana-service 3000:3000 -n monitoring
# Now open: http://localhost:3000 (User: admin / Pass: admin)
```

**Check Node Health:**
```powershell
# See the status of your AWS worker nodes
kubectl get nodes
```

---

## 🏗️ 4. Terraform & AWS (The Infrastructure)
**Show your Infrastructure as Code:**
```powershell
# Go to terraform folder
cd terraform

# Show that the infrastructure is currently active
terraform plan
```

**AWS Console Tip:**
- **EKS:** [https://console.aws.amazon.com/eks/home](https://console.aws.amazon.com/eks/home)
- **ECR (Images):** [https://console.aws.amazon.com/ecr/repositories](https://console.aws.amazon.com/ecr/repositories)

---

## 🛡️ 5. Scaling & Reliability
**Show Auto-Scaling in action:**
```powershell
# This shows that Kubernetes will add pods if CPU hits 70%
kubectl get hpa -n internmatch
```

---

