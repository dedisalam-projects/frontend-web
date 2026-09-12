pipeline {
    agent any
    
    tools {
        nodejs 'Node24'
    }
    
    environment {
        NPM_CONFIG_UPDATE_NOTIFIER = 'false'
    }
    
    options {
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
    }
    
    triggers {
        githubPush()
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Install Dependencies') {
            steps {
                echo 'Installing dependencies...'
                sh 'pkill -f "ng" || true'
                sh 'npm ci --legacy-peer-deps || npm install --legacy-peer-deps'
            }
        }
        
        stage('Build Angular') {
            steps {
                echo 'Building Angular production bundle...'
                sh 'npm run build'
            }
        }
        
        stage('Build & Push Docker Image') {
            steps {
                echo 'Building Docker production image...'
                sh 'docker build -t dedisalam/frontend-web:latest -f docker/web/Dockerfile.prod .'
                echo 'Pushing Docker image to Docker Hub...'
                sh 'docker push dedisalam/frontend-web:latest'
            }
        }
        
        stage('Deploy Web Container') {
            steps {
                echo 'Deploying updated web service via fullstack-infrastructure...'
                build job: 'fullstack-infrastructure', parameters: [string(name: 'SERVICES', value: 'web')], wait: true
            }
        }
    }
    
    post {
        always {
            echo 'Frontend-web pipeline finished.'
        }
        success {
            echo 'Frontend-web pipeline succeeded!'
        }
        failure {
            echo 'Frontend-web pipeline failed. Please check the logs.'
        }
    }
}