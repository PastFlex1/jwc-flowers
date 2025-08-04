'use client';

import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { format, parseISO } from 'date-fns';
import type { Invoice, Customer, Consignatario, Carguera, Pais } from '@/lib/types';

// Register font
Font.register({
  family: 'Alegreya',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/alegreya/v35/4UaBrEBBsBhlBjvfkRLm69jo_I0.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/alegreya/v35/4UaGrEBBsBhlBjvfkSoSg5-j_I4.ttf', fontWeight: 700 },
  ],
});

// Create styles
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Alegreya',
    fontSize: 8,
    padding: 40,
    backgroundColor: '#fff',
    color: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerLeft: {
    width: '50%',
  },
  headerRight: {
    width: '50%',
    alignItems: 'flex-end',
  },
  logo: {
    width: 150,
    marginBottom: 10,
  },
  companyInfo: {
    border: '1pt solid #ccc',
    padding: 5,
    fontSize: 8,
  },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  invoiceInfoTable: {
    width: 200,
    border: '1pt solid #ccc',
  },
  infoTableRow: {
    flexDirection: 'row',
    borderBottom: '1pt solid #ccc',
  },
  infoTableCellLabel: {
    width: '35%',
    padding: 3,
    fontWeight: 'bold',
    borderRight: '1pt solid #ccc',
  },
  infoTableCellValue: {
    width: '65%',
    padding: 3,
    textAlign: 'center',
  },
  awbTable: {
    width: 200,
    border: '1pt solid #ccc',
    marginTop: 10
  },
  clientInfo: {
    border: '1pt solid #ccc',
    padding: 5,
    marginBottom: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  clientInfoItem: {
    width: '50%',
    flexDirection: 'row',
    marginBottom: 2,
  },
  clientInfoLabel: {
    fontWeight: 'bold',
    width: 80,
  },
  clientInfoValue: {
    flex: 1,
  },
  table: {
    width: '100%',
    border: '1pt solid #ccc',
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1pt solid #ccc',
  },
  tableHeader: {
    backgroundColor: '#f2f2f2',
    fontWeight: 'bold',
  },
  tableCol: {
    borderRight: '1pt solid #ccc',
    padding: 3,
    fontSize: 7,
    textAlign: 'center'
  },
  colCajas: { width: '6%' },
  colTipoCaja: { width: '9%' },
  colNombreFlor: { width: '15%', textAlign: 'left' },
  colVariedad: { width: '15%', textAlign: 'left' },
  colColor: { width: '10%', textAlign: 'left' },
  colLongitud: { width: '8%' },
  colTallos: { width: '9%' },
  colBunches: { width: '8%' },
  colPrecio: { width: '8%', textAlign: 'right' },
  colTotal: { width: '12%', textAlign: 'right', fontWeight: 'bold' },
  totalsRow: {
    backgroundColor: '#f8f8f8',
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  footerText: {
    width: '60%',
    fontSize: 7,
  },
  footerTotal: {
    width: '35%',
  },
  totalFobTable: {
    width: '100%',
    border: '1pt solid #ccc',
  },
  totalFobRow: {
    flexDirection: 'row',
  },
  totalFobLabel: {
    width: '50%',
    padding: 4,
    fontWeight: 'bold',
    borderRight: '1pt solid #ccc',
  },
  totalFobValue: {
    width: '50%',
    padding: 4,
    fontWeight: 'bold',
    textAlign: 'right'
  }
});

type InvoicePdfDocumentProps = {
  invoice: Invoice;
  customer: Customer | null;
  consignatario: Consignatario | null;
  carguera: Carguera | null;
  pais: Pais | null;
};

