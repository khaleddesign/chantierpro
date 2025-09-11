"use client";

import React from 'react';

interface ErrorBoundaryState {
 hasError: boolean;
 error?: Error;
}

interface ErrorBoundaryProps {
 children: React.ReactNode;
 fallback?: React.ComponentType<{ error?: Error; reset: () => void }>;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
 constructor(props: ErrorBoundaryProps) {
   super(props);
   this.state = { hasError: false };
 }

 static getDerivedStateFromError(error: Error): ErrorBoundaryState {
   return { hasError: true, error };
 }

 componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
   console.error('ErrorBoundary:', error, errorInfo);
 }

 render() {
   if (this.state.hasError) {
     return (
       <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
         <h2 style={{ color: '#dc2626' }}>Une erreur s'est produite</h2>
         <button 
           onClick={() => this.setState({ hasError: false })} 
           className="btn-primary"
         >
           Réessayer
         </button>
       </div>
     );
   }

   return this.props.children;
 }
}
