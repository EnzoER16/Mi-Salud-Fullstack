import { Test, TestingModule } from '@nestjs/testing';
import { ClinicalServiceController } from './clinical-service.controller';
import { ClinicalServiceService } from './clinical-service.service';

describe('ClinicalServiceController', () => {
  let clinicalServiceController: ClinicalServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ClinicalServiceController],
      providers: [ClinicalServiceService],
    }).compile();

    clinicalServiceController = app.get<ClinicalServiceController>(ClinicalServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(clinicalServiceController.getHello()).toBe('Hello World!');
    });
  });
});
