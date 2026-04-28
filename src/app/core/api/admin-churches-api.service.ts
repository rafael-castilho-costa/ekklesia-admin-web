import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Church, ChurchRequest } from '../../shared/models/api.models';

@Injectable({
  providedIn: 'root'
})
export class AdminChurchesApiService {
  private readonly apiUrl = `${environment.apiBaseUrl}/admin/churches`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Church[]> {
    return this.http.get<Church[]>(this.apiUrl);
  }

  getById(id: number): Observable<Church> {
    return this.http.get<Church>(`${this.apiUrl}/${id}`);
  }

  create(request: ChurchRequest): Observable<Church> {
    return this.http.post<Church>(this.apiUrl, request);
  }

  update(id: number, request: ChurchRequest): Observable<Church> {
    return this.http.put<Church>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
