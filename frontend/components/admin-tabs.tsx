'use client'

import { useState } from 'react'
import { AdminUsersTable } from '@/components/admin-users-table'
import { AdminGlobalLogsTable } from '@/components/admin-global-logs-table'
import { AdminStatsPanel } from '@/components/admin-stats-panel'
import { AdminFinancePanel } from '@/components/admin-finance-panel'
import { AdminFeedbackPanel } from '@/components/admin-feedback-panel'

type TabKey = 'stats' | 'users' | 'logs' | 'feedback' | 'finance'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'stats', label: 'Dashboard' },
  { key: 'users', label: 'Users' },
  { key: 'logs', label: 'Global Logs' },
  { key: 'feedback', label: 'Feedback' },
  { key: 'finance', label: 'Finance' },
]

export function AdminTabs() {
  const [activeTab, setActiveTab] = useState<TabKey>('stats')

  return (
    <div className="w-full space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-3 font-medium text-sm transition-colors relative whitespace-nowrap ${
              activeTab === tab.key
                ? 'text-accent'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-fadeIn">
        {activeTab === 'stats' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">System Overview</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Real-time system statistics and analysis status breakdown
              </p>
            </div>
            <AdminStatsPanel />
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">User Management</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage user accounts and roles across the system
                </p>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card/50 overflow-hidden">
              <AdminUsersTable />
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Global Analysis Logs</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  View all CI/CD pipeline analyses performed across the system
                </p>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card/50 overflow-hidden">
              <AdminGlobalLogsTable />
            </div>
          </div>
        )}

        {activeTab === 'feedback' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Feedback Tickets</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Review and respond to user feedback
              </p>
            </div>
            <AdminFeedbackPanel />
          </div>
        )}

        {activeTab === 'finance' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Finance Summary</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Revenue projections based on PRO subscriptions
              </p>
            </div>
            <AdminFinancePanel />
          </div>
        )}
      </div>
    </div>
  )
}

