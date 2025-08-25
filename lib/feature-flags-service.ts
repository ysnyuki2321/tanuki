import { getSupabaseAdmin } from './supabase-client'
import type { 
  FeatureFlagContext, 
  FeatureFlagEvaluation, 
  DbFeatureFlag,
  DbFeatureFlagValue,
  DbFeatureFlagDependency 
} from './feature-flags-schema'

export class FeatureFlagsService {
  private supabase = getSupabaseAdmin()
  private cache = new Map<string, { value: any; timestamp: number }>()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  /**
   * Evaluate a feature flag for a given context
   */
  async evaluateFlag(
    flagKey: string, 
    context: FeatureFlagContext
  ): Promise<FeatureFlagEvaluation> {
    try {
      // Get flag configuration
      const flag = await this.getFlag(flagKey, context.tenantId)
      if (!flag) {
        return {
          value: false,
          enabled: false,
          reason: 'FLAG_NOT_FOUND',
          flagKey
        }
      }

      // Check if flag is active
      if (flag.status !== 'active') {
        return {
          value: flag.default_value,
          enabled: false,
          reason: 'FLAG_INACTIVE',
          flagKey
        }
      }

      // Check dependencies
      const dependencyResult = await this.checkDependencies(flag.id, context)
      if (!dependencyResult.satisfied) {
        return {
          value: flag.default_value,
          enabled: false,
          reason: `DEPENDENCY_NOT_MET: ${dependencyResult.reason}`,
          flagKey
        }
      }

      // Get environment-specific value
      const flagValue = await this.getFlagValue(flag.id, context)
      if (!flagValue) {
        return {
          value: flag.default_value,
          enabled: true,
          reason: 'DEFAULT_VALUE',
          flagKey
        }
      }

      // Check if flag is enabled for this environment
      if (!flagValue.enabled) {
        return {
          value: flag.default_value,
          enabled: false,
          reason: 'DISABLED_FOR_ENVIRONMENT',
          flagKey
        }
      }

      // Check rollout percentage
      if (!this.isInRollout(context.userId || '', flagValue.rollout_percentage)) {
        return {
          value: flag.default_value,
          enabled: false,
          reason: 'NOT_IN_ROLLOUT',
          flagKey
        }
      }

      // Check user targeting
      if (flag.target_users && flag.target_users.length > 0) {
        if (!context.userId || !flag.target_users.includes(context.userId)) {
          return {
            value: flag.default_value,
            enabled: false,
            reason: 'NOT_TARGETED_USER',
            flagKey
          }
        }
      }

      // Check segment targeting
      if (flag.target_segments && flag.target_segments.length > 0) {
        const inSegment = await this.isUserInSegments(
          context.userId || '', 
          flag.target_segments, 
          context
        )
        if (!inSegment) {
          return {
            value: flag.default_value,
            enabled: false,
            reason: 'NOT_IN_TARGET_SEGMENT',
            flagKey
          }
        }
      }

      // Evaluate conditions
      if (flagValue.conditions) {
        const conditionResult = this.evaluateConditions(flagValue.conditions, context)
        if (!conditionResult) {
          return {
            value: flag.default_value,
            enabled: false,
            reason: 'CONDITIONS_NOT_MET',
            flagKey
          }
        }
      }

      // Log evaluation for analytics
      await this.logEvaluation(flag.id, context, flagValue.value, 'EVALUATED')

      return {
        value: flagValue.value,
        enabled: true,
        reason: 'EVALUATED',
        flagKey
      }

    } catch (error) {
      console.error('Feature flag evaluation error:', error)
      return {
        value: false,
        enabled: false,
        reason: 'EVALUATION_ERROR',
        flagKey
      }
    }
  }

  /**
   * Batch evaluate multiple flags
   */
  async evaluateFlags(
    flagKeys: string[], 
    context: FeatureFlagContext
  ): Promise<Record<string, FeatureFlagEvaluation>> {
    const results: Record<string, FeatureFlagEvaluation> = {}
    
    await Promise.all(
      flagKeys.map(async (flagKey) => {
        results[flagKey] = await this.evaluateFlag(flagKey, context)
      })
    )

    return results
  }

