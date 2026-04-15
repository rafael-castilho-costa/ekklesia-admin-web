import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Member, MemberRequest } from '../../shared/models/api.models';

@Injectable({
  providedIn: 'root'
})
export class MembersApiService {
  private readonly apiUrl = `${environment.apiBaseUrl}/members`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Member[]> {
    return this.http.get<Member[]>(this.apiUrl);
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
