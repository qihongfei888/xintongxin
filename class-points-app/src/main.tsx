import React, { Component, ErrorInfo, ReactNode } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; message: string }> {
  state = { hasError: false, message: '' }
  static getDerivedStateFromError(e: Error) {
    return { hasError: true, message: e.message }
  }
  componentDidCatch(e: Error, info: ErrorInfo) {
    console.error(e, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, fontFamily: 'sans-serif', maxWidth: 600 }}>
          <h2>页面加载出错</h2>
          <pre style={{ background: '#f0f0f0', padding: 12, overflow: 'auto' }}>{this.state.message}</pre>
          <p>请尝试刷新页面；若直接打开的本地文件，请改为运行 <code>npm run dev</code> 后访问 http://localhost:5173</p>
        </div>
      )
    }
    return this.props.children
  }
}

const root = document.getElementById('root')
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  )
}
