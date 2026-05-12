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
                sh "aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
            }
        }

        stage('Build & Push Backend') {
            steps {
                dir('server') {
                    sh "docker build -t ${ECR_BACKEND_REPO}:${BUILD_NUMBER} ."
                    sh "docker tag ${ECR_BACKEND_REPO}:${BUILD_NUMBER} ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_BACKEND_REPO}:${BUILD_NUMBER}"
                    sh "docker tag ${ECR_BACKEND_REPO}:${BUILD_NUMBER} ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_BACKEND_REPO}:latest"
                    sh "docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_BACKEND_REPO}:${BUILD_NUMBER}"
                    sh "docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_BACKEND_REPO}:latest"
                }
            }
        }

        stage('Build & Push Frontend') {
            steps {
                dir('client') {
                    sh "docker build -t ${ECR_FRONTEND_REPO}:${BUILD_NUMBER} ."
                    sh "docker tag ${ECR_FRONTEND_REPO}:${BUILD_NUMBER} ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_FRONTEND_REPO}:${BUILD_NUMBER}"
                    sh "docker tag ${ECR_FRONTEND_REPO}:${BUILD_NUMBER} ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_FRONTEND_REPO}:latest"
                    sh "docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_FRONTEND_REPO}:${BUILD_NUMBER}"
                    sh "docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_FRONTEND_REPO}:latest"
                }
            }
        }

        stage('Deploy to EKS') {
            steps {
                sh "aws eks update-kubeconfig --region ${AWS_REGION} --name ${CLUSTER_NAME}"
                
                // Update image tags in manifests
                sh "sed -i 's|<AWS_ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/internmatch-backend:latest|${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_BACKEND_REPO}:${BUILD_NUMBER}|g' k8s/backend.yaml"
                sh "sed -i 's|<AWS_ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/internmatch-frontend:latest|${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_FRONTEND_REPO}:${BUILD_NUMBER}|g' k8s/frontend.yaml"
                
                sh "kubectl apply -f k8s/namespace.yaml"
                sh "kubectl apply -f k8s/mongodb.yaml"
                sh "kubectl apply -f k8s/backend.yaml"
                sh "kubectl apply -f k8s/frontend.yaml"
                sh "kubectl apply -f k8s/ingress.yaml"
                sh "kubectl apply -f k8s/hpa.yaml"
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}
