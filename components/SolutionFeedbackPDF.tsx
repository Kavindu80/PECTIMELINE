
import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { Project, BrainstormSolution } from '../types';

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        paddingTop: 40,
        paddingBottom: 40,
        paddingHorizontal: 20,
        fontFamily: 'Helvetica',
        fontSize: 9, // Reduced base font size
    },
    headerPaths: {
        marginBottom: 5, // Reduced
    },
    headerTitle: {
        fontSize: 12, // Reduced
        fontWeight: 'bold',
        textAlign: 'center',
        textTransform: 'uppercase',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        paddingBottom: 2,
        marginBottom: 5, // Reduced
        alignSelf: 'center',
    },
    topGrid: {
        flexDirection: 'row',
        gap: 5, // Reduced gap
        marginBottom: 5, // Reduced
    },
    gridBox: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#000',
    },
    row: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        minHeight: 15, // Reduced height
        alignItems: 'center',
    },
    lastRow: {
        borderBottomWidth: 0,
    },
    labelCell: {
        width: '35%',
        padding: 2, // Reduced padding
        borderRightWidth: 1,
        borderRightColor: '#000',
        backgroundColor: '#f0f0f0',
        fontWeight: 'bold',
        fontSize: 8, // Reduced
    },
    valueCell: {
        flex: 1,
        padding: 2,
        fontSize: 8,
    },
    // Solution Section
    solutionSection: {
        marginTop: 5,
        gap: 10, // Reduced gap
    },
    solutionBlock: {
        flexDirection: 'row',
    },
    solutionNumber: {
        width: 20,
        fontSize: 18, // Reduced
        fontWeight: 'bold',
        paddingTop: 5,
        textAlign: 'center',
    },
    solutionTable: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#000',
    },
    solutionRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        minHeight: 16, // Reduced
        alignItems: 'center', // Align vertically
    },
    colLabel: {
        padding: 2,
        borderRightWidth: 1,
        borderRightColor: '#000',
        backgroundColor: '#f0f0f0',
        fontWeight: 'bold',
        fontSize: 8,
    },
    colValue: {
        padding: 2,
        fontSize: 8,
        flex: 1,
        borderRightWidth: 1,
        borderRightColor: '#000',
    },
    footer: {
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: '#000',
        marginTop: 'auto',
    },
    tickBox: {
        padding: 2,
        width: 15,
        textAlign: 'center',
        borderLeftWidth: 1,
        borderLeftColor: '#000',
    },
});

const DataRow = ({ label, value, showBorder = true }: { label: string, value?: string | number, showBorder?: boolean }) => (
    <View style={[styles.row, !showBorder && styles.lastRow]}>
        <Text style={styles.labelCell}>{label}</Text>
        <Text style={styles.valueCell}>{value || ''}</Text>
        <Text style={styles.tickBox}></Text>
    </View>
);

const SolutionBlock = ({ number, solution }: { number: number, solution?: BrainstormSolution }) => {
    return (
        <View style={styles.solutionBlock}>
            <Text style={styles.solutionNumber}>{number}</Text>
            <View style={styles.solutionTable}>
                {/* Row 1: Requested Solution / Initial Operation */}
                <View style={styles.solutionRow}>
                    <Text style={[styles.colLabel, { width: '25%' }]}>Requested Solution</Text>
                    <Text style={[styles.colValue, { borderRightWidth: 0, flex: 1 }]}>{solution?.solutionText || ''}</Text>
                </View>
                <View style={styles.solutionRow}>
                    <Text style={[styles.colLabel, { width: '25%' }]}>Initial Operation</Text>
                    <Text style={[styles.colValue, { borderRightWidth: 0, flex: 1 }]}>{solution?.operation || ''}</Text>
                </View>

                {/* Row 2: Suggested Solution */}
                <View style={styles.solutionRow}>
                    <Text style={[styles.colLabel, { width: '25%' }]}>Suggested Solution</Text>
                    <Text style={[styles.colValue, { borderRightWidth: 0, flex: 1 }]}>{''}</Text>
                </View>

                {/* Grid Rows for SMV / MC */}
                <View style={[styles.solutionRow, { borderBottomWidth: 1 }]}>
                    <View style={{ flexDirection: 'row', flex: 1 }}>
                        <Text style={[styles.colLabel, { width: '20%' }]}>Costed SMV</Text>
                        <Text style={[styles.colValue, { width: '12%' }]}>{solution?.operationSMV || ''}</Text>

                        <Text style={[styles.colLabel, { width: '20%' }]}>Expected SMV</Text>
                        <Text style={[styles.colValue, { width: '12%' }]}>{solution?.expectedSmv || ''}</Text>

                        <Text style={[styles.colLabel, { width: '18%' }]}>Routed SMV</Text>
                        <Text style={[styles.colValue, { width: '10%' }]}>{solution?.routedSmv || ''}</Text>

                        <Text style={[styles.colLabel, { width: '10%', borderRightWidth: 0 }]}>Saving</Text>
                        <Text style={[styles.colValue, { width: '8%', borderRightWidth: 0 }]}>{solution?.savingSmv || ''}</Text>
                    </View>
                </View>

                <View style={[styles.solutionRow, { borderBottomWidth: 1 }]}>
                    <View style={{ flexDirection: 'row', flex: 1 }}>
                        <Text style={[styles.colLabel, { width: '25%' }]}>Previous MC</Text>
                        <Text style={[styles.colValue, { width: '15%' }]}>{''}</Text>

                        <Text style={[styles.colLabel, { width: '20%' }]}>Expected MC</Text>
                        <Text style={[styles.colValue, { width: '15%' }]}>{''}</Text>

                        <Text style={[styles.colLabel, { width: '15%' }]}>MC Avail.</Text>
                        <Text style={[styles.colValue, { width: '10%', borderRightWidth: 0 }]}>{''}</Text>
                    </View>
                </View>

                {/* Craftsmanship */}
                <View style={[styles.solutionRow, { borderBottomWidth: 1 }]}>
                    <View style={{ flexDirection: 'row', flex: 1 }}>
                        <Text style={[styles.colLabel, { width: '40%' }]}>Previous Craftsmanship Level</Text>
                        <Text style={[styles.colValue, { width: '10%' }]}>{''}</Text>

                        <Text style={[styles.colLabel, { width: '40%' }]}>Expected Craftsmanship Level</Text>
                        <Text style={[styles.colValue, { width: '10%', borderRightWidth: 0 }]}>{''}</Text>
                    </View>
                </View>

                {/* Comment After Completion */}
                <View style={[styles.solutionRow, { minHeight: 30 }]}>
                    <Text style={[styles.colLabel, { width: '25%' }]}>Comment After Completion</Text>
                    <Text style={[styles.colValue, { borderRightWidth: 0, flex: 1 }]}>{''}</Text>
                </View>

                {/* Bottom Row: Routed SMV, SMV Saving, SDH Unlock */}
                <View style={[styles.solutionRow, { borderBottomWidth: 0 }]}>
                    <View style={{ flexDirection: 'row', flex: 1 }}>
                        <Text style={[styles.colLabel, { width: '20%' }]}>Routed SMV</Text>
                        <Text style={[styles.colValue, { width: '13%' }]}>{''}</Text>

                        <Text style={[styles.colLabel, { width: '20%' }]}>SMV Saving</Text>
                        <Text style={[styles.colValue, { width: '13%' }]}>{''}</Text>

                        <Text style={[styles.colLabel, { width: '20%' }]}>SDH Unlock</Text>
                        <Text style={[styles.colValue, { width: '14%', borderRightWidth: 0 }]}>{''}</Text>
                    </View>
                </View>

            </View>
        </View>
    );
};

