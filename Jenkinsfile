pipeline {
    agent any

    environment {
        AWS_REGION = 'us-east-1'
        AWS_ACCOUNT_ID = credentials('aws-account-id')
        AWS_ACCESS_KEY_ID = credentials('aws-access-key')
        AWS_SECRET_ACCESS_KEY = credentials('aws-secret-key')
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
                powershell """
                \$env:AWS_ACCESS_KEY_ID = '${AWS_ACCESS_KEY_ID}'
                \$env:AWS_SECRET_ACCESS_KEY = '${AWS_SECRET_ACCESS_KEY}'
                aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
                """
            }
        }

        stage('Build & Push Backend') {
            steps {
                dir('server') {
                    powershell "docker build -t ${ECR_BACKEND_REPO}:${BUILD_NUMBER} ."
                    powershell "docker tag ${ECR_BACKEND_REPO}:${BUILD_NUMBER} ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_BACKEND_REPO}:${BUILD_NUMBER}"
                    powershell "docker tag ${ECR_BACKEND_REPO}:${BUILD_NUMBER} ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_BACKEND_REPO}:latest"
                    powershell """
                    \$env:AWS_ACCESS_KEY_ID = '${AWS_ACCESS_KEY_ID}'
                    \$env:AWS_SECRET_ACCESS_KEY = '${AWS_SECRET_ACCESS_KEY}'
                    docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_BACKEND_REPO}:${BUILD_NUMBER}
                    docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_BACKEND_REPO}:latest
                    """
                }
            }
        }

        stage('Build & Push Frontend') {
            steps {
                dir('client') {
                    powershell "docker build -t ${ECR_FRONTEND_REPO}:${BUILD_NUMBER} ."
                    powershell "docker tag ${ECR_FRONTEND_REPO}:${BUILD_NUMBER} ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_FRONTEND_REPO}:${BUILD_NUMBER}"
                    powershell "docker tag ${ECR_FRONTEND_REPO}:${BUILD_NUMBER} ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_FRONTEND_REPO}:latest"
                    powershell """
                    \$env:AWS_ACCESS_KEY_ID = '${AWS_ACCESS_KEY_ID}'
                    \$env:AWS_SECRET_ACCESS_KEY = '${AWS_SECRET_ACCESS_KEY}'
                    docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_FRONTEND_REPO}:${BUILD_NUMBER}
                    docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_FRONTEND_REPO}:latest
                    """
                }
            }
        }

        stage('Deploy to EKS') {
            steps {
                powershell """
                \$env:AWS_ACCESS_KEY_ID = '${AWS_ACCESS_KEY_ID}'
                \$env:AWS_SECRET_ACCESS_KEY = '${AWS_SECRET_ACCESS_KEY}'
                aws eks update-kubeconfig --region ${AWS_REGION} --name ${CLUSTER_NAME}
                
                (Get-Content -Path k8s/backend.yaml -Raw) -replace 'image: .*internmatch-backend:.*', 'image: ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_BACKEND_REPO}:${BUILD_NUMBER}' | Set-Content -Path k8s/backend.yaml
                (Get-Content -Path k8s/frontend.yaml -Raw) -replace 'image: .*internmatch-frontend:.*', 'image: ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_FRONTEND_REPO}:${BUILD_NUMBER}' | Set-Content -Path k8s/frontend.yaml
                
                kubectl apply -f k8s/namespace.yaml
                kubectl apply -f k8s/mongodb.yaml
                kubectl apply -f k8s/backend.yaml
                kubectl apply -f k8s/frontend.yaml
                kubectl apply -f k8s/ingress.yaml
                kubectl apply -f k8s/hpa.yaml
                """
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}
