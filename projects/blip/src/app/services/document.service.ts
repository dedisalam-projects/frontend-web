import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: any;
}

@Injectable({
  providedIn: 'root',
})
export class DocumentService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/documents`;

  getDocuments(provider: string, params: { page?: number; limit?: number; search?: string } = {}): Observable<ApiResponse<PaginatedResult<any>>> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params.search) httpParams = httpParams.set('search', params.search);

    return this.http.get<ApiResponse<PaginatedResult<any>>>(`${this.baseUrl}/${provider}`, { params: httpParams });
  }

  getDocument(provider: string, id: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/${provider}/${id}`);
  }

  createDocument(provider: string, data: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/${provider}`, data);
  }

  updateDocument(provider: string, id: string, data: any): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.baseUrl}/${provider}/${id}`, data);
  }

  deleteDocument(provider: string, id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/${provider}/${id}`);
  }

  generatePdfBlob(provider: string, id: string): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/${provider}/${id}/generate`, {}, {
      responseType: 'blob',
    });
  }
}
