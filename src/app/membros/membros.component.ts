import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

type MemberStatus = 'ativo' | 'visitante' | 'afastado';

interface Member {
  nome: string;
  telefone: string;
  ministerio: string;
  status: MemberStatus;
}

@Component({
  standalone: true,
  selector: 'app-membros',
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './membros.component.html',
  styleUrls: ['./membros.component.css']
})
export class MembrosComponent {
  searchTerm = '';
  statusFilter: 'todos' | MemberStatus = 'todos';

  readonly membros: Member[] = [
    { nome: 'Maria Silva Santos', telefone: '(11) 98765-4321', ministerio: 'Louvor', status: 'ativo' },
    { nome: 'Joao Pedro Oliveira', telefone: '(11) 91234-5678', ministerio: 'Jovens', status: 'ativo' },
    { nome: 'Ana Clara Ferreira', telefone: '(11) 99876-5432', ministerio: 'Intercessao', status: 'ativo' },
    { nome: 'Carlos Eduardo Lima', telefone: '(11) 93456-7890', ministerio: 'Midia', status: 'ativo' },
    { nome: 'Francisca Souza', telefone: '(11) 95678-1234', ministerio: 'Diaconia', status: 'ativo' },
    { nome: 'Rafael Mendes Costa', telefone: '(11) 97890-1234', ministerio: 'Jovens', status: 'visitante' },
    { nome: 'Luisa Almeida', telefone: '(11) 92345-6789', ministerio: 'Escola Biblica', status: 'ativo' },
    { nome: 'Pedro Henrique Rocha', telefone: '(11) 94567-8901', ministerio: 'Pregacao', status: 'afastado' }
  ];

  get totalAtivos(): number {
    return this.membros.filter((membro) => membro.status === 'ativo').length;
  }

  get totalVisitantes(): number {
    return this.membros.filter((membro) => membro.status === 'visitante').length;
  }

  get totalAfastados(): number {
    return this.membros.filter((membro) => membro.status === 'afastado').length;
  }

  get membrosFiltrados(): Member[] {
    const termo = this.searchTerm.trim().toLowerCase();

    return this.membros.filter((membro) => {
      const correspondeStatus = this.statusFilter === 'todos' || membro.status === this.statusFilter;
      const correspondeBusca =
        !termo ||
        membro.nome.toLowerCase().includes(termo) ||
        membro.ministerio.toLowerCase().includes(termo);

      return correspondeStatus && correspondeBusca;
    });
  }

  statusLabel(status: MemberStatus): string {
    if (status === 'visitante') {
      return 'visitante';
    }

    if (status === 'afastado') {
      return 'afastado';
    }

    return 'ativo';
  }

  statusClass(status: MemberStatus): string {
    return `status-${status}`;
  }

  novoMembro(): void {
    console.log('Acao: novo membro');
  }

  editarMembro(membro: Member): void {
    console.log('Acao: editar membro', membro.nome);
  }

  removerMembro(membro: Member): void {
    console.log('Acao: remover membro', membro.nome);
  }

  trackByNome(_: number, membro: Member): string {
    return membro.nome;
  }
}
