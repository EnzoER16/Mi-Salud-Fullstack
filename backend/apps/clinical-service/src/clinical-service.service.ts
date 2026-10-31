import { Injectable } from '@nestjs/common';

@Injectable()
export class ClinicalServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
