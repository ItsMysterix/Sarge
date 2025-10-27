import { describe, it, expect } from 'vitest'
import { evaluate, Statement } from './index'

describe('IAM evaluate', () => {
  it('allows matching allow and denies explicit deny', () => {
    const statements: Statement[] = [
      { Effect: 'Allow', Action: ['s3:*'], Resource: ['*'] },
      { Effect: 'Deny', Action: ['s3:DeleteObject'], Resource: ['arn:aws:s3:::b1/*'] },
    ]
    const ok = evaluate({ principal: 'p', action: 's3:PutObject', resource: 'arn:aws:s3:::b1/foo', statements })
    expect(ok.allowed).toBe(true)
    const no = evaluate({ principal: 'p', action: 's3:DeleteObject', resource: 'arn:aws:s3:::b1/foo', statements })
    expect(no.allowed).toBe(false)
  })

  it('evaluates StringEquals condition against context', () => {
    const statements: Statement[] = [
      { Effect: 'Allow', Action: ['s3:GetObject'], Resource: ['arn:aws:s3:::b1/*'], Condition: { StringEquals: { 'aws:username': 'alice' } } },
    ]
    const ok = evaluate({ principal: 'p', action: 's3:GetObject', resource: 'arn:aws:s3:::b1/foo', statements, context: { 'aws:username': 'alice' } })
    expect(ok.allowed).toBe(true)
    const no = evaluate({ principal: 'p', action: 's3:GetObject', resource: 'arn:aws:s3:::b1/foo', statements, context: { 'aws:username': 'bob' } })
    expect(no.allowed).toBe(false)
  })

  it('evaluates ArnLike condition', () => {
    const statements: Statement[] = [
      { Effect: 'Allow', Action: ['lambda:InvokeFunction'], Resource: ['*'], Condition: { ArnLike: { 'aws:SourceArn': 'arn:aws:events:*:rule/*' } } },
    ]
    const ok = evaluate({ principal: 'p', action: 'lambda:InvokeFunction', resource: 'arn:aws:lambda:::fn', statements, context: { 'aws:SourceArn': 'arn:aws:events:us-east-1:rule/my' } })
    expect(ok.allowed).toBe(true)
    const no = evaluate({ principal: 'p', action: 'lambda:InvokeFunction', resource: 'arn:aws:lambda:::fn', statements, context: { 'aws:SourceArn': 'arn:aws:s3:::b1' } })
    expect(no.allowed).toBe(false)
  })

  it('evaluates IpAddress condition', () => {
    const statements: Statement[] = [
      { Effect: 'Allow', Action: ['s3:*'], Resource: ['*'], Condition: { IpAddress: { 'aws:SourceIp': '10.0.0.0/8' } } },
    ]
    const ok = evaluate({ principal: 'p', action: 's3:ListBucket', resource: 'arn:aws:s3:::b1', statements, context: { 'aws:SourceIp': '10.1.2.3' } })
    expect(ok.allowed).toBe(true)
    const no = evaluate({ principal: 'p', action: 's3:ListBucket', resource: 'arn:aws:s3:::b1', statements, context: { 'aws:SourceIp': '192.168.1.1' } })
    expect(no.allowed).toBe(false)
  })
})
