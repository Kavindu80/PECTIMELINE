
import React from 'react';
import { Project } from '../types';

interface SolutionFeedbackSheetProps {
    project: Project;
}

export const SolutionFeedbackSheet = React.forwardRef<HTMLDivElement, SolutionFeedbackSheetProps>(({ project }, ref) => {
    return (
        <div ref={ref} className="print-content w-full max-w-[210mm] mx-auto bg-white p-8 text-black" style={{ fontFamily: 'Arial, sans-serif' }}>
            <style type="text/css" media="print">
                {`
                  @page { size: auto; margin: 0mm; }
                  body { margin: 0mm; }
                `}
            </style>

            {/* Header - No top border line */}
            <div className="text-center mb-8">
                <h1 className="text-xl font-bold uppercase tracking-wide border-b-2 border-black inline-block pb-1">PEC - SOLUTION FEEDBACK SHEET</h1>
            </div>

            {/* Top Details Grid - Two Boxes Side by Side */}
            <div className="flex gap-4 mb-6 items-start">
                {/* Left Box - No border below Due Date */}
                <div className="flex-1 border-2 border-black">
                    <table className="w-full border-collapse">
                        <tbody>
                            <TableRow label="Product" value={project.product} showBorder />
                            <TableRow label="Customer" value={project.customer} showBorder />
                            <TableRow label="Style No" value={project.styleNo} showBorder />
                            <TableRow label="In Date" value={project.styleInDate} showBorder />
                            <TableRow label="Due Date" value={project.styleDueDate || project.cutRequiredDate} showBorder={false} />
                        </tbody>
                    </table>
                </div>

                {/* Right Box */}
                <div className="flex-1 border-2 border-black">
                    <table className="w-full border-collapse">
                        <tbody>
                            <TableRow label="Cut & Trims" value={project.cutHandoverDate} showBorder />
                            <TableRow label="FI" value={project.fiDate} showBorder />
                            <TableRow label="PP Date" value={project.ppDate} showBorder />
                            <TableRow label="PSD" value={project.psdDate} showBorder />
                            <TableRow label="Quantity" value={project.orderQty} showBorder />
                            <TableRow label="Plant" value={project.plant} showBorder />
                            <TableRow label="Sewing T" value={project.sewing} showBorder />
                            <TableRow label="Pattern T" value={project.mechanic} showBorder={false} />
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Solutions Section */}
            <div className="space-y-6">
                {project.solutions && project.solutions.length > 0 ? (
                    project.solutions.map((sol, index) => (
                        <div key={sol.id} className="relative">
                            {/* Solution Number */}
                            <div className="absolute -left-8 top-2 font-bold text-2xl">{index + 1}</div>

                            {/* Solution Table */}
                            <div className="border-2 border-black">
                                <table className="w-full border-collapse">
                                    <tbody>
                                        <TableRow label="Requested Solution" value={sol.solutionText} isBold showBorder />
                                        <TableRow label="Costed SMV" value={sol.operationSMV} showBorder />
                                        <TableRow label="Expected SMV" value={sol.expectedSmv} showBorder />
                                        <TableRow label="Routed SMV" value={sol.routedSmv} showBorder />
                                        <TableRow label="SMV Saving" value={sol.savingSmv} showBorder={false} />
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="border-2 border-black p-4 text-center italic text-gray-500">No solutions added.</div>
                )}
            </div>

        </div>
    );
});

// Helper Table Row Component
const TableRow = ({ label, value, isBold = false, showBorder = true }: { label: string, value?: string | number, isBold?: boolean, showBorder?: boolean }) => (
    <tr>
        <td className={`p-2 font-bold border-r border-black text-sm bg-gray-50 w-[120px] ${showBorder ? 'border-b border-black' : ''}`}>{label}</td>
        <td className={`p-2 text-sm ${isBold ? 'font-bold' : ''} ${showBorder ? 'border-b border-black' : ''}`}>{value || ''}</td>
    </tr>
);


