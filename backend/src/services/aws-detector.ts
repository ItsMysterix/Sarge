import * as fs from 'fs'
import * as path from 'path'
import logger from '../lib/logger'

const detectorLogger = logger.child({ module: 'aws-detector' })

export interface AWSService {
  type: 'S3' | 'Lambda' | 'DynamoDB' | 'SQS' | 'SNS' | 'EventBridge' | 'CloudWatch' | 'IAM' | 'API Gateway' | 'EC2' | 'RDS' | 'ElastiCache'
  name: string
  config: Record<string, any>
  detectedFrom: string[] // file paths where this was detected
}

export interface AWSDetectionResult {
  services: AWSService[]
  hasAWSConfig: boolean
  hasCloudFormation: boolean
  hasTerraform: boolean
  hasCDK: boolean
  packageManagers: string[]
  awsSDKVersion?: string
}

export class AWSDetector {
  private repoPath: string

  constructor(repoPath: string) {
    this.repoPath = repoPath
  }

  async detect(): Promise<AWSDetectionResult> {
    const result: AWSDetectionResult = {
      services: [],
      hasAWSConfig: false,
      hasCloudFormation: false,
      hasTerraform: false,
      hasCDK: false,
      packageManagers: [],
      awsSDKVersion: undefined,
    }

    // Detect infrastructure as code
    await this.detectIaC(result)

    // Detect from package.json dependencies
    await this.detectFromPackageJson(result)

    // Detect from source code (AWS SDK calls)
    await this.detectFromSourceCode(result)

    // Detect from environment/config files
    await this.detectFromConfigFiles(result)

    return result
  }

  private findFiles(dir: string, pattern: RegExp, maxDepth: number = 5): string[] {
    const results: string[] = []

    const walk = (currentPath: string, depth: number) => {
      if (depth > maxDepth) return

      try {
        const entries = fs.readdirSync(currentPath, { withFileTypes: true })

        for (const entry of entries) {
          const fullPath = path.join(currentPath, entry.name)
          const relativePath = path.relative(this.repoPath, fullPath)

          // Skip common directories
          if (entry.isDirectory()) {
            if (entry.name === 'node_modules' || entry.name === '.git' ||
              entry.name === 'dist' || entry.name === 'build' ||
              entry.name === '.next') {
              continue
            }
            walk(fullPath, depth + 1)
          } else if (entry.isFile() && pattern.test(entry.name)) {
            results.push(relativePath)
          }
        }
      } catch (err) {
        // Skip directories we can't read
      }
    }

    walk(dir, 0)
    return results
  }

  private async detectIaC(result: AWSDetectionResult): Promise<void> {
    // CloudFormation
    const cfTemplates = this.findFiles(
      this.repoPath,
      /(template|stack|cloudformation).*\.(json|yaml|yml)$/i
    )

    if (cfTemplates.length > 0) {
      result.hasCloudFormation = true
      await this.parseCloudFormation(cfTemplates, result)
    }

    // Terraform
    const tfFiles = this.findFiles(this.repoPath, /\.tf$/)

    if (tfFiles.length > 0) {
      result.hasTerraform = true
      await this.parseTerraform(tfFiles, result)
    }

    // AWS CDK
    const cdkFiles = this.findFiles(this.repoPath, /cdk\.(json|ts|js)$/)
    if (cdkFiles.length > 0) {
      result.hasCDK = true
    }
  }

  private async detectFromPackageJson(result: AWSDetectionResult): Promise<void> {
    const packageJsonPath = path.join(this.repoPath, 'package.json')
    if (!fs.existsSync(packageJsonPath)) return

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      }

      // Detect AWS SDK
      if (allDeps['aws-sdk']) {
        result.awsSDKVersion = allDeps['aws-sdk']
      } else if (allDeps['@aws-sdk/client-s3']) {
        result.awsSDKVersion = 'v3'
      }

      // Detect specific AWS services from dependencies
      const awsPackages = Object.keys(allDeps)
        .map(p => (typeof p === 'string' ? p : String(p ?? '')))
        .filter(pkg => pkg && pkg.startsWith('@aws-sdk/'))

      for (const pkg of awsPackages) {
        if (pkg.includes('s3')) {
          this.addService(result, 'S3', 'detected-bucket', {}, ['package.json'])
        }
        if (pkg.includes('lambda')) {
          this.addService(result, 'Lambda', 'detected-function', {}, ['package.json'])
        }
        if (pkg.includes('dynamodb')) {
          this.addService(result, 'DynamoDB', 'detected-table', {}, ['package.json'])
        }
        if (pkg.includes('sqs')) {
          this.addService(result, 'SQS', 'detected-queue', {}, ['package.json'])
        }
        if (pkg.includes('sns')) {
          this.addService(result, 'SNS', 'detected-topic', {}, ['package.json'])
        }
        if (pkg.includes('eventbridge')) {
          this.addService(result, 'EventBridge', 'detected-bus', {}, ['package.json'])
        }
      }

