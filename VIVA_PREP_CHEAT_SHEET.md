# 🎓 InternMatch - Viva Prep Cheat Sheet

Master these answers to prove you are a pro DevOps Engineer.

---

### 🏛️ Q1: Why did you use Kubernetes (EKS) instead of just a simple EC2 server?
**Answer:** *"A single EC2 server is a 'Single Point of Failure.' If it goes down, the app goes down. We used **AWS EKS** (Elastic Kubernetes Service) for **High Availability**. If a container crashes, Kubernetes automatically restarts it. If traffic spikes, it scales. It ensures the application is 'Self-Healing'."*

---

### 🏗️ Q2: What is the benefit of using Terraform? Why not just use the AWS Console?
**Answer:** *"We use Terraform for **Infrastructure as Code (IaC)**. Manually clicking in the AWS Console is prone to human error and isn't repeatable. With Terraform, our entire data center is defined in code. We can rebuild the entire infrastructure in a new region in minutes with 100% consistency."*

---

### 🤖 Q3: Explain your CI/CD flow. What happens when you push code?
**Answer:** *"We have a fully automated pipeline. **GitHub** sends a **Webhook** to our **Jenkins** server. Jenkins then:
1.  Downloads the new code.
2.  Runs a **Multi-stage Docker build** to create optimized images.
3.  Pushes those images to **AWS ECR** (Elastic Container Registry).
4.  Updates the **Kubernetes Deployment** on EKS.
This ensures that the latest code is in production within minutes without any manual work."*

---

### 📈 Q4: How do you handle a sudden surge of 10,000 users?
**Answer:** *"We implemented **Horizontal Pod Autoscaling (HPA)**. Our system monitors CPU and Memory usage in real-time. If usage hits our 70% threshold, the HPA automatically spins up new pods (up to 10) to handle the load. Once the traffic subsides, it scales back down to save costs."*

---

### 📊 Q5: What is the difference between Prometheus and Grafana?
**Answer:** *"**Prometheus** is our 'Data Collector' (the brain). It scrapes metrics from our nodes and pods every 15 seconds. **Grafana** is our 'Visualization Layer.' It takes the raw data from Prometheus and turns it into human-readable dashboards so we can spot trends and issues at a glance."*

---

### 🐳 Q6: Why did you use Multi-stage Docker builds?
**Answer:** *"Security and performance. A standard build includes the source code and build tools, which makes the image huge (1GB+) and less secure. By using **Multi-stage builds**, our final production image only contains the compiled application, making it tiny (under 100MB) and much harder for hackers to exploit."*

---

### 🌐 Q7: What was the role of ngrok in your project?
**Answer:** *"Since our Jenkins server was running locally, GitHub couldn't 'see' it to send webhooks. We used **ngrok** as a **Secure Tunnel** to give our local Jenkins a public URL. This allowed us to test a real production-grade CI/CD flow without needing a static public IP."*

---

### 🔑 Q8: How do you handle secrets like Database passwords and API keys?
**Answer:** *"We never hardcode secrets. We use **Kubernetes Secrets** and **Environment Variables**. This keeps sensitive data out of the source code and ensures they are only injected into the containers at runtime."*

---

### 🎖️ Final Tip for Viva:
If they ask a question you don't know, say: 
> *"That's a great question. In our current architecture, we focused on [X], but for a version 2.0, we would look into [Y] to solve that specific challenge."* (This shows you are thinking like an Architect!)