export const InvoicePdfDocument = ({ invoice, customer, carguera, pais }: InvoicePdfDocumentProps) => {

  const totals = invoice.items.reduce((acc, item) => {
      let itemBoxes = item.boxNumber;
      let itemBunches = 0;
      let itemStems = 0;
      let itemFob = 0;

      item.bunches.forEach(bunch => {
          const bunchesCount = Number(bunch.bunches) || 0;
          const stemsPerBunch = Number(bunch.stemsPerBunch) || 0;
          const salePrice = Number(bunch.salePrice) || 0;
          
          itemBunches += bunchesCount;
          const stemsInBunch = bunchesCount * stemsPerBunch;
          itemStems += stemsInBunch;
          itemFob += stemsInBunch * salePrice;
      });

      acc.totalBoxes += itemBoxes;
      acc.totalBunches += itemBunches;
      acc.totalStems += itemStems;
      acc.totalFob += itemFob;
      
      return acc;
  }, { totalBoxes: 0, totalBunches: 0, totalStems: 0, totalFob: 0 });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image style={styles.logo} src="/logo.png" />
            <View style={styles.companyInfo}>
              <Text>E-MAIL: jcwf@outlook.es</Text>
              <Text>PHONE: +593 096 744 1343</Text>
              <Text>ADDRESS: Pasaje F y Calle Quito, EL QUINCHE - QUITO - ECUADOR</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <View style={styles.invoiceInfoTable}>
              <View style={styles.infoTableRow}>
                <Text style={styles.infoTableCellLabel}>DATE:</Text>
                <Text style={styles.infoTableCellValue}>{format(parseISO(invoice.flightDate), 'MM/dd/yyyy')}</Text>
              </View>
              <View style={[styles.infoTableRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.infoTableCellLabel}>No.</Text>
                <Text style={[styles.infoTableCellValue, { fontSize: 12, fontWeight: 'bold' }]}>{invoice.invoiceNumber}</Text>
              </View>
            </View>
            <View style={styles.awbTable}>
               <View style={styles.infoTableRow}>
                <Text style={styles.infoTableCellLabel}>AWB:</Text>
                <Text style={styles.infoTableCellValue}>{invoice.masterAWB}</Text>
              </View>
              <View style={[styles.infoTableRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.infoTableCellLabel}>HAWB:</Text>
                <Text style={styles.infoTableCellValue}>{invoice.houseAWB}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Client Info */}
        <View style={styles.clientInfo}>
            <View style={styles.clientInfoItem}><Text style={styles.clientInfoLabel}>Name Client:</Text><Text style={styles.clientInfoValue}>{customer?.name}</Text></View>
            <View style={styles.clientInfoItem}><Text style={styles.clientInfoLabel}>Mark:</Text><Text style={styles.clientInfoValue}>{invoice.reference}</Text></View>
            <View style={styles.clientInfoItem}><Text style={styles.clientInfoLabel}>Agency:</Text><Text style={styles.clientInfoValue}>{carguera?.nombreCarguera}</Text></View>
            <View style={styles.clientInfoItem}><Text style={styles.clientInfoLabel}>Address:</Text><Text style={styles.clientInfoValue}>{customer?.address}</Text></View>
            <View style={styles.clientInfoItem}><Text style={styles.clientInfoLabel}>Country:</Text><Text style={styles.clientInfoValue}>{pais?.nombre}</Text></View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          {/* Header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCol, styles.colCajas]}>CAJAS</Text>
            <Text style={[styles.tableCol, styles.colTipoCaja]}>TIPO DE CAJA</Text>
            <Text style={[styles.tableCol, styles.colNombreFlor]}>NOMBRE DE LA FLOR</Text>
            <Text style={[styles.tableCol, styles.colVariedad]}>VARIEDAD</Text>
            <Text style={[styles.tableCol, styles.colColor]}>COLOR</Text>
            <Text style={[styles.tableCol, styles.colLongitud]}>LONGITUD</Text>
            <Text style={[styles.tableCol, styles.colTallos]}>TALLOS POR CAJA</Text>
            <Text style={[styles.tableCol, styles.colBunches]}>BUNCHES POR CAJA</Text>
            <Text style={[styles.tableCol, styles.colPrecio]}>PRECIO DE VENTA</Text>
            <Text style={[styles.tableCol, styles.colTotal]}>TOTAL</Text>
          </View>
          {/* Body */}
          {invoice.items.map(item => item.bunches.map((bunch, bunchIndex) => {
             const stemsInBunch = (Number(bunch.stemsPerBunch) || 0) * (Number(bunch.bunches) || 0);
             const totalPrice = stemsInBunch * (Number(bunch.salePrice) || 0);
             return (
              <View key={`${item.id}-${bunch.id}`} style={styles.tableRow}>
                  <Text style={[styles.tableCol, styles.colCajas]}>{bunchIndex === 0 ? item.boxNumber : ''}</Text>
                  <Text style={[styles.tableCol, styles.colTipoCaja]}>{bunchIndex === 0 ? item.boxType.toUpperCase() : ''}</Text>
                  <Text style={[styles.tableCol, styles.colNombreFlor]}>{bunch.product}</Text>
                  <Text style={[styles.tableCol, styles.colVariedad]}>{bunch.variety}</Text>
                  <Text style={[styles.tableCol, styles.colColor]}>{bunch.color}</Text>
                  <Text style={[styles.tableCol, styles.colLongitud]}>{bunch.length}</Text>
                  <Text style={[styles.tableCol, styles.colTallos]}>{stemsInBunch}</Text>
                  <Text style={[styles.tableCol, styles.colBunches]}>{bunch.bunches}</Text>
                  <Text style={[styles.tableCol, styles.colPrecio]}>{(bunch.salePrice || 0).toFixed(3)}</Text>
                  <Text style={[styles.tableCol, styles.colTotal]}>${totalPrice.toFixed(2)}</Text>
              </View>
             )
          }))}
          {/* Totals Row */}
          <View style={[styles.tableRow, styles.totalsRow]}>
             <Text style={[styles.tableCol, styles.colCajas]}>{invoice.items.length}</Text>
             <Text style={[styles.tableCol, {flex: 1, textAlign: 'center'}]}>TOTALES</Text>
             <Text style={[styles.tableCol, styles.colTallos]}>{totals.totalStems}</Text>
             <Text style={[styles.tableCol, styles.colBunches]}>{totals.totalBunches}</Text>
             <Text style={[styles.tableCol, styles.colPrecio]}></Text>
             <Text style={[styles.tableCol, styles.colTotal]}></Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            All prices are FOB Quito. Please remember that you have 10 days after the date on the invoice to
            make a claim and that we do not accept credits for freight or handling charges in any case.
          </Text>
          <View style={styles.footerTotal}>
            <View style={styles.totalFobTable}>
              <View style={styles.totalFobRow}>
                <Text style={styles.totalFobLabel}>TOTAL FOB</Text>
                <Text style={styles.totalFobValue}>${totals.totalFob.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};
