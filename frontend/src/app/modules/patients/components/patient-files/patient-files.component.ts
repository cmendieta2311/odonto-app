import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface PatientFile {
    id: string;
    name: string;
    size: string;
    type: string;
    uploadDate: Date;
    url?: string;
}

@Component({
    selector: 'app-patient-files',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './patient-files.html'
})
export class PatientFilesComponent {
    files: PatientFile[] = [
        {
            id: '1',
            name: 'Radiografía Panorámica.jpg',
            size: '2.4 MB',
            type: 'image/jpeg',
            uploadDate: new Date('2023-10-15')
        },
        {
            id: '2',
            name: 'Consentimiento Informado.pdf',
            size: '156 KB',
            type: 'application/pdf',
            uploadDate: new Date('2023-10-15')
        }
    ];

    onFileSelected(event: any) {
        const fileList: FileList = event.target.files;
        if (fileList.length > 0) {
            const file = fileList[0];
            // Mock upload
            setTimeout(() => {
                this.files.unshift({
                    id: Math.random().toString(36).substr(2, 9),
                    name: file.name,
                    size: this.formatSize(file.size),
                    type: file.type,
                    uploadDate: new Date()
                });
            }, 500);
        }
    }

    deleteFile(id: string) {
        if (confirm('¿Estás seguro de eliminar este archivo?')) {
            this.files = this.files.filter(f => f.id !== id);
        }
    }

    formatSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}
