/**
 * BaitCheck — Lightweight Client-Side Hash Router
 * Handles #/, #/check/:tool, #/known-scams, #/guides, #/help, #/history, #/exposure.
 */

export class Router {
  constructor(routes = {}) {
    this.routes = routes;
    this.currentRoute = '';
    this.init();
  }

  init() {
    window.addEventListener('hashchange', () => this.handleHashChange());
    window.addEventListener('load', () => this.handleHashChange());
  }

  handleHashChange() {
    const rawHash = window.location.hash || '#/';
    const path = rawHash.replace(/^#/, '') || '/';
    this.currentRoute = path;

    // Direct route match
    if (this.routes[path]) {
      this.routes[path]({ path, params: {} });
      return;
    }

    // Dynamic routes (e.g. /check/:tool, /known-scams/:id)
    for (const routePattern in this.routes) {
      if (routePattern.includes(':')) {
        const regexPattern = new RegExp('^' + routePattern.replace(/:([a-zA-Z0-9_]+)/g, '(?<$1>[^/]+)') + '$');
        const match = path.match(regexPattern);
        if (match) {
          this.routes[routePattern]({ path, params: match.groups || {} });
          return;
        }
      }
    }

    // Fallback to home
    if (this.routes['/']) {
      this.routes['/']({ path: '/', params: {} });
    }
  }

  navigate(path) {
    window.location.hash = '#' + path;
  }
}
