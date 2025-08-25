"use client";

import { createClient } from '@/lib/supabase/client';

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  is_enabled: boolean;
  tenant_id?: string;
  target_percentage: number;
  dependencies?: string[];
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface CreateFeatureFlagRequest {
  key: string;
  name: string;
  description: string;
  is_enabled?: boolean;
  tenant_id?: string;
  target_percentage?: number;
  dependencies?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateFeatureFlagRequest extends Partial<CreateFeatureFlagRequest> {
  id: string;
}

export interface FeatureFlagStats {
  total_flags: number;
  enabled_flags: number;
  disabled_flags: number;
  tenant_specific_flags: number;
  global_flags: number;
}

export class FeatureFlagsService {
  private supabase = createClient();

  async getFeatureFlags(tenantId?: string): Promise<FeatureFlag[]> {
    try {
      let query = this.supabase
        .from('feature_flags')
        .select('*')
        .order('created_at', { ascending: false });

      if (tenantId) {
        query = query.or(`tenant_id.eq.${tenantId},tenant_id.is.null`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching feature flags:', error);
        throw new Error(`Failed to fetch feature flags: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getFeatureFlags:', error);
      throw error;
    }
  }

  async getFeatureFlag(id: string): Promise<FeatureFlag | null> {
    try {
      const { data, error } = await this.supabase
        .from('feature_flags')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching feature flag:', error);
        throw new Error(`Failed to fetch feature flag: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in getFeatureFlag:', error);
      throw error;
    }
  }

  async createFeatureFlag(request: CreateFeatureFlagRequest): Promise<FeatureFlag> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const flagData = {
        key: request.key,
        name: request.name,
        description: request.description,
        is_enabled: request.is_enabled ?? false,
        tenant_id: request.tenant_id || null,
        target_percentage: request.target_percentage ?? 100,
        dependencies: request.dependencies || [],
        metadata: request.metadata || {},
        created_by: user.id,
      };

      const { data, error } = await this.supabase
        .from('feature_flags')
        .insert(flagData)
        .select()
        .single();

      if (error) {
        console.error('Error creating feature flag:', error);
        throw new Error(`Failed to create feature flag: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in createFeatureFlag:', error);
      throw error;
    }
  }

  async updateFeatureFlag(request: UpdateFeatureFlagRequest): Promise<FeatureFlag> {
    try {
      const { id, ...updateData } = request;

      const { data, error } = await this.supabase
        .from('feature_flags')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating feature flag:', error);
        throw new Error(`Failed to update feature flag: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in updateFeatureFlag:', error);
      throw error;
    }
  }

  async deleteFeatureFlag(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('feature_flags')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting feature flag:', error);
        throw new Error(`Failed to delete feature flag: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deleteFeatureFlag:', error);
      throw error;
    }
  }

  async toggleFeatureFlag(id: string, enabled: boolean): Promise<FeatureFlag> {
    try {
      const { data, error } = await this.supabase
        .from('feature_flags')
        .update({ is_enabled: enabled })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error toggling feature flag:', error);
        throw new Error(`Failed to toggle feature flag: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in toggleFeatureFlag:', error);
      throw error;
    }
  }

  async bulkUpdateFeatureFlags(flagIds: string[], updates: Partial<FeatureFlag>): Promise<FeatureFlag[]> {
    try {
      const { data, error } = await this.supabase
        .from('feature_flags')
        .update(updates)
        .in('id', flagIds)
        .select();

      if (error) {
        console.error('Error bulk updating feature flags:', error);
        throw new Error(`Failed to bulk update feature flags: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in bulkUpdateFeatureFlags:', error);
      throw error;
    }
  }

  async bulkToggleFeatureFlags(flagIds: string[], enabled: boolean): Promise<FeatureFlag[]> {
    try {
      return await this.bulkUpdateFeatureFlags(flagIds, { is_enabled: enabled });
    } catch (error) {
      console.error('Error in bulkToggleFeatureFlags:', error);
      throw error;
    }
  }

  async duplicateFeatureFlag(id: string, newKey: string, newName: string): Promise<FeatureFlag> {
    try {
      const original = await this.getFeatureFlag(id);
      if (!original) {
        throw new Error('Original feature flag not found');
      }

      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const duplicateData = {
        key: newKey,
        name: newName,
        description: original.description,
        is_enabled: false, // Start disabled
        tenant_id: original.tenant_id,
        target_percentage: original.target_percentage,
        dependencies: original.dependencies,
        metadata: original.metadata,
        created_by: user.id,
      };

      const { data, error } = await this.supabase
        .from('feature_flags')
        .insert(duplicateData)
        .select()
        .single();

      if (error) {
        console.error('Error duplicating feature flag:', error);
        throw new Error(`Failed to duplicate feature flag: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in duplicateFeatureFlag:', error);
      throw error;
    }
  }

  async getFeatureFlagStats(): Promise<FeatureFlagStats> {
    try {
      const { data, error } = await this.supabase
        .from('feature_flags')
        .select('is_enabled, tenant_id');

      if (error) {
        console.error('Error fetching feature flag stats:', error);
        throw new Error(`Failed to fetch feature flag stats: ${error.message}`);
      }

      const flags = data || [];
      
      return {
        total_flags: flags.length,
        enabled_flags: flags.filter(f => f.is_enabled).length,
        disabled_flags: flags.filter(f => !f.is_enabled).length,
        tenant_specific_flags: flags.filter(f => f.tenant_id).length,
        global_flags: flags.filter(f => !f.tenant_id).length,
      };
    } catch (error) {
      console.error('Error in getFeatureFlagStats:', error);
      throw error;
    }
  }

  async checkFeatureFlag(key: string, tenantId?: string): Promise<boolean> {
    try {
      let query = this.supabase
        .from('feature_flags')
        .select('is_enabled, target_percentage, dependencies')
        .eq('key', key);

      if (tenantId) {
        query = query.or(`tenant_id.eq.${tenantId},tenant_id.is.null`);
      } else {
        query = query.is('tenant_id', null);
      }

      const { data, error } = await query.single();

      if (error || !data) {
        return false; // Default to disabled if flag doesn't exist
      }

      // Check if flag is enabled
      if (!data.is_enabled) {
        return false;
      }

      // Check percentage rollout
      if (data.target_percentage < 100) {
        const hash = this.hashString(`${key}${tenantId || 'global'}`);
        const percentage = (hash % 100) + 1;
        return percentage <= data.target_percentage;
      }

      return true;
    } catch (error) {
      console.error('Error checking feature flag:', error);
      return false; // Default to disabled on error
    }
  }

  async validateDependencies(flagKey: string, dependencies: string[]): Promise<{ valid: boolean; missingDependencies: string[] }> {
    try {
      if (!dependencies.length) {
        return { valid: true, missingDependencies: [] };
      }

      const { data, error } = await this.supabase
        .from('feature_flags')
        .select('key, is_enabled')
        .in('key', dependencies);

      if (error) {
        console.error('Error validating dependencies:', error);
        return { valid: false, missingDependencies: dependencies };
      }

      const existingFlags = data || [];
      const existingKeys = existingFlags.map(f => f.key);
      const enabledKeys = existingFlags.filter(f => f.is_enabled).map(f => f.key);

      const missingDependencies = dependencies.filter(dep => !existingKeys.includes(dep));
      const disabledDependencies = dependencies.filter(dep => existingKeys.includes(dep) && !enabledKeys.includes(dep));

      return {
        valid: missingDependencies.length === 0 && disabledDependencies.length === 0,
        missingDependencies: [...missingDependencies, ...disabledDependencies],
      };
    } catch (error) {
      console.error('Error in validateDependencies:', error);
      return { valid: false, missingDependencies: dependencies };
    }
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

export const featureFlagsService = new FeatureFlagsService();