  /**
   * Get all active flags for a tenant
   */
  async getTenantFlags(tenantId?: string): Promise<DbFeatureFlag[]> {
    if (!this.supabase) return []
    const { data, error } = await this.supabase!
      .from('feature_flags')
      .select('*')
      .or(`tenant_id.eq.${tenantId},is_global.eq.true`)
      .eq('status', 'active')
      .order('name')

    if (error) throw error
    return data || []
  }

  /**
   * Create a new feature flag
   */
  async createFlag(flag: {
    key: string
    name: string
    description?: string
    flagType: 'boolean' | 'string' | 'number' | 'json'
    defaultValue: any
    tenantId?: string
    isGlobal?: boolean
    environments?: string[]
  }, createdBy: string): Promise<DbFeatureFlag> {
    if (!this.supabase) throw new Error('Supabase client not initialized')
    const { data, error } = await this.supabase!
      .from('feature_flags')
      .insert({
        key: flag.key,
        name: flag.name,
        description: flag.description,
        flag_type: flag.flagType,
        default_value: flag.defaultValue,
        tenant_id: flag.tenantId,
        is_global: flag.isGlobal || false,
        environments: flag.environments || ['development', 'staging', 'production'],
        created_by: createdBy
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Update flag value for specific environment
   */
  async updateFlagValue(
    flagId: string,
    environment: string,
    value: any,
    options: {
      enabled?: boolean
      rolloutPercentage?: number
      conditions?: any
      tenantId?: string
    },
    updatedBy: string
  ): Promise<DbFeatureFlagValue> {
    if (!this.supabase) throw new Error('Supabase client not initialized')
    const { data, error } = await (this.supabase as any)
      .from('feature_flag_values')
      .upsert({
        flag_id: flagId,
        environment,
        value,
        enabled: options.enabled ?? true,
        rollout_percentage: options.rolloutPercentage ?? 100,
        conditions: options.conditions,
        tenant_id: options.tenantId,
        created_by: updatedBy,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    this.clearCache(flagId)
    return data
  }

  /**
   * Add dependency between flags
   */
  async addDependency(
    flagId: string,
    dependsOnFlagId: string,
    dependencyType: 'requires' | 'conflicts' | 'implies',
    conditionValue?: any,
    createdBy?: string
  ): Promise<DbFeatureFlagDependency> {
    if (!this.supabase) throw new Error('Supabase client not initialized')
    const { data, error } = await (this.supabase as any)
      .from('feature_flag_dependencies')
      .insert({
        flag_id: flagId,
        depends_on_flag_id: dependsOnFlagId,
        dependency_type: dependencyType,
        condition_value: conditionValue,
        created_by: createdBy
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Private methods
   */
  private async getFlag(flagKey: string, tenantId?: string): Promise<DbFeatureFlag | null> {
    const cacheKey = `flag:${flagKey}:${tenantId || 'global'}`
    
    // Check cache
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.value
    }

    const { data, error } = await this.supabase!
      .from('feature_flags')
      .select('*')
      .eq('key', flagKey)
      .or(`tenant_id.eq.${tenantId},is_global.eq.true`)
      .eq('status', 'active')
      .order('is_global', { ascending: true }) // Prefer tenant-specific over global
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    
    // Cache result
    this.cache.set(cacheKey, { value: data, timestamp: Date.now() })
    return data
  }

  private async getFlagValue(
    flagId: string, 
    context: FeatureFlagContext
  ): Promise<DbFeatureFlagValue | null> {
    if (!this.supabase) return null
    const { data, error } = await (this.supabase as any)
      .from('feature_flag_values')
      .select('*')
      .eq('flag_id', flagId)
      .eq('environment', context.environment)
      .or(`tenant_id.eq.${context.tenantId},tenant_id.is.null`)
      .order('tenant_id', { ascending: false, nullsLast: true }) // Prefer tenant-specific
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  private async checkDependencies(
    flagId: string, 
    context: FeatureFlagContext
  ): Promise<{ satisfied: boolean; reason?: string }> {
    if (!this.supabase) return { satisfied: true }
    const { data: dependencies, error } = await (this.supabase as any)
      .from('feature_flag_dependencies')
      .select(`
        *,
        depends_on_flag:feature_flags!feature_flag_dependencies_depends_on_flag_id_fkey(*)
      `)
      .eq('flag_id', flagId)

    if (error) throw error
    if (!dependencies || dependencies.length === 0) {
      return { satisfied: true }
    }

    for (const dep of dependencies) {
      const dependentFlag = dep.depends_on_flag as any
      const dependentEvaluation = await this.evaluateFlag(dependentFlag.key, context)

      switch (dep.dependency_type) {
        case 'requires':
          if (!dependentEvaluation.enabled || 
              (dep.condition_value && dependentEvaluation.value !== dep.condition_value)) {
            return { 
              satisfied: false, 
              reason: `requires ${dependentFlag.key} to be enabled` 
            }
          }
          break

        case 'conflicts':
          if (dependentEvaluation.enabled && 
              (!dep.condition_value || dependentEvaluation.value === dep.condition_value)) {
            return { 
              satisfied: false, 
              reason: `conflicts with ${dependentFlag.key}` 
            }
          }
          break

        case 'implies':
          // If this flag is enabled, the dependent flag must also be enabled
          // This is checked when enabling the flag, not during evaluation
          break
      }
    }

    return { satisfied: true }
  }

  private isInRollout(userId: string, percentage: number): boolean {
    if (percentage >= 100) return true
    if (percentage <= 0) return false
    
    // Use consistent hash of userId to determine rollout
    const hash = this.hashString(userId)
    return (hash % 100) < percentage
  }

  private async isUserInSegments(
    userId: string, 
    segmentNames: string[], 
    context: FeatureFlagContext
  ): Promise<boolean> {
    if (!this.supabase) return false
    const { data: segments, error } = await (this.supabase as any)
      .from('feature_flag_segments')
      .select('*')
      .in('name', segmentNames)
      .eq('is_active', true)
      .or(`tenant_id.eq.${context.tenantId},tenant_id.is.null`)

    if (error) throw error
    if (!segments || segments.length === 0) return false

    // Evaluate user against each segment
    for (const segment of segments) {
      if (this.evaluateConditions(segment.conditions, context)) {
        return true
      }
    }

    return false
  }

  private evaluateConditions(conditions: any, context: FeatureFlagContext): boolean {
    if (!conditions) return true

    // Simple condition evaluation - can be extended for complex logic
    try {
      // Example condition format:
      // { "user.email": { "endsWith": "@company.com" } }
      // { "user.plan": { "in": ["premium", "enterprise"] } }
      
      const userProperties = context.userProperties || {}
      
      for (const [key, condition] of Object.entries(conditions)) {
        const value = this.getNestedValue(userProperties, key)
        
        if (!this.evaluateCondition(value, condition)) {
          return false
        }
      }

      return true
    } catch (error) {
      console.error('Condition evaluation error:', error)
      return false
    }
  }

  private evaluateCondition(value: any, condition: any): boolean {
    if (typeof condition !== 'object') {
      return value === condition
    }

    for (const [operator, operand] of Object.entries(condition)) {
      switch (operator) {
        case 'eq':
          return value === operand
        case 'ne':
          return value !== operand
        case 'in':
          return Array.isArray(operand) && operand.includes(value)
        case 'contains':
          return typeof value === 'string' && value.includes(operand as string)
        case 'startsWith':
          return typeof value === 'string' && value.startsWith(operand as string)
        case 'endsWith':
          return typeof value === 'string' && value.endsWith(operand as string)
        case 'gt':
          return Number(value) > Number(operand)
        case 'gte':
          return Number(value) >= Number(operand)
        case 'lt':
          return Number(value) < Number(operand)
        case 'lte':
          return Number(value) <= Number(operand)
        default:
          return false
      }
    }

    return false
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  private async logEvaluation(
    flagId: string,
    context: FeatureFlagContext,
    evaluatedValue: any,
    reason: string
  ): Promise<void> {
    if (!this.supabase) return
    try {
      await (this.supabase as any)
        .from('feature_flag_evaluations')
        .insert({
          flag_id: flagId,
          user_id: context.userId,
          tenant_id: context.tenantId,
          environment: context.environment,
          evaluated_value: evaluatedValue,
          evaluation_reason: reason
        })
    } catch (error) {
      // Don't throw - logging failures shouldn't break flag evaluation
      console.error('Failed to log feature flag evaluation:', error)
    }
  }

  private clearCache(flagId?: string): void {
    if (flagId) {
      // Clear specific flag cache entries
      for (const key of this.cache.keys()) {
        if (key.includes(flagId)) {
          this.cache.delete(key)
        }
      }
    } else {
      // Clear all cache
      this.cache.clear()
    }
  }
}

// Singleton instance
export const featureFlagsService = new FeatureFlagsService()