      result.packageManagers.push('npm')
    } catch (err) {
      detectorLogger.error({ msg: 'Failed to parse package.json', err })
    }
  }

  private async detectFromSourceCode(result: AWSDetectionResult): Promise<void> {
    const codeFiles = this.findFiles(this.repoPath, /\.(js|ts|jsx|tsx|py|go)$/)

    for (const file of codeFiles.slice(0, 100)) { // Limit to first 100 files for performance
      const fullPath = path.join(this.repoPath, file)
      try {
        const content = fs.readFileSync(fullPath, 'utf-8')

        // S3
        if (content.match(/new\s+S3(?:Client)?\s*\(|@aws-sdk\/client-s3|boto3\.client\(['"]s3['"]\)|s3\.Bucket/)) {
          const bucketMatches = content.match(/Bucket(?:Name)?['"]?\s*[:=]\s*['"]([^'"]+)['"]/g)
          if (bucketMatches) {
            bucketMatches.forEach(match => {
              const bucketName = match.match(/['"]([^'"]+)['"]/)?.[1]
              if (bucketName) {
                this.addService(result, 'S3', bucketName, {}, [file])
              }
            })
          } else {
            this.addService(result, 'S3', 'detected-bucket', {}, [file])
          }
        }

        // Lambda
        if (content.match(/new\s+Lambda(?:Client)?\s*\(|@aws-sdk\/client-lambda|boto3\.client\(['"]lambda['"]\)|lambda\.Function/)) {
          const funcMatches = content.match(/FunctionName['"]?\s*[:=]\s*['"]([^'"]+)['"]/g)
          if (funcMatches) {
            funcMatches.forEach(match => {
              const funcName = match.match(/['"]([^'"]+)['"]/)?.[1]
              if (funcName) {
                this.addService(result, 'Lambda', funcName, {}, [file])
              }
            })
          } else {
            this.addService(result, 'Lambda', 'detected-function', {}, [file])
          }
        }

        // DynamoDB
        if (content.match(/new\s+DynamoDB(?:Client)?\s*\(|@aws-sdk\/client-dynamodb|boto3\.(?:client|resource)\(['"]dynamodb['"]\)/)) {
          const tableMatches = content.match(/TableName['"]?\s*[:=]\s*['"]([^'"]+)['"]/g)
          if (tableMatches) {
            tableMatches.forEach(match => {
              const tableName = match.match(/['"]([^'"]+)['"]/)?.[1]
              if (tableName) {
                this.addService(result, 'DynamoDB', tableName, {}, [file])
              }
            })
          } else {
            this.addService(result, 'DynamoDB', 'detected-table', {}, [file])
          }
        }

        // SQS
        if (content.match(/new\s+SQS(?:Client)?\s*\(|@aws-sdk\/client-sqs|boto3\.client\(['"]sqs['"]\)/)) {
          const queueMatches = content.match(/QueueName['"]?\s*[:=]\s*['"]([^'"]+)['"]/g)
          if (queueMatches) {
            queueMatches.forEach(match => {
              const queueName = match.match(/['"]([^'"]+)['"]/)?.[1]
              if (queueName) {
                this.addService(result, 'SQS', queueName, {}, [file])
              }
            })
          } else {
            this.addService(result, 'SQS', 'detected-queue', {}, [file])
          }
        }

        // SNS
        if (content.match(/new\s+SNS(?:Client)?\s*\(|@aws-sdk\/client-sns|boto3\.client\(['"]sns['"]\)/)) {
          this.addService(result, 'SNS', 'detected-topic', {}, [file])
        }

        // EventBridge
        if (content.match(/new\s+EventBridge(?:Client)?\s*\(|@aws-sdk\/client-eventbridge/)) {
          this.addService(result, 'EventBridge', 'detected-bus', {}, [file])
        }
      } catch (err) {
        // Skip files that can't be read
        continue
      }
    }
  }

  private async detectFromConfigFiles(result: AWSDetectionResult): Promise<void> {
    // Check for AWS config file
    const awsConfigPath = path.join(this.repoPath, '.aws', 'config')
    if (fs.existsSync(awsConfigPath)) {
      result.hasAWSConfig = true
    }

    // Check for serverless.yml
    const serverlessPath = path.join(this.repoPath, 'serverless.yml')
    if (fs.existsSync(serverlessPath)) {
      try {
        let content = fs.readFileSync(serverlessPath, 'utf-8')
        if (typeof content !== 'string') content = String(content ?? '')
        // Parse serverless config for services
        if (content.includes('s3')) this.addService(result, 'S3', 'serverless-bucket', {}, ['serverless.yml'])
        if (content.includes('lambda') || content.includes('functions:')) this.addService(result, 'Lambda', 'serverless-function', {}, ['serverless.yml'])
        if (content.includes('dynamodb')) this.addService(result, 'DynamoDB', 'serverless-table', {}, ['serverless.yml'])
        if (content.includes('sqs')) this.addService(result, 'SQS', 'serverless-queue', {}, ['serverless.yml'])
        if (content.includes('sns')) this.addService(result, 'SNS', 'serverless-topic', {}, ['serverless.yml'])
      } catch (err) {
        detectorLogger.error({ msg: 'Failed to parse serverless.yml', err })
      }
    }

    // Check for sam template
    const samPath = path.join(this.repoPath, 'template.yaml')
    if (fs.existsSync(samPath)) {
      try {
        let content = fs.readFileSync(samPath, 'utf-8')
        if (typeof content !== 'string') content = String(content ?? '')
        if (content.includes('AWS::S3::')) this.addService(result, 'S3', 'sam-bucket', {}, ['template.yaml'])
        if (content.includes('AWS::Lambda::')) this.addService(result, 'Lambda', 'sam-function', {}, ['template.yaml'])
        if (content.includes('AWS::DynamoDB::')) this.addService(result, 'DynamoDB', 'sam-table', {}, ['template.yaml'])
      } catch (err) {
        detectorLogger.error({ msg: 'Failed to parse template.yaml', err })
      }
    }
  }

  private async parseCloudFormation(files: string[], result: AWSDetectionResult): Promise<void> {
    for (const file of files.slice(0, 10)) { // Limit parsing
      const fullPath = path.join(this.repoPath, file)
      try {
        let content = fs.readFileSync(fullPath, 'utf-8')
        if (typeof content !== 'string') content = String(content ?? '')
        const template = file.endsWith('.json') ? JSON.parse(content) : this.parseYaml(content)

        if (template.Resources) {
          for (const [resourceName, resource] of Object.entries(template.Resources as Record<string, any>)) {
            const type = resource.Type
            if (type === 'AWS::S3::Bucket') {
              this.addService(result, 'S3', resourceName, resource.Properties || {}, [file])
            } else if (type === 'AWS::Lambda::Function') {
              this.addService(result, 'Lambda', resourceName, resource.Properties || {}, [file])
            } else if (type === 'AWS::DynamoDB::Table') {
              this.addService(result, 'DynamoDB', resourceName, resource.Properties || {}, [file])
            } else if (type === 'AWS::SQS::Queue') {
              this.addService(result, 'SQS', resourceName, resource.Properties || {}, [file])
            } else if (type === 'AWS::SNS::Topic') {
              this.addService(result, 'SNS', resourceName, resource.Properties || {}, [file])
            } else if (type === 'AWS::Events::EventBus') {
              this.addService(result, 'EventBridge', resourceName, resource.Properties || {}, [file])
            }
          }
        }
      } catch (err) {
        detectorLogger.error({ file, err }, `Failed to parse ${file}`)
      }
    }
  }

  private async parseTerraform(files: string[], result: AWSDetectionResult): Promise<void> {
    for (const file of files.slice(0, 10)) {
      const fullPath = path.join(this.repoPath, file)
      try {
        const content = fs.readFileSync(fullPath, 'utf-8')

        // Basic Terraform parsing (HCL)
        if (content.includes('resource "aws_s3_bucket"')) {
          const matches = content.matchAll(/resource\s+"aws_s3_bucket"\s+"([^"]+)"/g)
          for (const match of matches) {
            this.addService(result, 'S3', match[1], {}, [file])
          }
        }

        if (content.includes('resource "aws_lambda_function"')) {
          const matches = content.matchAll(/resource\s+"aws_lambda_function"\s+"([^"]+)"/g)
          for (const match of matches) {
            this.addService(result, 'Lambda', match[1], {}, [file])
          }
        }

        if (content.includes('resource "aws_dynamodb_table"')) {
          const matches = content.matchAll(/resource\s+"aws_dynamodb_table"\s+"([^"]+)"/g)
          for (const match of matches) {
            this.addService(result, 'DynamoDB', match[1], {}, [file])
          }
        }

        if (content.includes('resource "aws_sqs_queue"')) {
          const matches = content.matchAll(/resource\s+"aws_sqs_queue"\s+"([^"]+)"/g)
          for (const match of matches) {
            this.addService(result, 'SQS', match[1], {}, [file])
          }
        }

        if (content.includes('resource "aws_sns_topic"')) {
          const matches = content.matchAll(/resource\s+"aws_sns_topic"\s+"([^"]+)"/g)
          for (const match of matches) {
            this.addService(result, 'SNS', match[1], {}, [file])
          }
        }
      } catch (err) {
        detectorLogger.error({ file, err }, `Failed to parse ${file}`)
      }
    }
  }

  private parseYaml(content: string): any {
    // Very basic YAML parsing - in production use a proper YAML library
    try {
      // For now, just check for basic patterns
      return { Resources: {} }
    } catch (err) {
      return {}
    }
  }

  private addService(
    result: AWSDetectionResult,
    type: AWSService['type'],
    name: string,
    config: Record<string, any>,
    files: string[]
  ): void {
    const existing = result.services.find(s => s.type === type && s.name === name)
    if (existing) {
      existing.detectedFrom.push(...files)
      existing.detectedFrom = [...new Set(existing.detectedFrom)] // Deduplicate
    } else {
      result.services.push({
        type,
        name,
        config,
        detectedFrom: files,
      })
    }
  }
}
