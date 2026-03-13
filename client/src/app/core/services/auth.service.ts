import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

/** Access token stored in localStorage so it persists across refresh and is sent via JWT interceptor */
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export interface LoginRequest { email: string; password: string; }
export interface RegisterRequest { email: string; password: string; fullName: string; role?: string; }
export interface AuthUser { token: string; email: string; fullName: string; role: string; }
export interface RegisterResponse { id: string; email: string; fullName: string; role: string; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = `${environment.apiUrl}/Auth`;
  private _user = signal<AuthUser | null>(this.loadStoredUser());

  currentUser = this._user.asReadonly();
  isLoggedIn = computed(() => !!this._user());
  isAdmin = computed(() => this._user()?.role === 'Admin');

  constructor(private http: HttpClient, private router: Router) {}

  private loadStoredUser(): AuthUser | null {
    const token = localStorage.getItem(TOKEN_KEY);
    const userJson = localStorage.getItem(USER_KEY);
    if (!token || !userJson) return null;
    try {
      return { ...JSON.parse(userJson), token };
    } catch { return null; }
  }

  login(req: LoginRequest): Observable<AuthUser> {
    return this.http.post<AuthUser>(`${this.api}/login`, req).pipe(
      tap((user) => {
        localStorage.setItem(TOKEN_KEY, user.token);
        const { token, ...rest } = user;
        localStorage.setItem(USER_KEY, JSON.stringify(rest));
        this._user.set(user);
      })
    );
  }

  register(req: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.api}/register`, {
      email: req.email,
      password: req.password,
      fullName: req.fullName,
      role: req.role ?? 'Customer'
    });
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }
}
