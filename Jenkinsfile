pipeline {
    agent any

    environment {
        AWS_REGION = 'us-east-1'
        AWS_ACCOUNT_ID = credentials('aws-account-id')
        ECR_BACKEND_REPO = 'internmatch-backend'
        ECR_FRONTEND_REPO = 'internmatch-frontend'
        CLUSTER_NAME = 'internmatch-eks'
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/Dhruvprashar01/internMatch.git'
            }
        }

        stage('Login to ECR') {
            steps {
                powershell "aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
            }
        }

        stage('Build & Push Backend') {
            steps {
                dir('server') {
                    powershell "docker build -t ${ECR_BACKEND_REPO}:${BUILD_NUMBER} ."
                    powershell "docker tag ${ECR_BACKEND_REPO}:${BUILD_NUMBER} ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_BACKEND_REPO}:${BUILD_NUMBER}"
                    powershell "docker tag ${ECR_BACKEND_REPO}:${BUILD_NUMBER} ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_BACKEND_REPO}:latest"
                    powershell "docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_BACKEND_REPO}:${BUILD_NUMBER}"
                    powershell "docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_BACKEND_REPO}:latest"
                }
            }
        }

        stage('Build & Push Frontend') {
            steps {
                dir('client') {
                    powershell "docker build -t ${ECR_FRONTEND_REPO}:${BUILD_NUMBER} ."
                    powershell "docker tag ${ECR_FRONTEND_REPO}:${BUILD_NUMBER} ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_FRONTEND_REPO}:${BUILD_NUMBER}"
                    powershell "docker tag ${ECR_FRONTEND_REPO}:${BUILD_NUMBER} ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_FRONTEND_REPO}:latest"
                    powershell "docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_FRONTEND_REPO}:${BUILD_NUMBER}"
                    powershell "docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_FRONTEND_REPO}:latest"
                }
            }
        }

        stage('Deploy to EKS') {
            steps {
                powershell "aws eks update-kubeconfig --region ${AWS_REGION} --name ${CLUSTER_NAME}"
                
                // Update image tags in manifests using PowerShell replacement
                powershell """
                (Get-Content -Path k8s/backend.yaml -Raw) -replace 'image: .*internmatch-backend:.*', 'image: ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_BACKEND_REPO}:${BUILD_NUMBER}' | Set-Content -Path k8s/backend.yaml
                (Get-Content -Path k8s/frontend.yaml -Raw) -replace 'image: .*internmatch-frontend:.*', 'image: ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_FRONTEND_REPO}:${BUILD_NUMBER}' | Set-Content -Path k8s/frontend.yaml
                """
                
                powershell "kubectl apply -f k8s/namespace.yaml"
                powershell "kubectl apply -f k8s/mongodb.yaml"
                powershell "kubectl apply -f k8s/backend.yaml"
                powershell "kubectl apply -f k8s/frontend.yaml"
                powershell "kubectl apply -f k8s/ingress.yaml"
                powershell "kubectl apply -f k8s/hpa.yaml"
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}
