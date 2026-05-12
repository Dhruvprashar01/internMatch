# 🚀 InternMatch - Production DevOps Documentation

This document provides a comprehensive overview of the enterprise-grade DevOps infrastructure implemented for the InternMatch Capstone Project. The application is fully containerized, orchestrated via Kubernetes (EKS), and managed using Infrastructure as Code (Terraform).

## 🌍 Live Access
- **Production Web App**: [http://k8s-internma-internma-8d199acece-258035816.us-east-1.elb.amazonaws.com](http://k8s-internma-internma-8d199acece-258035816.us-east-1.elb.amazonaws.com)
- **API Health Check**: [http://k8s-internma-internma-8d199acece-258035816.us-east-1.elb.amazonaws.com/api/health](http://k8s-internma-internma-8d199acece-258035816.us-east-1.elb.amazonaws.com/api/health)

---

## 🏗️ Architecture Overview

### 1. Cloud Infrastructure (AWS + Terraform)
The infrastructure is provisioned in the `us-east-1` region using Terraform:
- **VPC**: Custom network with 2 Public Subnets across multiple Availability Zones.
- **EKS**: Elastic Kubernetes Service cluster running `t3.small` worker nodes.
- **ECR**: Private container registries for `backend` and `frontend` images.
- **ALB**: Application Load Balancer managed by the AWS Load Balancer Controller.

### 2. Containerization (Docker)
- **Frontend**: Multi-stage build using Nginx for high-performance static serving.
- **Backend**: Node.js production-ready image with security hardening.
- **Local Dev**: `docker-compose.yml` for rapid local testing.

---

## 🛠️ Step-by-Step Deployment Guide

### Phase 1: Infrastructure as Code (Terraform)
We used Terraform to automate the creation of all AWS resources.
```powershell
cd terraform
terraform init
terraform apply -auto-approve
```
*This created the VPC, Subnets, IAM Roles, ECR repositories, and the EKS Cluster.*

### Phase 2: Containerization & Registry
We built the images and pushed them to our private AWS registries.
```powershell
# Login to AWS ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

# Build & Push Backend
docker build -t internmatch-backend ./server
docker tag internmatch-backend:latest <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/internmatch-backend:latest
docker push <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/internmatch-backend:latest

# Build & Push Frontend
docker build -t internmatch-frontend ./client
docker tag internmatch-frontend:latest <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/internmatch-frontend:latest
docker push <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/internmatch-frontend:latest
```

### Phase 3: Kubernetes Orchestration
We deployed the application components into the cluster.
```powershell
# Connect your local terminal to the new EKS Cluster
aws eks update-kubeconfig --region us-east-1 --name internmatch-eks

# Create Namespace and Secrets
kubectl apply -f k8s/namespace.yaml
kubectl create secret generic backend-secrets --from-literal=jwt-secret='...' --from-literal=gemini-api-key='...' -n internmatch

# Deploy Application
kubectl apply -f k8s/mongodb.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml
```

---

## 📊 Monitoring & Observability
We implemented a professional monitoring stack to track performance and errors.
- **Prometheus**: Collects metrics from all pods.
- **Grafana**: Provides visual dashboards.

### Accessing Dashboards
```powershell
# Deploy Monitoring Stack
kubectl apply -f monitoring/prometheus.yaml
kubectl apply -f monitoring/grafana.yaml

# Access Grafana locally
kubectl port-forward svc/grafana-service 3000:3000 -n monitoring
# Open http://localhost:3000 in your browser (User: admin / Pass: admin)
```

---

## 🔄 CI/CD Pipeline (Jenkins)
The `Jenkinsfile` in the root directory automates the following stages:
1. **Source**: Pulls latest code from GitHub.
2. **Build**: Compiles and builds Docker images.
3. **Registry**: Pushes images to AWS ECR.
4. **Deploy**: Triggers a **Rolling Update** in Kubernetes (Zero Downtime).

**Jenkins Setup:**
- Create a 'Pipeline' job.
- Point to your GitHub repo.
- Ensure the Jenkins server has the `aws-cli` and `docker` installed.

---

## 🛡️ Security & Best Practices
- **Minimal Images**: Used `node:18-slim` and `nginx:alpine` to reduce attack surface.
- **Non-Root Containers**: Apps run as non-privileged users within K8s.
- **Scaling**: HPA automatically adds pods if CPU exceeds 70%.
- **Health Checks**: Liveness and Readiness probes ensure traffic only goes to healthy pods.

---

## 🔍 Troubleshooting Commands
```powershell
# Check if pods are running
kubectl get pods -n internmatch

# View logs for a specific pod
kubectl logs <pod-name> -n internmatch

# Describe a resource to find errors
kubectl describe pod <pod-name> -n internmatch
kubectl describe ingress internmatch-ingress -n internmatch
```

---
**Senior DevOps Engineering Team**
*Capstone Project Productionization - 2026*
