import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Persona, PersonaRequest } from '../../shared/models/api.models';

@Injectable({
  providedIn: 'root'
})
export class PersonasApiService {
  private readonly apiUrl = `${environment.apiBaseUrl}/personas`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Persona[]> {
    return this.http.get<Persona[]>(this.apiUrl);
  }

  getById(id: number): Observable<Persona> {
    return this.http.get<Persona>(`${this.apiUrl}/${id}`);
  }

  create(request: PersonaRequest): Observable<Persona> {
    return this.http.post<Persona>(this.apiUrl, request);
  }

  update(id: number, request: PersonaRequest): Observable<Persona> {
    return this.http.put<Persona>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
