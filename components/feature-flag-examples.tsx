'use client'

import React from 'react'
import { 
  useFeatureFlag, 
  useFeatureFlags, 
  FeatureFlag, 
  FeatureFlagValue,
  withFeatureFlag 
} from '@/contexts/feature-flags-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Flag, Sparkles, Zap, Users, Search, Code } from 'lucide-react'

// Example: Using the useFeatureFlag hook
function NewDashboardExample() {
  const { isEnabled, value, evaluation } = useFeatureFlag('new_dashboard_ui', false)

  if (!isEnabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Classic Dashboard</CardTitle>
          <CardDescription>Standard dashboard interface</CardDescription>
        </CardHeader>
        <CardContent>
          <p>You're viewing the classic dashboard experience.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-500" />
          New Dashboard UI
        </CardTitle>
        <CardDescription>Enhanced dashboard with modern interface</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Welcome to the new dashboard experience!</p>
        <Badge className="mt-2" variant="secondary">
          Beta Feature - {evaluation?.reason}
        </Badge>
      </CardContent>
    </Card>
  )
}

// Example: Using the FeatureFlag component for conditional rendering
function CollaborationFeatures() {
  return (
    <FeatureFlag 
      flag="collaboration_features" 
      fallback={
        <Alert>
          <AlertDescription>
            Collaboration features are not available in your plan.
          </AlertDescription>
        </Alert>
      }
    >
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-500" />
            Real-time Collaboration
          </CardTitle>
          <CardDescription>Work together with your team in real-time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Button size="sm" className="mr-2">
              <Users className="h-4 w-4 mr-2" />
              Invite Collaborators
            </Button>
            <Button size="sm" variant="outline">
              <Zap className="h-4 w-4 mr-2" />
              Live Cursor
            </Button>
          </div>
        </CardContent>
      </Card>
    </FeatureFlag>
  )
}

// Example: Using FeatureFlagValue for value-based features
function SearchConfiguration() {
  return (
    <FeatureFlagValue flag="enhanced_search" defaultValue="basic">
      {(searchType, evaluation) => (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search System
            </CardTitle>
            <CardDescription>
              Current search implementation: {searchType}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {searchType === 'elasticsearch' && (
              <div className="space-y-2">
                <Badge variant="default">Elasticsearch Enabled</Badge>
                <p>Full-text search, autocomplete, and advanced filtering available.</p>
              </div>
            )}
            {searchType === 'advanced' && (
              <div className="space-y-2">
                <Badge variant="secondary">Advanced Search</Badge>
                <p>Enhanced search with filters and sorting options.</p>
              </div>
            )}
            {searchType === 'basic' && (
              <div className="space-y-2">
                <Badge variant="outline">Basic Search</Badge>
                <p>Simple keyword search functionality.</p>
              </div>
            )}
            {evaluation && (
              <p className="text-sm text-muted-foreground mt-2">
                Evaluation reason: {evaluation.reason}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </FeatureFlagValue>
  )
}

// Example: Using HOC for conditional components
const BetaCodeEditor = withFeatureFlag('advanced_file_editor', false)(
  function CodeEditorComponent() {
    return (
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5 text-purple-500" />
            Advanced Code Editor
          </CardTitle>
          <CardDescription>Enhanced editing with AI assistance</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Advanced code editor with syntax highlighting, auto-completion, and AI suggestions.</p>
          <Badge className="mt-2" variant="secondary">Beta Feature</Badge>
        </CardContent>
      </Card>
    )
  }
)

// Example: Using multiple flags with batch loading
function FeatureDashboard() {
  const { flags, isLoading } = useFeatureFlags()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const enabledFlags = Object.entries(flags)
    .filter(([_, evaluation]) => evaluation.enabled)
    .map(([key, evaluation]) => ({ key, evaluation }))

  const disabledFlags = Object.entries(flags)
    .filter(([_, evaluation]) => !evaluation.enabled)
    .map(([key, evaluation]) => ({ key, evaluation }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flag className="h-5 w-5" />
          Feature Status
        </CardTitle>
        <CardDescription>Current feature flag states</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="enabled" className="w-full">
          <TabsList>
            <TabsTrigger value="enabled">
              Enabled ({enabledFlags.length})
            </TabsTrigger>
            <TabsTrigger value="disabled">
              Disabled ({disabledFlags.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="enabled" className="space-y-2">
            {enabledFlags.length === 0 ? (
              <p className="text-muted-foreground">No features currently enabled</p>
            ) : (
              enabledFlags.map(({ key, evaluation }) => (
                <div key={key} className="flex items-center justify-between p-2 border rounded">
                  <span className="font-medium">{key}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">Enabled</Badge>
                    <span className="text-xs text-muted-foreground">
                      {evaluation.reason}
                    </span>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
          
          <TabsContent value="disabled" className="space-y-2">
            {disabledFlags.length === 0 ? (
              <p className="text-muted-foreground">All features are enabled</p>
            ) : (
              disabledFlags.map(({ key, evaluation }) => (
                <div key={key} className="flex items-center justify-between p-2 border rounded">
                  <span className="font-medium">{key}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Disabled</Badge>
                    <span className="text-xs text-muted-foreground">
                      {evaluation.reason}
                    </span>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

// Main component showcasing all examples
export function FeatureFlagExamples() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">Feature Flag Examples</h2>
        <p className="text-muted-foreground">
          Demonstrations of different ways to use feature flags in your application
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <NewDashboardExample />
        <CollaborationFeatures />
        <SearchConfiguration />
        <BetaCodeEditor />
      </div>

      <FeatureDashboard />
    </div>
  )
}

// Developer documentation component
export function FeatureFlagDocumentation() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">Feature Flags Usage Guide</h2>
        <p className="text-muted-foreground">
          Learn how to implement feature flags in your components
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>1. Using the useFeatureFlag Hook</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`import { useFeatureFlag } from '@/contexts/feature-flags-context'

function MyComponent() {
  const { isEnabled, value, evaluation } = useFeatureFlag('my_feature', false)
  
  if (!isEnabled) {
    return <div>Feature not available</div>
  }
  
  return <div>Feature is enabled! Value: {JSON.stringify(value)}</div>
}`}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Using the FeatureFlag Component</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`import { FeatureFlag } from '@/contexts/feature-flags-context'

function MyComponent() {
  return (
    <FeatureFlag 
      flag="my_feature" 
      fallback={<div>Feature not available</div>}
    >
      <div>This content shows when the feature is enabled!</div>
    </FeatureFlag>
  )
}`}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. Using the Higher-Order Component</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`import { withFeatureFlag } from '@/contexts/feature-flags-context'

const MyFeature = withFeatureFlag('my_feature', false)(
  function MyFeatureComponent() {
    return <div>This component only renders when enabled!</div>
  }
)

// Usage: <MyFeature />`}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4. Using FeatureFlagValue for Dynamic Values</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`import { FeatureFlagValue } from '@/contexts/feature-flags-context'

function MyComponent() {
  return (
    <FeatureFlagValue flag="theme_config" defaultValue="light">
      {(theme, evaluation) => (
        <div className={\`theme-\${theme}\`}>
          Current theme: {theme}
          Reason: {evaluation?.reason}
        </div>
      )}
    </FeatureFlagValue>
  )
}`}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
