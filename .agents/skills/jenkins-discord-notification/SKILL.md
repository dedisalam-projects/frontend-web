---
name: jenkins-discord-notification
description: "Use when integrating Discord webhook notifications into Jenkins Declarative Pipelines, or when configuring zero-plugin build alerts with rich embeds and error resilience"
tier: local
target-stacks: ["jenkins", "groovy", "bash", "discord-webhook"]
metadata:
  origin: auto-extracted
---

# Jenkins Discord Webhook Notification Pattern

**Extracted:** 2026-09-14  
**Context:** Use when sending real-time build and deployment notifications to Discord channels from Jenkins Declarative Pipelines without installing third-party Jenkins plugins.

> [!CAUTION]
> **Safety Guardrail**: Webhook notifications must guard secret credentials. Always request confirmation before modifying CI/CD pipeline triggers or rotating webhook secrets.

## Problem
- Third-party Jenkins Discord plugins often introduce plugin dependency conflicts, require Jenkins service restarts, and offer limited control over custom embed layouts.
- Naive webhook calls fail if commit messages contain special characters or quotes, or cause pipeline crashes if Discord's API rate-limits or returns non-200 responses.

## Solution

Implement a zero-plugin Groovy helper method using Jenkins native `withCredentials`, `curl`, JSON-safe string escaping, and non-blocking `try/catch` execution.

### 1. Prerequisites & Secret Setup
1. **Discord Channel**: Go to Channel Settings -> **Integrations** -> **Webhooks** -> Create Webhook -> Copy Webhook URL.
2. **Jenkins Credentials**: Go to Jenkins -> **Manage Jenkins** -> **Credentials** -> **System** -> **Global credentials** -> **Add Credentials**:
   - Kind: `Secret text`
   - Secret: `<DISCORD_WEBHOOK_URL>`
   - ID: `discord-webhook-url`

### 2. Pipeline Integration (`Jenkinsfile`)

Add the `sendDiscordNotification` method outside or within the pipeline script, and call it inside the `post` block:

```groovy
pipeline {
    agent any

    // ... stages ...

    post {
        success {
            sendDiscordNotification('SUCCESS')
        }
        failure {
            sendDiscordNotification('FAILURE')
        }
        unstable {
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

            // Status colors and emojis
            def colorCode = 3066993 // Green (Success: #2ECC71)
            def statusEmoji = '✅'
            if (buildStatus == 'FAILURE') {
                colorCode = 15158332 // Red (Failure: #E74C3C)
                statusEmoji = '❌'
            } else if (buildStatus == 'UNSTABLE') {
                colorCode = 15105570 // Orange (Unstable: #E67E22)
                statusEmoji = '⚠️'
            }

            // Git metadata extraction with safe fallback
            def commitHash = sh(script: 'git rev-parse --short HEAD 2>/dev/null || echo "unknown"', returnStdout: true).trim()
            def commitMsg = sh(script: 'git log -1 --pretty=%B 2>/dev/null || echo "No commit message"', returnStdout: true).trim()
            def author = sh(script: 'git log -1 --pretty=%an 2>/dev/null || echo "Jenkins"', returnStdout: true).trim()
            def branch = env.BRANCH_NAME ?: env.GIT_BRANCH ?: 'main'
            def duration = currentBuild.durationString.replace(' and counting', '')

            // Sanitize commit message for JSON payload
            def cleanMsg = commitMsg.replace('\\', '\\\\')
                                    .replace('"', '\\"')
                                    .replace('\n', ' ')
                                    .take(150)

            def payload = """{
                "username": "Jenkins CI/CD",
                "avatar_url": "https://www.jenkins.io/images/logos/jenkins/jenkins.png",
                "embeds": [
                    {
                        "title": "${statusEmoji} Build #${BUILD_NUMBER} - ${buildStatus}",
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
                            "text": "Jenkins Pipeline Notification"
                        },
                        "timestamp": "${new Date().format("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", TimeZone.getTimeZone('UTC'))}"
                    }
                ]
            }"""

            // Write temporary payload to prevent argument list limits and shell escaping issues
            writeFile file: 'discord_payload.json', text: payload
            sh(script: 'curl -s -f -X POST -H "Content-Type: application/json" -d @discord_payload.json "$DISCORD_WEBHOOK" >/dev/null || true', returnStatus: true)
            sh(script: 'rm -f discord_payload.json || true', returnStatus: true)
        }
    } catch (Exception e) {
        echo "Failed to send Discord notification (non-fatal): ${e.message}"
    }
}
```

## When to Use
- When configuring build status alerts to a team Discord server.
- When you need zero-dependency, lightweight webhook notifications without installing or upgrading Jenkins plugins.
- When pipelines run on locked-down Jenkins masters where admin rights for plugin installations are restricted.


> [!IMPORTANT]
> **Rule Adherence**: Always strictly follow the `jenkins-discord-notification` conventions outlined above to ensure workspace consistency and prevent regressions.
