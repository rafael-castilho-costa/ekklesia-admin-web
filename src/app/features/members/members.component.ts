import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import {
  Subject,
  debounceTime,
  distinctUntilChanged,
  finalize,
  forkJoin,
  map,
  Observable,
  of,
  switchMap,
  tap
} from 'rxjs';
import { AuthApiService } from '../../core/api/auth-api.service';
import { MembersApiService } from '../../core/api/members-api.service';
import { MetadataApiService } from '../../core/api/metadata-api.service';
import { PersonasApiService } from '../../core/api/personas-api.service';
import { AuthSessionService } from '../../core/auth/auth-session.service';
import { TenantContextService } from '../../core/tenant/tenant-context.service';
import {
  AuthMeResponse,
  EnumOption,
  Member,
  MemberRequest,
  PersonaRequest
} from '../../shared/models/api.models';
import { resolveApiErrorMessage } from '../../shared/utils/api-error.utils';
import { formatIsoDateToBr } from '../../shared/utils/format.utils';
import { PaginationComponent } from '../../shared/components/pagination.component';

@Component({
  standalone: true,
  selector: 'app-members',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatIconModule, PaginationComponent],
  templateUrl: './members.component.html',
  styleUrls: ['./members.component.css']
})
export class MembersComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authApiService = inject(AuthApiService);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly tenantContextService = inject(TenantContextService);
  private readonly metadataApiService = inject(MetadataApiService);
  private readonly membersApiService = inject(MembersApiService);
  private readonly personasApiService = inject(PersonasApiService);

  private readonly searchSubject = new Subject<string>();

  readonly memberForm = this.fb.group({
    personaType: ['', [Validators.required]],
    taxId: ['', [Validators.required]],
    name: ['', [Validators.required]],
    birthDate: [''],
    maritalStatus: [''],
    phone: [''],
    email: ['', [Validators.email]],
    address: [''],
    membershipDate: [''],
    baptismDate: [''],
    baptized: [false],
    ministry: [''],
    statusMember: ['', [Validators.required]],
    notes: [''],
    spouseTaxId: [''],
    spouseName: [''],
    spouseBirthDate: [''],
    spousePhone: [''],
    spouseEmail: ['', [Validators.email]],
    spouseAddress: ['']
  });

  members: Member[] = [];
  personaTypes: EnumOption[] = [];
  maritalStatuses: EnumOption[] = [];
  ministries: EnumOption[] = [];
  memberStatuses: EnumOption[] = [];

  searchTerm = '';
  statusFilter = '';
  isInitialLoading = true;
  isLoadingMembers = false;
  isModalOpen = false;
  isSubmitting = false;
  isLoadingModalData = false;
  pageErrorMessage: string | null = null;
  submitErrorMessage: string | null = null;
  successMessage: string | null = null;
  page = 1;
  pageSize = 10;

  private editingMember: Member | null = null;

  ngOnInit(): void {
    this.setupDebouncedSearch();
    this.initializePage();
  }

  get totalActive(): number {
    return this.members.filter((member) => member.statusMember === 'ACTIVE').length;
  }

  get totalVisitors(): number {
    return this.members.filter((member) => member.statusMember === 'VISITOR').length;
  }

  get totalInactive(): number {
    return this.members.filter((member) => member.statusMember === 'INACTIVE').length;
  }

  get modalTitle(): string {
    return this.editingMember ? 'Editar Membro' : 'Cadastrar Membro';
  }

  get paginatedMembers(): Member[] {
    const start = (this.page - 1) * this.pageSize;
    return this.members.slice(start, start + this.pageSize);
  }

  get showSpouseFields(): boolean {
    return !this.editingMember && this.memberForm.controls.maritalStatus.value === 'CASADO';
  }

  get isVisitorStatus(): boolean {
    return this.memberForm.controls.statusMember.value === 'VISITOR';
  }

  onSearchTermChange(value: string): void {
    this.searchTerm = value;
    this.searchSubject.next(value);
  }

  onStatusFilterChange(): void {
    this.page = 1;
    this.loadMembers();
  }

  onPageChange(page: number): void {
    this.page = page;
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSize = pageSize;
    this.page = 1;
  }

  novoMembro(): void {
    this.editingMember = null;
    this.submitErrorMessage = null;
    this.successMessage = null;
    this.memberForm.reset({
      personaType: '',
      taxId: '',
      name: '',
      birthDate: '',
      maritalStatus: '',
      phone: '',
      email: '',
      address: '',
      membershipDate: '',
      baptismDate: '',
      baptized: false,
      ministry: '',
      statusMember: '',
      notes: '',
      spouseTaxId: '',
      spouseName: '',
      spouseBirthDate: '',
      spousePhone: '',
      spouseEmail: '',
      spouseAddress: ''
    });
    this.configureTaxIdValidators();
    this.configureSpouseValidators();
    this.memberForm.markAsPristine();
    this.memberForm.markAsUntouched();
    this.isModalOpen = true;
  }

  editarMembro(member: Member): void {
    this.successMessage = null;
    this.submitErrorMessage = null;
    this.isModalOpen = true;
    this.isLoadingModalData = true;

    this.membersApiService
      .getById(member.id)
      .pipe(finalize(() => (this.isLoadingModalData = false)))
      .subscribe({
        next: (loadedMember) => {
          this.editingMember = loadedMember;
          this.memberForm.reset({
            personaType: loadedMember.persona.personaType ?? '',
            taxId: loadedMember.persona.taxId ?? '',
            name: loadedMember.persona.name ?? '',
            birthDate: loadedMember.persona.birthDate ?? '',
            maritalStatus: loadedMember.persona.maritalStatus ?? '',
            phone: loadedMember.persona.phone ?? '',
            email: loadedMember.persona.email ?? '',
            address: loadedMember.persona.address ?? '',
            membershipDate: loadedMember.membershipDate ?? '',
            baptismDate: loadedMember.baptismDate ?? '',
            baptized: loadedMember.baptized ?? false,
            ministry: loadedMember.ministry ?? '',
            statusMember: loadedMember.statusMember ?? '',
            notes: loadedMember.notes ?? '',
            spouseTaxId: '',
            spouseName: '',
            spouseBirthDate: '',
            spousePhone: '',
            spouseEmail: '',
            spouseAddress: ''
          });
          this.configureTaxIdValidators();
          this.configureSpouseValidators();
        },
        error: (error) => {
          this.submitErrorMessage = this.resolveErrorMessage(error, 'Nao foi possivel carregar o membro.');
          this.isModalOpen = false;
        }
      });
  }

  removerMembro(member: Member): void {
    if (!confirm(`Deseja excluir o membro "${member.persona.name}"?`)) {
      return;
    }

    this.successMessage = null;
    this.pageErrorMessage = null;
    this.isLoadingMembers = true;

    this.membersApiService
      .delete(member.id)
      .pipe(
        switchMap(() => this.membersApiService.getAll(this.buildMemberFilters())),
        finalize(() => (this.isLoadingMembers = false))
      )
      .subscribe({
        next: (members) => {
          this.members = members;
          this.page = 1;
          this.successMessage = 'Membro excluido com sucesso.';
        },
        error: (error) => {
          this.pageErrorMessage = this.resolveErrorMessage(error, 'Nao foi possivel excluir o membro.');
        }
      });
  }

  fecharModal(): void {
    this.isModalOpen = false;
    this.isLoadingModalData = false;
    this.submitErrorMessage = null;
    this.editingMember = null;
  }

  fecharModalAoClicarFora(event: MouseEvent): void {
    if (event.target === event.currentTarget && !this.isSubmitting) {
      this.fecharModal();
    }
  }

  salvarNovoMembro(): void {
    this.submitErrorMessage = null;
    this.successMessage = null;
    this.configureTaxIdValidators();
    this.configureSpouseValidators();

    if (this.memberForm.invalid) {
      this.memberForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    const personaRequest = this.buildPersonaRequest();
    const saveMember = (personaId: number): Observable<unknown> => {
      const memberRequest = this.buildMemberRequest(personaId);

      return this.editingMember
        ? this.membersApiService.update(this.editingMember.id, memberRequest)
        : this.membersApiService.create(memberRequest);
    };

    const saveSpouse = (personaId: number): Observable<unknown> => {
      if (!this.showSpouseFields) {
        return of(null);
      }

      return this.personasApiService.create(this.buildSpousePersonaRequest()).pipe(
        switchMap((spouse) =>
          this.personasApiService.createRelationship({
            personaId,
            relatedPersonaId: spouse.id,
            relationshipType: 'SPOUSE'
          })
        )
      );
    };

    const saveFlow$ = this.editingMember
      ? this.personasApiService
          .update(this.editingMember.persona.id, personaRequest)
          .pipe(switchMap((persona) => saveMember(persona.id)))
      : this.personasApiService
          .create(personaRequest)
          .pipe(switchMap((persona) => saveMember(persona.id).pipe(switchMap(() => saveSpouse(persona.id)))));

    saveFlow$
      .pipe(
        switchMap(() => this.membersApiService.getAll(this.buildMemberFilters())),
        finalize(() => (this.isSubmitting = false))
      )
      .subscribe({
        next: (members) => {
          this.members = members;
          this.page = 1;
          this.successMessage = this.editingMember
            ? 'Membro atualizado com sucesso.'
            : 'Membro criado com sucesso.';
          this.fecharModal();
        },
        error: (error) => {
          this.submitErrorMessage = this.resolveErrorMessage(error, 'Nao foi possivel salvar o membro.');
        }
      });
  }

  trackByMember(_: number, member: Member): number {
    return member.id;
  }

  getStatusLabel(status: string | null | undefined): string {
    return this.getEnumDescription(this.memberStatuses, status);
  }

  getMinistryLabel(ministry: string | null | undefined): string {
    return this.getEnumDescription(this.ministries, ministry);
  }

  getMaritalStatusLabel(status: string | null | undefined): string {
    return this.getEnumDescription(this.maritalStatuses, status);
  }

  formatDate(date: string | null | undefined): string {
    return formatIsoDateToBr(date);
  }

  statusClass(status: string | null | undefined): string {
    return `status-${(status ?? '').toLowerCase()}`;
  }

  private setupDebouncedSearch(): void {
    this.searchSubject
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.loadMembers());

    this.memberForm.controls.maritalStatus.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.configureSpouseValidators());

    this.memberForm.controls.statusMember.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.configureTaxIdValidators());
  }

  private initializePage(): void {
    const token = this.authSessionService.getAccessToken();
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    this.ensureAuthenticatedContext()
      .pipe(
        switchMap(() =>
          forkJoin({
            enums: this.metadataApiService.loadAllEnums(),
            members: this.membersApiService.getAll(this.buildMemberFilters())
          })
        ),
        finalize(() => (this.isInitialLoading = false))
      )
      .subscribe({
        next: ({ enums, members }) => {
          this.personaTypes = enums.personaTypes;
          this.maritalStatuses = enums.maritalStatuses;
          this.ministries = enums.ministries;
          this.memberStatuses = enums.memberStatuses;
          this.members = members;
          this.page = 1;
        },
        error: (error) => {
          this.pageErrorMessage = this.resolveErrorMessage(error, 'Nao foi possivel carregar a tela de membros.');
        }
      });
  }

  private ensureAuthenticatedContext() {
    const session = this.authSessionService.getSession();
    const accessToken = session?.accessToken;
    const resolvedChurchId =
      this.tenantContextService.getChurchId() ??
      this.authSessionService.getChurchIdHeaderValue();

    if (!accessToken) {
      return of(void 0);
    }

    if (resolvedChurchId) {
      this.tenantContextService.setChurchId(resolvedChurchId);
    }

    if (session?.user) {
      this.tenantContextService.setChurchId(String(session.user.churchId));
      return of(void 0);
    }

    return this.authApiService.getAuthenticatedUser().pipe(
      tap((user) => this.persistAuthenticatedUser(accessToken, user)),
      map(() => void 0)
    );
  }

  private persistAuthenticatedUser(accessToken: string, user: AuthMeResponse): void {
    this.authSessionService.setSession({
      accessToken,
      user
    });
    this.tenantContextService.setChurchId(String(user.churchId));
  }

  private loadMembers(): void {
    this.pageErrorMessage = null;
    this.isLoadingMembers = true;

    this.membersApiService
      .getAll(this.buildMemberFilters())
      .pipe(finalize(() => (this.isLoadingMembers = false)))
      .subscribe({
        next: (members) => {
          this.members = members;
          this.page = 1;
        },
        error: (error) => {
          this.pageErrorMessage = this.resolveErrorMessage(error, 'Nao foi possivel carregar os membros.');
        }
      });
  }

  private buildMemberFilters(): { statusMember?: string; search?: string } {
    const filters: { statusMember?: string; search?: string } = {};

    if (this.statusFilter) {
      filters.statusMember = this.statusFilter;
    }

    const trimmedSearch = this.searchTerm.trim();
    if (trimmedSearch) {
      filters.search = trimmedSearch;
    }

    return filters;
  }

  private buildPersonaRequest(): PersonaRequest {
    const formValue = this.memberForm.getRawValue();

    return {
      personaType: formValue.personaType || '',
      taxId: this.onlyDigits(formValue.taxId),
      name: formValue.name?.trim() || '',
      birthDate: this.normalizeOptionalValue(formValue.birthDate),
      maritalStatus: this.normalizeOptionalValue(formValue.maritalStatus),
      phone: this.normalizeOptionalValue(formValue.phone?.trim()),
      email: this.normalizeOptionalValue(formValue.email?.trim()),
      address: this.normalizeOptionalValue(formValue.address?.trim())
    };
  }

  private buildMemberRequest(personaId: number): MemberRequest {
    const formValue = this.memberForm.getRawValue();

    return {
      personaId,
      membershipDate: this.normalizeOptionalValue(formValue.membershipDate),
      baptismDate: this.normalizeOptionalValue(formValue.baptismDate),
      baptized: !!formValue.baptized,
      ministry: this.normalizeOptionalValue(formValue.ministry),
      statusMember: formValue.statusMember || '',
      notes: this.normalizeOptionalValue(formValue.notes?.trim())
    };
  }

  private buildSpousePersonaRequest(): PersonaRequest {
    const formValue = this.memberForm.getRawValue();

    return {
      personaType: 'NATURAL_PERSON',
      taxId: this.onlyDigits(formValue.spouseTaxId),
      name: formValue.spouseName?.trim() || '',
      birthDate: this.normalizeOptionalValue(formValue.spouseBirthDate),
      maritalStatus: 'CASADO',
      phone: this.normalizeOptionalValue(formValue.spousePhone?.trim()),
      email: this.normalizeOptionalValue(formValue.spouseEmail?.trim()),
      address: this.normalizeOptionalValue(formValue.spouseAddress?.trim()) ?? this.normalizeOptionalValue(formValue.address?.trim())
    };
  }

  private configureSpouseValidators(): void {
    const requiredWhenMarried = this.showSpouseFields ? [Validators.required] : [];
    const spouseTaxId = this.memberForm.controls.spouseTaxId;
    const spouseName = this.memberForm.controls.spouseName;

    spouseTaxId.setValidators(requiredWhenMarried);
    spouseName.setValidators(requiredWhenMarried);
    spouseTaxId.updateValueAndValidity({ emitEvent: false });
    spouseName.updateValueAndValidity({ emitEvent: false });
  }

  private configureTaxIdValidators(): void {
    const taxId = this.memberForm.controls.taxId;
    taxId.setValidators(this.isVisitorStatus ? [] : [Validators.required]);
    taxId.updateValueAndValidity({ emitEvent: false });
  }

  private normalizeOptionalValue(value: string | null | undefined): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmedValue = value.trim();
    return trimmedValue.length > 0 ? trimmedValue : null;
  }

  private onlyDigits(value: string | null | undefined): string {
    return value?.replace(/\D/g, '') ?? '';
  }

  private getEnumDescription(options: EnumOption[], value: string | null | undefined): string {
    if (!value) {
      return '-';
    }

    return options.find((option) => option.value === value)?.description ?? value;
  }

  private resolveErrorMessage(error: unknown, fallbackMessage: string): string {
    return resolveApiErrorMessage(error, fallbackMessage);
  }
}
