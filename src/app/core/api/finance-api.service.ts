import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  FinanceTransaction,
  FinanceTransactionRequest,
  FinanceTransactionType
} from '../../shared/models/api.models';

export interface FinanceTransactionFilters {
  type?: FinanceTransactionType | null;
  category?: string | null;
  paymentMethod?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class FinanceApiService {
  private readonly apiUrl = `${environment.apiBaseUrl}/finance/transactions`;

  constructor(private http: HttpClient) {}

  getAll(filters?: FinanceTransactionFilters): Observable<FinanceTransaction[]> {
    let params = new HttpParams();

    Object.entries(filters ?? {}).forEach(([key, value]) => {
      if (value) {
        params = params.set(key, value);
      }
    });

    return this.http.get<FinanceTransaction[]>(this.apiUrl, { params });
  }

  create(request: FinanceTransactionRequest): Observable<FinanceTransaction> {
    return this.http.post<FinanceTransaction>(this.apiUrl, request);
  }
}
