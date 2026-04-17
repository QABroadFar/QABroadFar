import React, { Component } from 'react';

class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    // Update state when there's an error
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      // Display fallback UI when there's an error
      return <div>An error occurred. Please try again.</div>;
    }

    // Render children if no error
    return this.props.children;
  }
}

export default ErrorBoundary;