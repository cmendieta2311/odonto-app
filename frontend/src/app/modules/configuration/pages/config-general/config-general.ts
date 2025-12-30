import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SystemConfigService } from '../../system-config.service';

@Component({
    selector: 'app-config-general',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './config-general.html'
})
export class ConfigGeneralComponent implements OnInit {
    private fb = inject(FormBuilder);
    private configService = inject(SystemConfigService);

    clinicForm: FormGroup;
    isSaving = false;

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
            },
            error: (err) => console.error('Error loading configs', err)
        });
    }

    save() {
        if (this.clinicForm.invalid) return;

        this.isSaving = true;
        const payload = {
            clinic_info: this.clinicForm.value
        };

        this.configService.saveConfigs(payload).subscribe({
            next: () => {
                this.isSaving = false;
                alert('Configuración guardada correctamente');
            },
            error: (err) => {
                console.error('Error saving configs', err);
                this.isSaving = false;
                alert('Error al guardar la configuración');
            }
        });
    }
}
