import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand, CreateBucketCommand, HeadBucketCommand, PutBucketPolicyCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

@Injectable()
export class StorageService implements OnModuleInit {
    private s3Client: S3Client;
    private readonly bucketName = 'sgodonto-public';
    private readonly logger = new Logger(StorageService.name);

    constructor() {
        this.s3Client = new S3Client({
            region: 'us-east-1', // MinIO requires a region, though it doesn't matter much
            endpoint: process.env.S3_ENDPOINT || 'http://minio:9000',
            forcePathStyle: true, // Required for MinIO
            credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
                secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin',
            },
        });
    }

    async onModuleInit() {
        await this.ensureBucketExists();
        await this.configurePublicPolicy();
    }

    private async ensureBucketExists() {
        try {
            await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucketName }));
            this.logger.log(`Bucket ${this.bucketName} exists.`);
        } catch (error) {
            this.logger.log(`Bucket ${this.bucketName} not found. Creating...`);
            try {
                await this.s3Client.send(new CreateBucketCommand({ Bucket: this.bucketName }));
                this.logger.log(`Bucket ${this.bucketName} created.`);
            } catch (createError) {
                this.logger.error(`Failed to create bucket: ${createError.message}`);
            }
        }
    }

    private async configurePublicPolicy() {
        try {
            const policy = {
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Principal: { AWS: ['*'] },
                        Action: ['s3:GetObject'],
                        Resource: [`arn:aws:s3:::${this.bucketName}/*`],
                    },
                ],
            };

            await this.s3Client.send(new PutBucketPolicyCommand({
                Bucket: this.bucketName,
                Policy: JSON.stringify(policy),
            }));
            this.logger.log(`Public policy applied to bucket ${this.bucketName}.`);
        } catch (error) {
            this.logger.error(`Failed to apply bucket policy: ${error.message}`);
        }
    }

    async uploadFile(file: Express.Multer.File, key: string): Promise<string> {
        try {
            const upload = new Upload({
                client: this.s3Client,
                params: {
                    Bucket: this.bucketName,
                    Key: key,
                    Body: file.buffer,
                    ContentType: file.mimetype,
                },
            });

            await upload.done();

            // Construct public URL
            // If running in docker, the endpoint 'minio:9000' is internal. 
            // The browser needs an external URL. Ideally this should be configured via env var.
            // For dev/test we can assume localhost:9000 if accessed from host, or a proxied URL.
            const publicEndpoint = process.env.S3_PUBLIC_ENDPOINT || 'http://localhost:9000';
            return `${publicEndpoint}/${this.bucketName}/${key}`;
        } catch (error) {
            this.logger.error(`Upload failed: ${error.message}`);
            throw error;
        }
    }

    async deleteFile(key: string): Promise<void> {
        try {
            await this.s3Client.send(new DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            }));
            this.logger.log(`Deleted file: ${key}`);
        } catch (error) {
            this.logger.error(`Failed to delete file ${key}: ${error.message}`);
            // We don't throw here to avoid blocking the main flow if cleanup fails
        }
    }
}
