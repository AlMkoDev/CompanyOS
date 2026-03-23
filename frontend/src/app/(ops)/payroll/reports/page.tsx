'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, TrendingUp } from 'lucide-react';

export default function PayrollReportsPage() {
  const [selectedJurisdiction, setSelectedJurisdiction] = useState('KE');
  
  return (
    <div className="space-y-6 max-w-6xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payroll Reports</h1>
          <p className="text-muted-foreground">Generate statutory remittance schedules and year-end compliance reporting.</p>
        </div>
        <div className="flex items-center gap-2">
           <Select value={selectedJurisdiction} onValueChange={(value) => setSelectedJurisdiction(value || '')}>
               <SelectTrigger className="w-[180px] bg-white">
                  <SelectValue placeholder="Jurisdiction" />
               </SelectTrigger>
               <SelectContent>
                  <SelectItem value="KE">Kenya</SelectItem>
                  <SelectItem value="ZA">South Africa</SelectItem>
                  <SelectItem value="ZW">Zimbabwe</SelectItem>
               </SelectContent>
            </Select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Monthly Statutory Reports */}
        <Card>
          <CardHeader>
             <div className="flex items-center gap-2 mb-2 text-brand-navy">
               <TrendingUp className="h-5 w-5" />
               <CardTitle>Monthly Statutory Remittance</CardTitle>
             </div>
            <CardDescription>Generate CSV and PDF schedules for monthly statutory bodies based on the selected jurisdiction.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Select Month & Year</label>
                <div className="flex gap-2">
                  <Select defaultValue="03">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                       <SelectItem value="02">February</SelectItem>
                       <SelectItem value="03">March</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select defaultValue="2025">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                       <SelectItem value="2025">2025</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
             </div>
             
             <div className="pt-4 space-y-3">
               {selectedJurisdiction === 'KE' && (
                 <>
                   <Button variant="outline" className="w-full justify-start text-left bg-white">
                     <FileText className="mr-2 h-4 w-4 text-blue-600" /> Download KRA PAYE Return (CSV)
                   </Button>
                   <Button variant="outline" className="w-full justify-start text-left bg-white">
                     <FileText className="mr-2 h-4 w-4 text-green-600" /> Download NSSF Return (Excel)
                   </Button>
                   <Button variant="outline" className="w-full justify-start text-left bg-white">
                     <FileText className="mr-2 h-4 w-4 text-red-600" /> Download NHIF Byproduct (Excel)
                   </Button>
                 </>
               )}
               {selectedJurisdiction === 'ZA' && (
                 <>
                   <Button variant="outline" className="w-full justify-start text-left bg-white">
                     <FileText className="mr-2 h-4 w-4 text-orange-600" /> Download SARS EMP201 (PDF)
                   </Button>
                   <Button variant="outline" className="w-full justify-start text-left bg-white">
                     <FileText className="mr-2 h-4 w-4 text-blue-600" /> Download UIF Declaration (UI-19)
                   </Button>
                 </>
               )}
               {selectedJurisdiction === 'ZW' && (
                 <>
                   <Button variant="outline" className="w-full justify-start text-left bg-white">
                     <FileText className="mr-2 h-4 w-4 text-blue-600" /> Download ZIMRA PAYE Return (P2)
                   </Button>
                   <Button variant="outline" className="w-full justify-start text-left bg-white">
                     <FileText className="mr-2 h-4 w-4 text-green-600" /> Download NSSA Form P4
                   </Button>
                 </>
               )}
             </div>
          </CardContent>
        </Card>

        {/* Year-End Reports */}
        <Card>
          <CardHeader>
             <div className="flex items-center gap-2 mb-2 text-brand-navy">
               <FileText className="h-5 w-5" />
               <CardTitle>Year-End Reports</CardTitle>
             </div>
            <CardDescription>Generate annual employee tax certificates and company reconciliation summaries.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Select Tax Year</label>
                <Select defaultValue="2025">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                     <SelectItem value="2024">2024</SelectItem>
                     <SelectItem value="2025">2025</SelectItem>
                  </SelectContent>
                </Select>
             </div>
             
             <div className="pt-4 space-y-3">
               {selectedJurisdiction === 'KE' && (
                 <>
                   <Button variant="outline" className="w-full justify-start text-left border-blue-200 hover:bg-blue-50">
                     <Download className="mr-2 h-4 w-4 text-blue-600" /> Generate Employee P9 Forms (ZIP)
                   </Button>
                   <Button variant="outline" className="w-full justify-start text-left">
                     <FileText className="mr-2 h-4 w-4" /> KRA P10 Employers Certificate
                   </Button>
                 </>
               )}
               {selectedJurisdiction === 'ZA' && (
                 <>
                   <Button variant="outline" className="w-full justify-start text-left border-blue-200 hover:bg-blue-50">
                     <Download className="mr-2 h-4 w-4 text-orange-600" /> Generate IRP5/IT3(a) Certificates
                   </Button>
                   <Button variant="outline" className="w-full justify-start text-left">
                     <FileText className="mr-2 h-4 w-4" /> EMP501 Reconciliation
                   </Button>
                 </>
               )}
               {selectedJurisdiction === 'ZW' && (
                 <>
                   <Button variant="outline" className="w-full justify-start text-left border-blue-200 hover:bg-blue-50">
                     <Download className="mr-2 h-4 w-4 text-blue-600" /> Generate ITF 16 Certificates
                   </Button>
                 </>
               )}
             </div>
          </CardContent>
        </Card>
      </div>
      
    </div>
  );
}
