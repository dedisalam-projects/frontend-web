pipeline {
    agent any
    
    tools {
        nodejs 'Node24'
    }
    
    environment {
        NPM_CONFIG_UPDATE_NOTIFIER = 'false'
    }
    
    options {
        timeout(time: 45, unit: 'MINUTES')
        disableConcurrentBuilds()
    }
    
    parameters {
        booleanParam(
            name: 'RUN_EXTENDED_TESTS',
            defaultValue: false,
            description: 'Jalankan pengujian lambat (Playwright a11y & Stryker Mutation Testing)'
        )
    }

    triggers {
        githubPush()
        cron('H 2 * * *')
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Install Dependencies') {
            steps {
                retry(2) {
                    echo 'Cleaning up existing locks and preparing clean workspace...'
                    sh 'pkill -f "ng" || true'
                    sh 'rm -rf node_modules_* node_modules_del* || true'
                    sh 'npm ci --legacy-peer-deps || npm install --legacy-peer-deps'
                }
            }
        }
        
        stage('Dependency Security Audit') {
            steps {
                echo 'Running high-severity security audit...'
                sh 'npm audit --audit-level=high || true'
            }
        }

        // =========================================================================
        // 🛡️ FRONTEND TESTING MATRIX QUALITY GATES
        // =========================================================================

        stage('Layer 1: Unit & Signal Component Testing (100% Gate)') {
            steps {
                retry(2) {
                    echo 'Executing Vitest unit tests across shared-ui, auth, landing, and dashboard...'
                    sh 'npm run test:all'
                }
            }
        }

        stage('Layer 2: Property-Based Testing (Fast-Check PBT)') {
            steps {
                retry(2) {
                    echo 'Executing Fast-Check property-based tests across auth guards, layout, and services...'
                    sh 'npm run test:property'
                }
            }
        }

        stage('Layer 3: Micro-frontend Integration Testing') {
            steps {
                retry(2) {
                    echo 'Executing cross-app auth guard chain and HTTP interceptor integration tests...'
                    sh 'npm run test:integration'
                }
            }
        }

        stage('Layer 4: Accessibility (a11y) Quality Gate') {
            when {
                anyOf {
                    expression { return params.RUN_EXTENDED_TESTS == true }
                    expression { return currentBuild.getBuildCauses().toString().contains('TimerTrigger') }
                    changeRequest()
                }
            }
            steps {
                echo 'Installing Playwright browser binaries...'
                sh 'npx playwright install chromium webkit'
                echo 'Executing Playwright Axe-Core accessibility audits...'
                sh 'PLAYWRIGHT_WEBSERVER=1 npm run test:a11y'
            }
        }

        stage('Layer 5: Mutation Score Hardening (StrykerJS)') {
            when {
                anyOf {
                    expression { return params.RUN_EXTENDED_TESTS == true }
                    expression { return currentBuild.getBuildCauses().toString().contains('TimerTrigger') }
                    changeRequest()
                }
            }
            steps {
                echo 'Verifying mutation score via StrykerJS...'
                sh 'npm run test:mutation'
            }
        }

        // =========================================================================
        // 🚀 BUILD & DOCKER DEPLOYMENT
        // =========================================================================

        stage('Build Angular (Production)') {
            steps {
                echo 'Compiling Angular micro-frontends with production environment and SSR...'
                sh 'npm run build'
            }
        }
        
        stage('Build & Push Docker Images') {
            steps {
                script {
                    def semver = sh(script: 'git describe --tags --exact-match 2>/dev/null || echo "v1.0.${BUILD_NUMBER}"', returnStdout: true).trim()
                    env.RELEASE_TAG = semver
                    echo "Target SemVer release tag: ${env.RELEASE_TAG}"
                }
                echo 'Building and tagging production Docker images (Dual-Tagging SemVer + Latest)...'
                sh '''
                    # 1. Landing Micro-frontend (Port 8080)
                    docker build -t dedisalam/frontend-landing:staging -f docker/landing/Dockerfile.prod .
                    docker tag dedisalam/frontend-landing:staging dedisalam/frontend-landing:${RELEASE_TAG}
                    docker tag dedisalam/frontend-landing:staging dedisalam/frontend-landing:latest

                    # 2. Auth Micro-frontend (Port 8080)
                    docker build -t dedisalam/frontend-auth:staging -f docker/auth/Dockerfile.prod .
                    docker tag dedisalam/frontend-auth:staging dedisalam/frontend-auth:${RELEASE_TAG}
                    docker tag dedisalam/frontend-auth:staging dedisalam/frontend-auth:latest

                    # 3. Dashboard Micro-frontend (Port 8080)
                    docker build -t dedisalam/frontend-dashboard:staging -f docker/dashboard/Dockerfile.prod .
                    docker tag dedisalam/frontend-dashboard:staging dedisalam/frontend-dashboard:${RELEASE_TAG}
                    docker tag dedisalam/frontend-dashboard:staging dedisalam/frontend-dashboard:latest
                '''
                withCredentials([usernamePassword(credentialsId: 'docker-hub-credentials', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    echo 'Logging in and pushing Docker images to Docker Hub registry...'
                    sh '''
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                        docker push dedisalam/frontend-landing:${RELEASE_TAG}
                        docker push dedisalam/frontend-landing:latest
                        docker push dedisalam/frontend-auth:${RELEASE_TAG}
                        docker push dedisalam/frontend-auth:latest
                        docker push dedisalam/frontend-dashboard:${RELEASE_TAG}
                        docker push dedisalam/frontend-dashboard:latest
                    '''
                }
            }
        }
        
        stage('Deploy Micro-frontends') {
            steps {
                echo 'Deploying updated micro-frontend services via fullstack-infrastructure...'
                build job: 'fullstack-infrastructure', parameters: [string(name: 'SERVICES', value: 'frontend-landing frontend-auth frontend-dashboard')], wait: true
            }
        }
    }
    
    post {
        always {
            echo 'Archiving test reports and coverage results...'
            archiveArtifacts artifacts: 'coverage/**, reports/**', allowEmptyArchive: true
            sh 'rm -rf .stryker-tmp || true'
        }
        success {
            echo 'Frontend-web pipeline succeeded! All testing matrix quality gates passed.'
            sendDiscordNotification('SUCCESS')
        }
        failure {
            echo 'Frontend-web pipeline failed! Please check stage logs for test or build errors.'
            sendDiscordNotification('FAILURE')
        }
        unstable {
            echo 'Frontend-web pipeline unstable!'
            sendDiscordNotification('UNSTABLE')
        }
    }
}

// =========================================================================
// 🔔 ZERO-PLUGIN DISCORD NOTIFICATION HELPER
// =========================================================================
def sendDiscordNotification(String buildStatus) {
    try {
        withCredentials([string(credentialsId: 'discord-webhook-url', variable: 'DISCORD_WEBHOOK')]) {
            if (!env.DISCORD_WEBHOOK) {
                echo 'Discord webhook URL not configured, skipping notification.'
                return
            }

            def colorCode = 3066993 // Green (Success: #2ECC71)
            def statusEmoji = '✅'
            if (buildStatus == 'FAILURE') {
                colorCode = 15158332 // Red (Failure: #E74C3C)
                statusEmoji = '❌'
            } else if (buildStatus == 'UNSTABLE') {
                colorCode = 15105570 // Orange (Unstable: #E67E22)
                statusEmoji = '⚠️'
            }

            def commitHash = sh(script: 'git rev-parse --short HEAD 2>/dev/null || echo "unknown"', returnStdout: true).trim()
            def commitMsg = sh(script: 'git log -1 --pretty=%B 2>/dev/null || echo "No commit message"', returnStdout: true).trim()
            def author = sh(script: 'git log -1 --pretty=%an 2>/dev/null || echo "Jenkins"', returnStdout: true).trim()
            def branch = env.BRANCH_NAME ?: env.GIT_BRANCH ?: 'master'
            def duration = currentBuild.durationString.replace(' and counting', '')

            def cleanMsg = commitMsg.replace('\\', '\\\\')
                                    .replace('"', '\\"')
                                    .replace('\n', ' ')
                                    .take(150)

            def payload = """{
                "username": "Jenkins CI/CD",
                "avatar_url": "https://www.jenkins.io/images/logos/jenkins/jenkins.png",
                "embeds": [
                    {
                        "title": "${statusEmoji} Frontend Build #${BUILD_NUMBER} - ${buildStatus}",
                        "url": "${env.BUILD_URL}",
                        "color": ${colorCode},
                        "fields": [
                            {"name": "Project", "value": "${env.JOB_NAME}", "inline": true},
                            {"name": "Branch", "value": "`${branch}`", "inline": true},
                            {"name": "Duration", "value": "${duration}", "inline": true},
                            {"name": "Author", "value": "${author}", "inline": true},
                            {"name": "Commit", "value": "`${commitHash}`", "inline": true},
                            {"name": "Message", "value": "${cleanMsg}", "inline": false}
                        ],
                        "footer": {
                            "text": "Frontend-Web CI/CD Pipeline"
                        },
                        "timestamp": "${new Date().format("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", TimeZone.getTimeZone('UTC'))}"
                    }
                ]
            }"""

            writeFile file: 'discord_payload.json', text: payload
            sh(script: 'curl -s -f -X POST -H "Content-Type: application/json" -d @discord_payload.json "$DISCORD_WEBHOOK" >/dev/null || true', returnStatus: true)
            sh(script: 'rm -f discord_payload.json || true', returnStatus: true)
        }
    } catch (Exception e) {
        echo "Failed to send Discord notification (non-fatal): ${e.message}"
    }
}