pipeline {
    agent any

    environment {
        DEVINSPECT_API_URL = credentials('DEVINSPECT_API_URL')
        DEVINSPECT_API_KEY = credentials('DEVINSPECT_API_KEY')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('DevInspectAI Code Review') {
            steps {
                script {
                    def files = sh(
                        script: "git diff --name-only HEAD~1 HEAD -- '*.js' '*.ts' '*.py' | head -5",
                        returnStdout: true
                    ).trim().split('\n')

                    files.each { file ->
                        if (file && fileExists(file)) {
                            echo "Reviewing: ${file}"
                            def code = readFile(file).take(50000)
                            def payload = groovy.json.JsonOutput.toJson([
                                code    : code,
                                language: 'javascript',
                                mode    : 'developer'
                            ])
                            def response = sh(
                                script: """
                                    curl -s -X POST "${DEVINSPECT_API_URL}/api/ci/review" \\
                                        -H "X-API-Key: ${DEVINSPECT_API_KEY}" \\
                                        -H "Content-Type: application/json" \\
                                        -d '${payload}'
                                """,
                                returnStdout: true
                            ).trim()
                            echo "DevInspectAI result for ${file}: ${response}"
                        }
                    }
                }
            }
        }

        stage('Build') {
            steps {
                echo 'Add your build steps here'
            }
        }
    }

    post {
        always {
            echo 'DevInspectAI review complete'
        }
    }
}
