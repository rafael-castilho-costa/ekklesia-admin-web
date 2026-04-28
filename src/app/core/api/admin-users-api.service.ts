import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminUser, AdminUserRequest } from '../../shared/models/api.models';

@Injectable({
  providedIn: 'root'
})
export class AdminUsersApiService {
  private readonly apiUrl = `${environment.apiBaseUrl}/admin/users`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(this.apiUrl);
  }

  getById(id: number): Observable<AdminUser> {
    return this.http.get<AdminUser>(`${this.apiUrl}/${id}`);
  }

  create(request: AdminUserRequest): Observable<AdminUser> {
    return this.http.post<AdminUser>(this.apiUrl, request);
  }

  update(id: number, request: AdminUserRequest): Observable<AdminUser> {
    return this.http.put<AdminUser>(`${this.apiUrl}/${id}`, request);
  }

  block(id: number): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`${this.apiUrl}/${id}/block`, {});
  }

  unblock(id: number): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`${this.apiUrl}/${id}/unblock`, {});
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
