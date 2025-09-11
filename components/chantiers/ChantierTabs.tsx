"use client";

import { useState } from "react";

interface Tab {
  id: string;
  label: string;
  icon: React.ReactElement | string;
  count?: number;
}

interface ChantierTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: React.ReactNode;
}

export default function ChantierTabs({ tabs, activeTab, onTabChange, children }: ChantierTabsProps) {
  return (
    <div style={{ width: '100%' }}>
      <div style={{ 
        borderBottom: '1px solid #e2e8f0',
        marginBottom: '2rem',
        position: 'sticky',
        top: '0',
        background: 'white',
        zIndex: 10,
        paddingTop: '1rem'
      }}>
        <div style={{ 
          display: 'flex',
          gap: '0',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '1rem 1.5rem',
                border: 'none',
                background: 'transparent',
                color: activeTab === tab.id ? '#3b82f6' : '#64748b',
                fontSize: '0.875rem',
                fontWeight: activeTab === tab.id ? '600' : '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                borderBottom: activeTab === tab.id 
                  ? '2px solid #3b82f6' 
                  : '2px solid transparent',
                whiteSpace: 'nowrap',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.color = '#1e293b';
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.color = '#64748b';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <span style={{ fontSize: '1rem' }}>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  style={{
                    background: activeTab === tab.id 
                      ? '#3b82f6' 
                      : '#e2e8f0',
                    color: activeTab === tab.id 
                      ? 'white' 
                      : '#64748b',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    padding: '0.125rem 0.5rem',
                    borderRadius: '1rem',
                    minWidth: '1.5rem',
                    height: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div style={{ 
        animation: 'fadeIn 0.3s ease-in-out'
      }}>
        {children}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
