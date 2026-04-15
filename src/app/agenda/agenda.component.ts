import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

type LancamentoTipo = 'entrada' | 'saida';

interface ComparativoMensal {
  mes: string;
  entradas: number;
  saidas: number;
}

interface CategoriaEntrada {
  nome: string;
  valor: number;
  cor: string;
  classe: string;
}

interface Lancamento {
  tipo: LancamentoTipo;
  descricao: string;
  data: string;
  categoria: string;
  pagamento: string;
  valor: number;
}

@Component({
  standalone: true,
  selector: 'app-agenda',
  templateUrl: './agenda.component.html',
  styleUrls: ['./agenda.component.css'],
  imports: [CommonModule, FormsModule, MatIconModule]
})
export class AgendaComponent {
  filtroTipo: 'todos' | LancamentoTipo = 'todos';
  readonly escalaComparativo = 60000;

  readonly comparativoMensal: ComparativoMensal[] = [
    { mes: 'Set', entradas: 29000, saidas: 18000 },
    { mes: 'Out', entradas: 32000, saidas: 20000 },
    { mes: 'Nov', entradas: 30000, saidas: 22000 },
    { mes: 'Dez', entradas: 45000, saidas: 25000 },
    { mes: 'Jan', entradas: 33000, saidas: 20000 },
    { mes: 'Fev', entradas: 36900, saidas: 10350 }
  ];

  readonly categoriasEntrada: CategoriaEntrada[] = [
    { nome: 'Dizimos', valor: 66, cor: '#132f5f', classe: 'label-dizimos' },
    { nome: 'Eventos', valor: 12, cor: '#1783df', classe: 'label-eventos' },
    { nome: 'Doacoes', valor: 14, cor: '#05a56a', classe: 'label-doacoes' },
    { nome: 'Ofertas', valor: 9, cor: '#eba43b', classe: 'label-ofertas' }
  ];

  readonly lancamentos: Lancamento[] = [
    {
      tipo: 'entrada',
      descricao: 'Dizimos do mes',
      data: '27/02/2026',
      categoria: 'Dizimos',
      pagamento: 'PIX',
      valor: 15800
    },
    {
      tipo: 'entrada',
      descricao: 'Oferta do culto dominical',
      data: '23/02/2026',
      categoria: 'Ofertas',
      pagamento: 'Dinheiro',
      valor: 3200
    },
    {
      tipo: 'entrada',
      descricao: 'Campanha especial',
      data: '20/02/2026',
      categoria: 'Doacoes',
      pagamento: 'PIX',
      valor: 5400
    },
    {
      tipo: 'entrada',
      descricao: 'Inscricao retiro jovens',
      data: '15/02/2026',
      categoria: 'Eventos',
      pagamento: 'Cartao',
      valor: 12500
    },
    {
      tipo: 'saida',
      descricao: 'Conta de energia',
      data: '24/02/2026',
      categoria: 'Infraestrutura',
      pagamento: 'Debito',
      valor: 2800
    },
    {
      tipo: 'saida',
      descricao: 'Ajuda social',
      data: '21/02/2026',
      categoria: 'Acao social',
      pagamento: 'PIX',
      valor: 1800
    },
    {
      tipo: 'saida',
      descricao: 'Material escola biblica',
      data: '19/02/2026',
      categoria: 'Ministerio infantil',
      pagamento: 'Pix',
      valor: 5750
    }
  ];

  get totalEntradas(): number {
    return this.lancamentos
      .filter((lancamento) => lancamento.tipo === 'entrada')
      .reduce((acumulado, lancamento) => acumulado + lancamento.valor, 0);
  }

  get totalSaidas(): number {
    return this.lancamentos
      .filter((lancamento) => lancamento.tipo === 'saida')
      .reduce((acumulado, lancamento) => acumulado + lancamento.valor, 0);
  }

  get saldoAtual(): number {
    return this.totalEntradas - this.totalSaidas;
  }

  get lancamentosFiltrados(): Lancamento[] {
    if (this.filtroTipo === 'todos') {
      return this.lancamentos;
    }

    return this.lancamentos.filter((lancamento) => lancamento.tipo === this.filtroTipo);
  }

  get donutGradient(): string {
    let acumulado = 0;

    const fatias = this.categoriasEntrada.map((categoria) => {
      const inicio = acumulado;
      const fim = acumulado + categoria.valor;
      acumulado = fim;
      return `${categoria.cor} ${inicio}% ${fim}%`;
    });

    return `conic-gradient(${fatias.join(', ')})`;
  }

  alturaBarra(valor: number): number {
    return (valor / this.escalaComparativo) * 100;
  }

  tipoIcone(tipo: LancamentoTipo): string {
    return tipo === 'entrada' ? 'trending_up' : 'trending_down';
  }

  tipoClasse(tipo: LancamentoTipo): string {
    return tipo === 'entrada' ? 'tipo-entrada' : 'tipo-saida';
  }

  categoriaClasse(categoria: string): string {
    const normalizado = categoria.toLowerCase();

    if (normalizado.includes('dizimo')) {
      return 'tag-dizimos';
    }

    if (normalizado.includes('oferta')) {
      return 'tag-ofertas';
    }

    if (normalizado.includes('evento')) {
      return 'tag-eventos';
    }

    if (normalizado.includes('doa')) {
      return 'tag-doacoes';
    }

    return 'tag-neutra';
  }

  valorFormatado(valor: number, tipo: LancamentoTipo): string {
    const prefixo = tipo === 'entrada' ? '+' : '-';
    return `${prefixo} ${this.formatarMoeda(valor)}`;
  }

  formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0
    }).format(valor);
  }

  novoLancamento(): void {
    console.log('Acao: novo lancamento');
  }

  trackByDescricao(_: number, lancamento: Lancamento): string {
    return `${lancamento.descricao}-${lancamento.data}`;
  }
}
