'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, FileText, Printer } from 'lucide-react';

export default function PayslipsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock Payslips Data
  const payslips = [
    { id: '1', empName: 'John Doe', period: 'Mar 2025', net: 40120, juris: 'KE', status: 'paid' },
    { id: '2', empName: 'Jane Smith', period: 'Mar 2025', net: 65620, juris: 'KE', status: 'paid' },
    { id: '3', empName: 'Alice Jones', period: 'Mar 2025', net: 89220, juris: 'KE', status: 'paid' },
    { id: '4', empName: 'John Doe', period: 'Feb 2025', net: 40120, juris: 'KE', status: 'paid' },
    { id: '5', empName: 'Jane Smith', period: 'Feb 2025', net: 65620, juris: 'KE', status: 'paid' },
    { id: '6', empName: 'David Nkomo', period: 'Feb 2025', net: 15300, juris: 'ZA', status: 'paid' },
  ];

  const filtered = payslips.filter(p => p.empName.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payslips History & Viewer</h1>
          <p className="text-muted-foreground">Search, view, and print historical payslips across jurisdictions.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="bg-muted/30 border-b pb-4">
          <div className="flex gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by Employee Name..."
                className="pl-8 bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select defaultValue="all">
               <SelectTrigger className="w-[180px] bg-white">
                  <SelectValue placeholder="Period" />
               </SelectTrigger>
               <SelectContent>
                  <SelectItem value="all">All Periods</SelectItem>
                  <SelectItem value="2025-03">March 2025</SelectItem>
                  <SelectItem value="2025-02">February 2025</SelectItem>
               </SelectContent>
            </Select>
             <Select defaultValue="all">
               <SelectTrigger className="w-[180px] bg-white">
                  <SelectValue placeholder="Jurisdiction" />
               </SelectTrigger>
               <SelectContent>
                  <SelectItem value="all">All Jurisdictions</SelectItem>
                  <SelectItem value="KE">Kenya</SelectItem>
                  <SelectItem value="ZA">South Africa</SelectItem>
                  <SelectItem value="ZW">Zimbabwe</SelectItem>
               </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground border-b">
              <tr>
                <th className="p-4 font-medium">Employee Name</th>
                <th className="p-4 font-medium">Period</th>
                <th className="p-4 font-medium">Jurisdiction</th>
                <th className="p-4 font-medium">Net Pay</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ps) => (
                <tr key={ps.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="p-4 font-medium flex items-center gap-3">
                     <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs">
                        {ps.empName.split(' ').map(n=>n[0]).join('')}
                     </div>
                     {ps.empName}
                  </td>
                  <td className="p-4 text-muted-foreground">{ps.period}</td>
                  <td className="p-4"><Badge variant="outline">{ps.juris}</Badge></td>
                  <td className="p-4 font-semibold">${ps.net.toLocaleString()}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                       <Button variant="ghost" size="sm" className="h-8 group-hover:bg-white text-blue-600 hover:text-blue-700">
                         <FileText className="mr-2 h-4 w-4" /> View full PDF
                       </Button>
                       <Button variant="ghost" size="icon" className="h-8 hover:bg-slate-200" title="Print Payslip">
                          <Printer className="h-4 w-4 text-slate-500" />
                       </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
      
    </div>
  );
}
