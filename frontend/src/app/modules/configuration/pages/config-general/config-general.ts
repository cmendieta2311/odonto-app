import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SystemConfigService } from '../../system-config.service';
import { NotificationService } from '../../../../shared/services/notification.service';

@Component({
    selector: 'app-config-general',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './config-general.html'
})
export class ConfigGeneralComponent implements OnInit {
    private fb = inject(FormBuilder);
    private configService = inject(SystemConfigService);
    private notificationService = inject(NotificationService);

    clinicForm: FormGroup;
    isSaving = false;
    logoUrl: string | null = null;

    constructor() {
        this.clinicForm = this.fb.group({
            businessName: [''],
            ruc: [''],
            phone: [''],
            email: ['', [Validators.email]],
            address: ['']
        });
    }

    ngOnInit() {
        this.loadConfigs();
    }

    loadConfigs() {
        this.configService.getConfigs().subscribe({
            next: (configs) => {
                if (configs['clinic_info']) {
                    this.clinicForm.patchValue(configs['clinic_info']);
                }
                if (configs['clinicLogoUrl']) {
                    this.logoUrl = configs['clinicLogoUrl'];
                }
            },
            error: (err) => {
                console.error('Error loading configs', err);
                this.notificationService.showError('Error al cargar la configuración');
            }
        });
    }

    triggerFileInput() {
        const fileInput = document.getElementById('logoInput') as HTMLInputElement;
        if (fileInput) {
            fileInput.click();
        }
    }

    onFileSelected(event: any) {
        const file = event.target.files[0];
        if (file) {
            this.configService.uploadLogo(file).subscribe({
                next: (res) => {
                    this.logoUrl = res.url;
                    this.notificationService.showSuccess('Logo actualizado correctamente');
                },
                error: (err) => {
                    console.error('Upload failed', err);
                    this.notificationService.showError('Error al subir el logo');
                }
            });
        }
    }

    save() {
        if (this.clinicForm.invalid) return;

        this.isSaving = true;
        const payload = {
            clinic_info: this.clinicForm.value,
            clinicLogoUrl: this.logoUrl // Ensure it persists if saving overwrites
        };

        this.configService.saveConfigs(payload).subscribe({
            next: () => {
                this.isSaving = false;
                this.notificationService.showSuccess('Configuración guardada correctamente');
            },
            error: (err) => {
                console.error('Error saving configs', err);
                this.isSaving = false;
                this.notificationService.showError('Error al guardar la configuración');
            }
        });
    }
}
