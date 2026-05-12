pipeline {
    agent any

    environment {
        AWS_REGION = 'us-east-1'
        AWS_ACC_ID = credentials('aws-account-id')
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
                Write-Host "Retrieving ECR Password..."
                \$password = (aws ecr get-login-password --region ${AWS_REGION}).Trim()
                if (\$LASTEXITCODE -ne 0) { throw "AWS Login Password retrieval failed!" }
                
                \$ecr_url = "${AWS_ACC_ID}".Trim() + ".dkr.ecr.${AWS_REGION}.amazonaws.com"
                Write-Host "Logging into: \$ecr_url"
                
                docker login --username AWS --password \$password \$ecr_url
                """
            }
        }

        stage('Build & Push Backend') {
            steps {
                dir('server') {
                    powershell """
                    \$ecr_url = "${AWS_ACC_ID}".Trim() + ".dkr.ecr.${AWS_REGION}.amazonaws.com"
                    docker build -t ${ECR_BACKEND_REPO}:${BUILD_NUMBER} .
                    docker tag ${ECR_BACKEND_REPO}:${BUILD_NUMBER} "\$ecr_url/${ECR_BACKEND_REPO}:${BUILD_NUMBER}"
                    docker tag ${ECR_BACKEND_REPO}:${BUILD_NUMBER} "\$ecr_url/${ECR_BACKEND_REPO}:latest"
                    docker push "\$ecr_url/${ECR_BACKEND_REPO}:${BUILD_NUMBER}"
                    docker push "\$ecr_url/${ECR_BACKEND_REPO}:latest"
                    """
                }
            }
        }

        stage('Build & Push Frontend') {
            steps {
                dir('client') {
                    powershell """
                    \$ecr_url = "${AWS_ACC_ID}".Trim() + ".dkr.ecr.${AWS_REGION}.amazonaws.com"
                    docker build -t ${ECR_FRONTEND_REPO}:${BUILD_NUMBER} .
                    docker tag ${ECR_FRONTEND_REPO}:${BUILD_NUMBER} "\$ecr_url/${ECR_FRONTEND_REPO}:${BUILD_NUMBER}"
                    docker tag ${ECR_FRONTEND_REPO}:${BUILD_NUMBER} "\$ecr_url/${ECR_FRONTEND_REPO}:latest"
                    docker push "\$ecr_url/${ECR_FRONTEND_REPO}:${BUILD_NUMBER}"
                    docker push "\$ecr_url/${ECR_FRONTEND_REPO}:latest"
                    """
                }
            }
        }

        stage('Deploy to EKS') {
            steps {
                powershell """
                aws eks update-kubeconfig --region ${AWS_REGION} --name ${CLUSTER_NAME}
                \$ecr_url = "${AWS_ACC_ID}".Trim() + ".dkr.ecr.${AWS_REGION}.amazonaws.com"
                
                (Get-Content -Path k8s/backend.yaml -Raw) -replace 'image: .*internmatch-backend:.*', "image: \$ecr_url/${ECR_BACKEND_REPO}:${BUILD_NUMBER}" | Set-Content -Path k8s/backend.yaml
                (Get-Content -Path k8s/frontend.yaml -Raw) -replace 'image: .*internmatch-frontend:.*', "image: \$ecr_url/${ECR_FRONTEND_REPO}:${BUILD_NUMBER}" | Set-Content -Path k8s/frontend.yaml
                
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
