import { Component } from "react";

export class WebGLErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onWebGLFailed?.();
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}