export const SolutionFeedbackPDF = ({ project }: { project: Project }) => {
    // 1. Get all solutions
    const allSolutions = project.solutions || [];

    // 2. Chunk into groups of 3
    const chunks: (BrainstormSolution | null)[][] = [];
    for (let i = 0; i < Math.max(allSolutions.length, 1); i += 3) {
        const chunk = allSolutions.slice(i, i + 3);
        // Fill the chunk to exactly 3 items with nulls (for empty boxes)
        while (chunk.length < 3) {
            chunk.push(null as any);
        }
        chunks.push(chunk);
    }

    // If no solutions at all, ensure at least one page with 3 empty boxes
    if (chunks.length === 0) {
        chunks.push([null, null, null]);
    }

    return (
        <Document>
            {chunks.map((chunk, pageIndex) => (
                <Page key={pageIndex} size="A4" style={styles.page}>
                    {/* Header */}
                    <View style={styles.headerPaths}>
                        <Text style={styles.headerTitle}>PEC - SOLUTION FEEDBACK SHEET</Text>
                        <Text style={{ position: 'absolute', right: 0, top: 0, fontSize: 8 }}>Style in: {project.styleInDate}</Text>
                    </View>

                    {/* Top Details Grid */}
                    <View style={styles.topGrid}>
                        {/* Left Column */}
                        <View style={styles.gridBox}>
                            <DataRow label="Product" value={project.product} />
                            <DataRow label="Customer" value={project.customer} />
                            <DataRow label="Style No" value={project.styleNo} />
                            <DataRow label="In Date" value={project.styleInDate} />
                            <DataRow label="Due Date" value={project.styleDueDate} showBorder={false} />
                            <DataRow label="Sample" value={project.sampleDate} />
                            <DataRow label="BOM" value={project.bomDate} showBorder={false} />
                        </View>

                        {/* Right Column */}
                        <View style={styles.gridBox}>
                            <DataRow label="Cut & Trims" value={project.cutTrimsDate} />
                            <DataRow label="Construction" value="" />
                            <DataRow label="Construction" value="" />
                            <DataRow label="How to Measure" value="" />
                            <DataRow label="GSD" value="" />
                            <DataRow label="DXF" value={project.dxfDate} />
                            <DataRow label="Pattern Board" value="" showBorder={false} />
                        </View>

                        {/* Far Right Column */}
                        <View style={styles.gridBox}>
                            <DataRow label="FI" value={project.fiDate} />
                            <DataRow label="PP Date" value={project.ppDate} />
                            <DataRow label="PSD" value={project.psdDate} />
                            <DataRow label="Quantity" value={project.orderQty} />
                            <DataRow label="Plant" value={project.plant} />
                            <DataRow label="Sewing T" value={project.sewingTe} />
                            <DataRow label="Pattern T" value={project.patternTe} showBorder={false} />
                        </View>
                    </View>

                    {/* Solutions Section - Render exactly this chunk of 3 */}
                    <View style={styles.solutionSection}>
                        {chunk.map((sol, index) => (
                            <SolutionBlock
                                key={index}
                                // Calculate strict number: (Page Index * 3) + (Index + 1)
                                number={(pageIndex * 3) + (index + 1)}
                                solution={sol || undefined}
                            />
                        ))}
                    </View>
                </Page>
            ))}
        </Document>
    );
};
