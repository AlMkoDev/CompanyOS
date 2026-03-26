export type EmployeeProfileData = Record<string, unknown>;

export function createBlankEmployeeProfileData(): EmployeeProfileData {
  return {
    personal_information: {
      gender: '',
      date_of_birth: '',
      south_african_id_number: '',
      physical_address: '',
      postal_address: '',
      timezone: 'SAST (UTC+2)',
      employee_photo: '',
    },
    employment_details: {
      employee_id: '',
      start_date: '',
      job_title: '',
      work_location: '',
      reports_to: '',
      manager: '',
      bargaining_council: '',
    },
    compensation: {
      basic_salary: '',
      pay_frequency: '',
      currency: 'ZAR',
      bank_name: '',
      account_number: '',
      branch_code: '',
      account_type: '',
      bonus_eligible: '',
      thirteenth_cheque: '',
    },
    tax_and_statutory: {
      tax_number: '',
      paye_reference: '',
      uif_number: '',
      sdl_reference: '',
      work_permit_or_visa: '',
      tax_status: '',
      medical_tax_credit: '',
    },
    benefits_and_statutory_contributions: {
      medical_aid: '',
      medical_aid_number: '',
      main_member: '',
      dependents: '',
      provident_fund: '',
      provider: '',
      employee_contribution: '',
      employer_contribution: '',
      policy_number: '',
      group_life_cover: '',
      income_protection: '',
      funeral_cover: '',
    },
    leave_entitlements: {
      annual_leave: '',
      sick_leave: '',
      family_responsibility_leave: '',
      maternity_leave: '',
      paternity_or_parental_leave: '',
      adoption_leave: '',
      commissioning_parental_leave: '',
      public_holidays: '',
    },
    emergency_contact: {
      primary_contact_name: '',
      primary_relationship: '',
      primary_id_number: '',
      primary_phone: '',
      primary_email: '',
      primary_address: '',
      secondary_contact_name: '',
      secondary_relationship: '',
      secondary_id_number: '',
      secondary_phone: '',
      secondary_email: '',
      secondary_address: '',
    },
    professional_information: {
      education: [],
      skills: [],
      certifications: [],
      professional_memberships: [],
      linkedin: '',
      portfolio: '',
    },
    equipment_and_assets: {
      laptop: '',
      phone: '',
      access_card: '',
      parking_bay: '',
      software_licenses: [],
    },
    performance_and_development: {
      performance_review_date: '',
      next_annual_review: '',
      training_completed: [],
      skills_development: '',
      setA_registration: '',
      learnership_or_internship: '',
      development_goals: [],
    },
    additional_information: {
      languages: [],
      race_classification: '',
      disability_status: '',
      employee_photo_uploaded: false,
      previous_employment: [],
      references: '',
      popia_consent: '',
      background_check: '',
      credit_check: '',
      criminal_record_check: '',
    },
  };
}

