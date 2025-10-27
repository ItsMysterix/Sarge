declare module 'sarge-iam' {
  export type Effect = 'Allow' | 'Deny'
  export interface Statement {
    Effect: Effect
    Action: string[]
    Resource: string[]
    Condition?: Record<string, unknown>
  }
  export interface EvaluationInput {
    principal: string
    action: string
    resource: string
    context?: Record<string, unknown>
    statements: Statement[]
  }
  export interface EvaluationResult { allowed: boolean; reason?: string }
  export function evaluate(input: EvaluationInput): EvaluationResult
}
