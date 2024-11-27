interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
}

class PerformanceService {
  private metrics: Partial<PerformanceMetrics> = {};
  private observers: Map<string, IntersectionObserver> = new Map();
  private readonly PERFORMANCE_KEY = 'lawlink_performance_data';

  constructor() {
    this.setupPerformanceObservers();
    this.setupIntersectionObservers();
  }

  private setupPerformanceObservers() {
    // First Contentful Paint
    this.observePaint('first-contentful-paint', (entry) => {
      this.metrics.fcp = entry.startTime;
      this.saveMetrics();
    });

    // Largest Contentful Paint
    this.observePaint('largest-contentful-paint', (entry) => {
      this.metrics.lcp = entry.startTime;
      this.saveMetrics();
    });

    // First Input Delay
    this.observeFirstInput((entry) => {
      this.metrics.fid = entry.processingStart - entry.startTime;
      this.saveMetrics();
    });

    // Cumulative Layout Shift
    this.observeLayoutShift((entry) => {
      this.metrics.cls = (this.metrics.cls || 0) + entry.value;
      this.saveMetrics();
    });

    // Time to First Byte
    if (performance.getEntriesByType('navigation').length > 0) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      this.metrics.ttfb = navigation.responseStart - navigation.requestStart;
      this.saveMetrics();
    }
  }

  private observePaint(type: string, callback: (entry: PerformanceEntry) => void) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === type) {
            callback(entry);
          }
        }
      });

      observer.observe({ entryTypes: [type] });
    } catch (e) {
      console.warn(`PerformanceObserver for ${type} not supported`);
    }
  }

  private observeFirstInput(callback: (entry: PerformanceEventTiming) => void) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          callback(entry as PerformanceEventTiming);
        }
      });

      observer.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      console.warn('PerformanceObserver for first-input not supported');
    }
  }

  private observeLayoutShift(callback: (entry: any) => void) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          callback(entry);
        }
      });

      observer.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      console.warn('PerformanceObserver for layout-shift not supported');
    }
  }

  private setupIntersectionObservers() {
    // Create observer for lazy loading images
    const imageObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              imageObserver.unobserve(img);
            }
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01
      }
    );

    this.observers.set('image', imageObserver);
  }

  private saveMetrics() {
    localStorage.setItem(this.PERFORMANCE_KEY, JSON.stringify(this.metrics));
  }

  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  enableHardwareAcceleration(element: HTMLElement) {
    // Force hardware acceleration
    element.style.transform = 'translateZ(0)';
    element.style.backfaceVisibility = 'hidden';
    element.style.perspective = '1000px';
  }

  observeImage(img: HTMLImageElement) {
    const imageObserver = this.observers.get('image');
    if (imageObserver) {
      imageObserver.observe(img);
    }
  }

  preloadRoute(route: string) {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = route;
    document.head.appendChild(link);
  }

  optimizeAnimation(element: HTMLElement) {
    // Optimize animations
    element.style.willChange = 'transform';
    
    // Cleanup after animation
    element.addEventListener('transitionend', () => {
      element.style.willChange = 'auto';
    }, { once: true });
  }

  reportPerformanceIssue(metric: keyof PerformanceMetrics, value: number) {
    // Send performance data to analytics or monitoring service
    console.warn(`Performance issue detected: ${metric} = ${value}`);
    
    // You can implement your own reporting logic here
    // For example, sending to an analytics service or error tracking system
  }
}

export const performanceService = new PerformanceService();
export default performanceService;
