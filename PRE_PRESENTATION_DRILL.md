# 🚀 Game Day: Pre-Presentation Drill

Perform these steps **30 minutes before** your presentation starts to ensure everything is perfect.

---

## 🛠️ Step 1: Start the Infrastructure "Engines"
1. **Jenkins:** Open Administrator PowerShell and run:
   ```powershell
   $env:JENKINS_HOME="C:\ProgramData\Jenkins\.jenkins"; & "C:\Program Files\Java\jdk-21\bin\java.exe" -Xmx1g -jar "C:\Program Files\Jenkins\jenkins.war" --httpPort=8080
   ```
2. **ngrok:** Open a new terminal and run:
   ```powershell
   ngrok http 8080
   ```
3. **GitHub Update:** Copy the new ngrok URL and update the **Webhook** in GitHub Settings.

---

## 🔑 Step 2: AWS Cloud Connection
Since you ran `aws configure`, you just need to run this in VS Code:
```cmd
aws eks update-kubeconfig --region us-east-1 --name internmatch-eks
```

---

## ✅ Step 3: The "Pre-Flight" Check
Run these to make sure you have 🟢 green lights everywhere:
- [ ] `kubectl get nodes` (Should see 2 nodes 'Ready')
- [ ] `kubectl get pods -n internmatch` (Should see all pods 'Running')
- [ ] Open `http://localhost:8080` (Check Jenkins is up)
- [ ] Open the **AWS Load Balancer URL** (Check the website is live)

---

## 📜 Step 4: Your Presentation Script (PASTE BELOW)
> **[User: Paste your finalized script here tomorrow!]**

---

### 💡 Final Tip:
Minimize your terminal windows so they are ready to be "pulled up" quickly during the demo. Appearance is everything! 🏅
