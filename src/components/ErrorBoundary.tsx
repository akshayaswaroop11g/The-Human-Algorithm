import { Component, type ErrorInfo, type ReactNode } from 'react'
import { EmptyState } from './States'

/**
 * Catches unexpected errors in a page and shows a calm message instead of a white screen.
 * (React only supports this pattern as a class component.)
 */
export default class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Page error:', error, info.componentStack)
  }

  render() {
    if (this.state.failed) {
      return (
        <EmptyState code="ERR · Unexpected state" title="Something didn’t compute." actions={[{ to: '/', label: 'Return home', primary: true }]}>
          <p>
            This page hit an error. Your stored answers are not affected. Reloading usually fixes it; if not,
            returning home will.
          </p>
        </EmptyState>
      )
    }
    return this.props.children
  }
}
