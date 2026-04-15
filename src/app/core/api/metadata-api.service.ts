import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EnumOption } from '../../shared/models/api.models';

@Injectable({
  providedIn: 'root'
})
export class MetadataApiService {
  private readonly apiUrl = `${environment.apiBaseUrl}/metadata/enums`;

  // Cache para evitar múltiplas requisições dos mesmos enums
  private readonly personaTypesCache$ = this.getPersonaTypes().pipe(shareReplay(1));
  private readonly maritalStatusesCache$ = this.getMaritalStatuses().pipe(shareReplay(1));
  private readonly ministriesCache$ = this.getMinistries().pipe(shareReplay(1));
  private readonly memberStatusesCache$ = this.getMemberStatuses().pipe(shareReplay(1));

  constructor(private http: HttpClient) {}

  /**
   * Obtém tipos de pessoa
   */
  getPersonaTypesCached(): Observable<EnumOption[]> {
    return this.personaTypesCache$;
  }

  private getPersonaTypes(): Observable<EnumOption[]> {
    return this.http.get<EnumOption[]>(`${this.apiUrl}/persona-types`);
  }

  /**
   * Obtém estados civis
   */
  getMaritalStatusesCached(): Observable<EnumOption[]> {
    return this.maritalStatusesCache$;
  }

  private getMaritalStatuses(): Observable<EnumOption[]> {
    return this.http.get<EnumOption[]>(`${this.apiUrl}/marital-statuses`);
  }

  /**
   * Obtém ministérios
   */
  getMinstriesCached(): Observable<EnumOption[]> {
    return this.ministriesCache$;
  }

  private getMinistries(): Observable<EnumOption[]> {
    return this.http.get<EnumOption[]>(`${this.apiUrl}/ministries`);
  }

  /**
   * Obtém status de membro
   */
  getMemberStatusesCached(): Observable<EnumOption[]> {
    return this.memberStatusesCache$;
  }

  private getMemberStatuses(): Observable<EnumOption[]> {
    return this.http.get<EnumOption[]>(`${this.apiUrl}/member-statuses`);
  }

  /**
   * Carrega todos os enums de uma vez
   */
  loadAllEnums(): Observable<{
    personaTypes: EnumOption[];
    maritalStatuses: EnumOption[];
    ministries: EnumOption[];
    memberStatuses: EnumOption[];
  }> {
    return new Promise((resolve) => {
      Promise.all([
        this.personaTypesCache$.toPromise(),
        this.maritalStatusesCache$.toPromise(),
        this.ministriesCache$.toPromise(),
        this.memberStatusesCache$.toPromise(),
      ]).then(([personaTypes, maritalStatuses, ministries, memberStatuses]) => {
        resolve({
          personaTypes: personaTypes || [],
          maritalStatuses: maritalStatuses || [],
          ministries: ministries || [],
          memberStatuses: memberStatuses || [],
        });
      });
    }) as any;
  }
}
