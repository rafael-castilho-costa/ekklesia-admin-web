import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EnumOption } from '../../shared/models/api.models';

@Injectable({
  providedIn: 'root'
})
export class MetadataApiService {
  private readonly apiUrl = `${environment.apiBaseUrl}/metadata/enums`;

  private readonly personaTypesCache$ = this.fetchPersonaTypes().pipe(shareReplay(1));
  private readonly maritalStatusesCache$ = this.fetchMaritalStatuses().pipe(shareReplay(1));
  private readonly ministriesCache$ = this.fetchMinistries().pipe(shareReplay(1));
  private readonly memberStatusesCache$ = this.fetchMemberStatuses().pipe(shareReplay(1));

  constructor(private http: HttpClient) {}

  getPersonaTypesCached(): Observable<EnumOption[]> {
    return this.personaTypesCache$;
  }

  getMaritalStatusesCached(): Observable<EnumOption[]> {
    return this.maritalStatusesCache$;
  }

  getMinistriesCached(): Observable<EnumOption[]> {
    return this.ministriesCache$;
  }

  getMinstriesCached(): Observable<EnumOption[]> {
    return this.getMinistriesCached();
  }

  getMemberStatusesCached(): Observable<EnumOption[]> {
    return this.memberStatusesCache$;
  }

  loadAllEnums(): Observable<{
    personaTypes: EnumOption[];
    maritalStatuses: EnumOption[];
    ministries: EnumOption[];
    memberStatuses: EnumOption[];
  }> {
    return forkJoin({
      personaTypes: this.getPersonaTypesCached(),
      maritalStatuses: this.getMaritalStatusesCached(),
      ministries: this.getMinistriesCached(),
      memberStatuses: this.getMemberStatusesCached()
    });
  }

  private fetchPersonaTypes(): Observable<EnumOption[]> {
    return this.http.get<EnumOption[]>(`${this.apiUrl}/persona-types`);
  }

  private fetchMaritalStatuses(): Observable<EnumOption[]> {
    return this.http.get<EnumOption[]>(`${this.apiUrl}/marital-statuses`);
  }

  private fetchMinistries(): Observable<EnumOption[]> {
    return this.http.get<EnumOption[]>(`${this.apiUrl}/ministries`);
  }

  private fetchMemberStatuses(): Observable<EnumOption[]> {
    return this.http.get<EnumOption[]>(`${this.apiUrl}/member-statuses`);
  }
}
