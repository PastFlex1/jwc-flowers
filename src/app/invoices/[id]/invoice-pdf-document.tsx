'use client';

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { format, parseISO } from 'date-fns';
import type { Invoice, Customer, Consignatario } from '@/lib/types';

// Create styles
const styles = StyleSheet.create({
  page: {
    // NOTE: Using default fonts for stability.
    fontSize: 10,
    padding: 40,
    color: '#333',
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
    paddingBottom: 10,
  },
  headerLeft: {
    flexDirection: 'column',
  },
  headerRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  invoiceTitle: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: '#166534', // primary
  },
  invoiceNumber: {
    color: '#71717a', // muted-foreground
  },
  companyName: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
  },
  section: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  billTo: {
    flexDirection: 'column',
  },
  dateInfo: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  address: {
    fontStyle: 'normal',
    color: '#71717a',
  },
  sectionTitle: {
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  table: {
    display: "flex",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0
  },
  tableRow: {
    margin: "auto",
    flexDirection: "row"
  },
  tableColHeader: {
    width: "20%",
    borderStyle: "solid",
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
    backgroundColor: '#f4f4f5', // secondary
    padding: 5,
    fontFamily: 'Helvetica-Bold',
  },
  tableCol: {
    width: "20%",
    borderStyle: "solid",
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
    padding: 5,
  },
  tableCell: {
    margin: "auto",
    marginTop: 5,
    fontSize: 10
  },
  tableCellDesc: {
    fontSize: 9,
    color: '#71717a'
  },
  totals: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  totalsContainer: {
    width: '40%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  totalLabel: {
    color: '#71717a',
  },
  totalAmount: {},
  grandTotal: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
  },
  grandTotalAmount: {
    color: '#166534',
  },
  separator: {
    height: 1,
    backgroundColor: '#eaeaea',
    marginVertical: 10,
  }
});


type InvoicePDFDocumentProps = {
    invoice: Invoice;
    customer: Customer | null;
    consignatario: Consignatario | null;
  };

export function InvoicePDFDocument({ invoice, customer, consignatario }: InvoicePDFDocumentProps) {
    
  const subtotal = invoice.items.reduce((acc, item) => {
    const totalStems = (item.stemCount || 0) * (item.bunchCount || 0);
    return acc + ((item.salePrice || 0) * totalStems);
  }, 0);
  const tax = subtotal * 0.12;
  const total = subtotal + tax;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
            <View style={styles.headerLeft}>
                <Text style={styles.invoiceTitle}>INVOICE</Text>
                <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
            </View>
            <View style={styles.headerRight}>
                <Text style={styles.companyName}>JCW Flowers</Text>
                <Text style={styles.invoiceNumber}>Cayambe, Ecuador</Text>
            </View>
        </View>

        <View style={styles.section}>
            <View style={styles.billTo}>
                <Text style={styles.sectionTitle}>Bill To:</Text>
                <Text style={styles.address}>{consignatario ? consignatario.nombreConsignatario : customer?.name}</Text>
                {consignatario ? (
                    <>
                        <Text style={styles.address}>{consignatario.direccion}</Text>
                        <Text style={styles.address}>{`${consignatario.provincia}, ${consignatario.pais}`}</Text>
                    </>
                ) : (
                    customer?.address.split(',').map(line => <Text key={line} style={styles.address}>{line.trim()}</Text>)
                )}
                {customer?.email && <Text style={styles.address}>{customer.email}</Text>}
            </View>
            <View style={styles.dateInfo}>
                <Text style={styles.sectionTitle}>Issue Date:</Text>
                <Text style={styles.address}>{format(parseISO(invoice.farmDepartureDate), 'PPP')}</Text>
                <Text style={{...styles.sectionTitle, marginTop: 4}}>Due Date:</Text>
                <Text style={styles.address}>{format(parseISO(invoice.flightDate), 'PPP')}</Text>
            </View>
        </View>
        
        {/* Table Header */}
        <View style={styles.tableRow}>
            <View style={{...styles.tableColHeader, width: '40%'}}><Text style={styles.tableCell}>Descripción</Text></View>
            <View style={{...styles.tableColHeader, width: '15%', textAlign: 'center'}}><Text style={styles.tableCell}>Cajas</Text></View>
            <View style={{...styles.tableColHeader, width: '15%', textAlign: 'center'}}><Text style={styles.tableCell}>Total Tallos</Text></View>
            <View style={{...styles.tableColHeader, width: '15%', textAlign: 'right'}}><Text style={styles.tableCell}>Precio Unit.</Text></View>
            <View style={{...styles.tableColHeader, width: '15%', textAlign: 'right'}}><Text style={styles.tableCell}>Total</Text></View>
        </View>

        {/* Table Body */}
        {invoice.items.map((item, index) => {
            const totalStems = (item.stemCount || 0) * (item.bunchCount || 0);
            const itemTotal = (item.salePrice || 0) * totalStems;
            return (
                <View key={index} style={styles.tableRow}>
                    <View style={{...styles.tableCol, width: '40%'}}>
                        <Text style={{...styles.tableCell, fontFamily: 'Helvetica-Bold'}}>{item.description}</Text>
                        <Text style={{...styles.tableCell, ...styles.tableCellDesc}}>
                            {item.boxCount} {item.boxType.toUpperCase()} / {item.bunchCount} Bunches / {item.length}cm
                        </Text>
                    </View>
                    <View style={{...styles.tableCol, width: '15%', textAlign: 'center'}}><Text style={styles.tableCell}>{item.boxCount}</Text></View>
                    <View style={{...styles.tableCol, width: '15%', textAlign: 'center'}}><Text style={styles.tableCell}>{totalStems}</Text></View>
                    <View style={{...styles.tableCol, width: '15%', textAlign: 'right'}}><Text style={styles.tableCell}>${item.salePrice?.toFixed(2)}</Text></View>
                    <View style={{...styles.tableCol, width: '15%', textAlign: 'right'}}><Text style={styles.tableCell}>${itemTotal.toFixed(2)}</Text></View>
                </View>
            )
        })}

        <View style={styles.totals}>
            <View style={styles.totalsContainer}>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Subtotal</Text>
                    <Text style={styles.totalAmount}>${subtotal.toFixed(2)}</Text>
                </View>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>IVA (12%)</Text>
                    <Text style={styles.totalAmount}>${tax.toFixed(2)}</Text>
                </View>
                <View style={styles.separator} />
                <View style={{...styles.totalRow, ...styles.grandTotal}}>
                    <Text>Total</Text>
                    <Text style={styles.grandTotalAmount}>${total.toFixed(2)}</Text>
                </View>
            </View>
        </View>
      </Page>
    </Document>
  )
}
