import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
  private readonly customLabel = signal<string | null>(null);

  readonly currentLabel = computed(() => this.customLabel());

  setCustomLabel(label: string): void {
    this.customLabel.set(label);
  }

  clearCustomLabel(): void {
    this.customLabel.set(null);
  }
}
