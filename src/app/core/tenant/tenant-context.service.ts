import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

export const CHURCH_ID_REGEX = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/;

@Injectable({
  providedIn: 'root'
})
export class TenantContextService {
  static readonly DEFAULT_CHURCH_ID = 'iead-jardim-todos-os-santos';
  private static readonly STORAGE_KEY = 'ekklesia.churchId';

  private readonly churchIdSubject = new BehaviorSubject<string | null>(null);
  readonly churchId$ = this.churchIdSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
    const storedChurchId = this.readChurchIdFromStorage();
    if (storedChurchId) {
      this.churchIdSubject.next(storedChurchId);
    }
  }

  getChurchId(): string | null {
    return this.churchIdSubject.value;
  }

  setChurchId(churchId: string | null | undefined): string | null {
    const normalizedChurchId = this.normalizeChurchId(churchId);
    if (!normalizedChurchId) {
      return null;
    }

    this.churchIdSubject.next(normalizedChurchId);
    this.persistChurchId(normalizedChurchId);

    return normalizedChurchId;
  }

  clearChurchId(): void {
    this.churchIdSubject.next(null);

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      localStorage.removeItem(TenantContextService.STORAGE_KEY);
    } catch {
      // ignore browser storage failures
    }
  }

  resolveChurchId(candidates: Array<string | null | undefined>): string | null {
    for (const candidate of candidates) {
      const normalizedChurchId = this.normalizeChurchId(candidate);
      if (normalizedChurchId) {
        return normalizedChurchId;
      }
    }

    return null;
  }

  normalizeChurchId(churchId: string | null | undefined): string | null {
    if (!churchId) {
      return null;
    }

    const normalizedChurchId = churchId
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-{2,}/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!CHURCH_ID_REGEX.test(normalizedChurchId)) {
      return null;
    }

    return normalizedChurchId;
  }

  private readChurchIdFromStorage(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    try {
      return this.normalizeChurchId(localStorage.getItem(TenantContextService.STORAGE_KEY));
    } catch {
      return null;
    }
  }

  private persistChurchId(churchId: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      localStorage.setItem(TenantContextService.STORAGE_KEY, churchId);
    } catch {
      // ignore browser storage failures
    }
  }
}
