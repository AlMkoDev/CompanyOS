import { IPayrollEngine } from './payroll-engine.interface';
import { KenyaPayrollEngine } from './kenya.engine';
import { SouthAfricaPayrollEngine } from './south-africa.engine';
import { ZimbabwePayrollEngine } from './zimbabwe.engine';

export class PayrollEngineFactory {
  static getEngine(countryCode: string): IPayrollEngine {
    switch (countryCode.toUpperCase()) {
      case 'KE':
        return new KenyaPayrollEngine();
      case 'ZA':
        return new SouthAfricaPayrollEngine();
      case 'ZW':
        return new ZimbabwePayrollEngine();
      default:
        throw new Error(`Jurisdiction '${countryCode}' not supported`);
    }
  }
}
