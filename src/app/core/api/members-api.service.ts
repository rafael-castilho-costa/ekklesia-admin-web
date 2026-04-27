import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Member, MemberRequest } from '../../shared/models/api.models';

@Injectable({
  providedIn: 'root'
})
export class MembersApiService {
  private readonly apiUrl = `${environment.apiBaseUrl}/members`;

  constructor(private http: HttpClient) {}

  getAll(filters?: {
    statusMember?: string | null;
    search?: string | null;
  }): Observable<Member[]> {
    let params = new HttpParams();

    if (filters?.statusMember) {
      params = params.set('statusMember', filters.statusMember);
    }

    if (filters?.search) {
      params = params.set('search', filters.search);
    }

    return this.http.get<Member[]>(this.apiUrl, { params });
  }

  getById(id: number): Observable<Member> {
    return this.http.get<Member>(`${this.apiUrl}/${id}`);
  }

  create(request: MemberRequest): Observable<Member> {
    return this.http.post<Member>(this.apiUrl, request);
  }

  update(id: number, request: MemberRequest): Observable<Member> {
    return this.http.put<Member>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
