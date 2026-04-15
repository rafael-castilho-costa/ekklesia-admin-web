import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DebugService {
  private http = inject(HttpClient);

  /**
   * Testa a conectividade com a API
   */
  testApiConnection(): void {
    const apiUrl = environment.apiBaseUrl;
    console.log('🧪 Testando conexão com API:', apiUrl);

    // Test GET request to /auth/login (this endpoint doesn't require auth)
    this.http.options(`${apiUrl}/auth/login`).subscribe({
      next: () => {
        console.log('✅ API respondendo (OPTIONS OK)');
        this.testLoginEndpoint();
      },
      error: (error) => {
        console.error('❌ Erro ao conectar com API:', error);
        console.error('Status:', error.status);
        console.error('Message:', error.message);
        if (error.status === 0) {
          console.error('💡 Dica: A API pode não estar rodando em', apiUrl);
          console.error('💡 Ou pode haver erro de CORS/conexão refused');
        }
      }
    });
  }

  private testLoginEndpoint(): void {
    const apiUrl = environment.apiBaseUrl;
    const testRequest = {
      email: 'test@test.com',
      password: 'test123'
    };

    console.log('🧪 Testando POST /auth/login com credenciais de teste...');
    this.http.post(`${apiUrl}/auth/login`, testRequest).subscribe({
      next: (response) => {
        console.log('✅ /auth/login respondendo:', response);
      },
      error: (error) => {
        if (error.status === 401) {
          console.log('✅ /auth/login endpoint existe (retornou 401 - credenciais inválidas, é esperado)');
        } else if (error.status === 0) {
          console.error('❌ Erro de conexão - a API não está acessível');
        } else {
          console.error('❌ Erro:', error.status, error.message);
        }
      }
    });
  }
}