export function createAvaEmployeeProfileData(): EmployeeProfileData {
  return {
    personal_information: {
      first_name: 'Ava',
      last_name: 'Ndlovu',
      gender: 'Female',
      date_of_birth: '1995/08/15',
      south_african_id_number: '9508150234087',
      email: 'ava.ndlovu@company.co.za',
      phone: '+27 82 456 7890',
      physical_address: '15 Pine Road, Melville, Johannesburg, 2109, Gauteng',
      postal_address: 'PO Box 12345, Melville, 2109',
      timezone: 'SAST (UTC+2)',
      employee_photo: '[Profile photo uploaded]',
    },
    employment_details: {
      employee_id: 'EMP-2026-0847',
      hire_date: '2026/02/02',
      start_date: '2026/02/02',
      employment_type: 'Permanent Full-time',
      status: 'Probation (ends 2026/08/02)',
      department: 'Product Design',
      position: 'UX Designer',
      job_title: 'Junior UX Designer',
      work_location: 'Hybrid (Johannesburg Office - Sandton - 3 days/week)',
      reports_to: 'Michael Chen (Design Director)',
      manager: 'Sarah Johnson (Senior Design Manager)',
      bargaining_council: 'Not Applicable',
    },
    compensation: {
      basic_salary: 'R420,000 ZAR per annum',
      pay_frequency: 'Monthly',
      currency: 'ZAR (South African Rand)',
      bank_name: 'First National Bank (FNB)',
      account_number: '62********34',
      branch_code: '250655',
      account_type: 'Cheque Account',
      bonus_eligible: 'Yes (up to 10% of annual salary)',
      thirteenth_cheque: 'No',
    },
    tax_and_statutory: {
      tax_number: '9876543210',
      paye_reference: '1234567890',
      uif_number: '1234567890123',
      sdl_reference: '9876543210',
      work_permit_or_visa: 'South African Citizen (ID Holder)',
      tax_status: 'Normal (PAYE applicable)',
      medical_tax_credit: 'Applicable',
    },
    benefits_and_statutory_contributions: {
      medical_aid: 'Discovery Health KeyCare Plus (Employee + Dependants)',
      medical_aid_number: 'DH123456789',
      main_member: 'Ava Ndlovu',
      dependents: '0',
      provident_fund: 'Enrolled',
      provider: 'Old Mutual',
      employee_contribution: '7.5% of pensionable earnings',
      employer_contribution: '7.5% of pensionable earnings',
      policy_number: 'OM987654321',
      group_life_cover: '3x annual salary (R1,260,000)',
      income_protection: '75% of salary',
      funeral_cover: 'R50,000 (Employee), R25,000 (Dependants)',
    },
    leave_entitlements: {
      annual_leave: '21 consecutive days per annum (accrues 1.75 days/month)',
      sick_leave: '30 days per 3-year cycle (10 days per year)',
      family_responsibility_leave: '5 days per annum (after 4 months employment)',
      maternity_leave: '4 consecutive months (unpaid, UIF benefits applicable)',
      paternity_or_parental_leave: '10 consecutive days (UIF benefits applicable)',
      adoption_leave: '10 consecutive weeks',
      commissioning_parental_leave: '10 consecutive weeks',
      public_holidays: '12 per annum (as per South African calendar)',
    },
    emergency_contact: {
      primary_contact_name: 'Thabo Ndlovu',
      primary_relationship: 'Father',
      primary_id_number: '6504125089087',
      primary_phone: '+27 82 123 4567',
      primary_email: 'thabo.ndlovu@email.co.za',
      primary_address: '15 Pine Road, Melville, Johannesburg, 2109',
      secondary_contact_name: 'Lerato Ndlovu',
      secondary_relationship: 'Sister',
      secondary_id_number: '9203150156087',
      secondary_phone: '+27 73 987 6543',
      secondary_email: 'lerato.ndlovu@email.co.za',
      secondary_address: '42 Oxford Road, Rosebank, Johannesburg, 2196',
    },
    professional_information: {
      education: [
        'BA in Visual Communication Design, University of Johannesburg (2017)',
        'Higher Certificate in UX Design, Red & Yellow Creative School of Business (2019)',
      ],
      skills: ['Figma', 'Sketch', 'Adobe Creative Suite', 'User Research', 'Prototyping', 'Wireframing', 'Usability Testing'],
      certifications: [
        'Google UX Design Professional Certificate (2020)',
        'Nielsen Norman Group UX Certification (2021)',
      ],
      professional_memberships: [
        'UXSA (User Experience South Africa) - Member',
        'DSG (Design South Africa) - Associate Member',
      ],
      linkedin: 'linkedin.com/in/avandlovu-ux',
      portfolio: 'avandlovu.design',
    },
    equipment_and_assets: {
      laptop: 'MacBook Pro 14" (Asset No: IT-2026-0847)',
      phone: 'iPhone 15 (Asset No: MOB-2026-0847, Company SIM: 082 456 7890)',
      access_card: '#JHB-0847',
      parking_bay: 'B-42 (Sandton Office)',
      software_licenses: ['Figma Pro', 'Adobe CC', 'Miro', 'Notion', 'Slack'],
    },
    performance_and_development: {
      performance_review_date: '2026/08/02 (6-month probation review)',
      next_annual_review: '2027/02/02',
      training_completed: [
        'POPIA Compliance & Data Protection (2026/02/05)',
        'Cybersecurity Awareness (2026/02/03)',
        'Company Induction & Code of Conduct (2026/02/02)',
        'Employment Equity & Diversity (2026/02/02)',
      ],
      skills_development: 'Master advanced prototyping, lead first design project by Q3 2026, obtain NN/g certification',
      setA_registration: 'Services SETA',
      learnership_or_internship: 'N/A',
      development_goals: [
        'Master advanced prototyping',
        'Lead first design project by Q3 2026',
        'Obtain NN/g certification',
      ],
    },
    additional_information: {
      languages: ['isiZulu (Home Language)', 'English (Fluent - Business Proficiency)', 'Afrikaans (Conversational)', 'Sesotho (Basic)'],
      race_classification: 'Black African',
      disability_status: 'No disability declared',
      employee_photo_uploaded: true,
      previous_employment: [
        'Freelance UX Designer (2020-2026) - Clients: Takealot, Discovery, Standard Bank',
        'Junior Designer at Creative Studio Johannesburg (2017-2020) - Agency specializing in digital products for SA market',
      ],
      references: 'Available upon request (3 professional references)',
      popia_consent: 'Granted (2026/02/02)',
      background_check: 'Completed and cleared (2026/01/28)',
      credit_check: 'Not required for this role',
      criminal_record_check: 'Cleared (2026/01/28)',
    },
  };
}

export function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

export function parseProfileData(text: string) {
  if (!text.trim()) {
    return null;
  }

  return JSON.parse(text) as EmployeeProfileData;
}

export function stringifyProfileData(data: EmployeeProfileData | null | undefined) {
  if (!data) {
    return JSON.stringify(createBlankEmployeeProfileData(), null, 2);
  }

  return JSON.stringify(data, null, 2);
}
