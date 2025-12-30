import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './register.html',
    styleUrl: './register.css'
})
export class RegisterComponent {
    registerForm: FormGroup;
    showPassword = false;
    isSubmitting = false;

    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private router = inject(Router);

    constructor() {
        this.registerForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(2)]],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]]
        });
    }

    togglePasswordVisibility() {
        this.showPassword = !this.showPassword;
    }

    onSubmit() {
        if (this.registerForm.valid) {
            this.isSubmitting = true;
            const { name, email, password } = this.registerForm.value;

            this.authService.register({ name, email, password }).subscribe({
                next: () => {
                    // Auto login or redirect to login page
                    alert('Registro exitoso. Por favor inicia sesión.');
                    this.router.navigate(['/login']);
                },
                error: (err) => {
                    console.error('Registration error', err);
                    alert('Error al registrar. Intente nuevamente.');
                    this.isSubmitting = false;
                }
            });
        } else {
            this.registerForm.markAllAsTouched();
        }
    }
}
