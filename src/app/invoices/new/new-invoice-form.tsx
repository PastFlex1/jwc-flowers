

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, toDate, parseISO } from 'date-fns';
import { CalendarIcon, Trash2, PlusCircle, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/i18n-context';

import { addInvoice } from '@/services/invoices';
import type { Invoice, BunchItem, LineItem } from '@/lib/types';
import { useAppData } from '@/context/app-data-context';

const SESSION_STORAGE_KEY = 'newInvoiceFormData';

const bunchItemSchema = z.object({
  id: z.string(),
  productoId: z.string().min(1, 'Product is required.'),
  product: z.string().min(1, 'Product name is required'),
  variety: z.string().min(1, 'Variety is required.'),
  color: z.string().min(1, 'Color is required.'),
  length: z.coerce.number().positive('Must be > 0'),
  stemsPerBunch: z.coerce.number().positive('Must be > 0'),
  bunchesPerBox: z.coerce.number().min(0, 'Must be >= 0'),
  purchasePrice: z.coerce.number().min(0, 'Must be >= 0'),
  salePrice: z.coerce.number().min(0, 'Must be >= 0'),
});


const lineItemSchema = z.object({
  id: z.string(),
  boxNumber: z.coerce.number().min(1, 'Must be > 0'),
  boxType: z.enum(['qb', 'eb', 'hb'], { required_error: 'Select a type.' }),
  numberOfBunches: z.coerce.number().min(1, 'Must be > 0'),
  bunches: z.array(bunchItemSchema).min(1, 'At least one bunch is required.'),
}).refine(data => {
    const totalBunchesInBox = data.bunches.reduce((acc, bunch) => acc + (bunch.bunchesPerBox || 0), 0);
    return totalBunchesInBox === data.numberOfBunches;
}, {
    message: "La suma de 'Ramos/Caja' debe ser igual al total de # Ramos.",
    path: ['numberOfBunches'],
});

const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required.'),
  farmDepartureDate: z.date({ required_error: 'Departure date is required.' }),
  flightDate: z.date({ required_error: 'Flight date is required.' }),
  sellerId: z.string().min(1, 'Select a seller.'),
  customerId: z.string().min(1, 'Select a customer.'),
  consignatarioId: z.string().optional(),
  farmId: z.string().min(1, 'Select a farm.'),
  carrierId: z.string().min(1, 'Select a carrier.'),
  countryId: z.string().min(1, 'Select a country.'),
  reference: z.string().optional(),
  masterAWB: z.string().min(1, 'Master AWB is required.'),
  houseAWB: z.string().min(1, 'House AWB is required.'),
  items: z.array(lineItemSchema).min(1, 'At least one item is required.'),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

const getInitialFormValues = (): Partial<InvoiceFormValues> => {
  if (typeof window === 'undefined') return { items: [] };
  const savedData = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (savedData) {
    try {
      const parsedData = JSON.parse(savedData);
      if (parsedData.farmDepartureDate) {
        parsedData.farmDepartureDate = parseISO(parsedData.farmDepartureDate);
      }
      if (parsedData.flightDate) {
        parsedData.flightDate = parseISO(parsedData.flightDate);
      }
      return parsedData;
    } catch (e) {
      console.error('Failed to parse form data from session storage', e);
      return { items: [] };
    }
  }
  return { items: [] };
};

export function NewInvoiceForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { customers, fincas, vendedores, cargueras, paises, consignatarios, productos, marcaciones, refreshData } = useAppData();
  const { t } = useTranslation();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filteredConsignatarios, setFilteredConsignatarios] = useState<typeof consignatarios>([]);
  const [filteredMarcaciones, setFilteredMarcaciones] = useState<typeof marcaciones>([]);
  const [isMounted, setIsMounted] = useState(false);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    mode: 'onBlur',
    defaultValues: {
      items: [],
    },
  });

  const { fields: lineItems, append: appendLineItem, remove: removeLineItem, update } = useFieldArray({
    control: form.control,
    name: 'items',
  });
  
  const { control } = form;

  const uniqueProducts = useMemo(() => {
    const unique = new Map<string, { id: string; price: number }>();
    productos.filter(p => p.estado === 'Activo').forEach(p => {
        if (!unique.has(p.nombre)) {
            unique.set(p.nombre, { id: p.id, price: p.precio });
        }
    });
    return Array.from(unique.entries()).map(([name, data]) => ({ name, ...data }));
  }, [productos]);
  

  const getVarietiesForProduct = useCallback((productName: string) => {
    if (!productName) return [];
    return [...new Set(productos.filter(p => p.nombre === productName && p.estado === 'Activo').map(p => p.variedad))];
  }, [productos]);

  const getColorsForVariety = useCallback((productName: string, variety: string) => {
    if (!productName || !variety) return [];
    return [...new Set(productos.filter(p => p.nombre === productName && p.variedad === variety && p.estado === 'Activo').map(p => p.nombreColor))];
  }, [productos]);


  useEffect(() => {
    setIsMounted(true);
    const initialValues = getInitialFormValues();
    form.reset(initialValues);
  }, [form]);

  useEffect(() => {
    if (isMounted) {
      const subscription = form.watch((value) => {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(value));
      });
      return () => subscription.unsubscribe();
    }
  }, [isMounted, form]);

  const selectedCustomerId = form.watch('customerId');
  useEffect(() => {
    if (selectedCustomerId) {
      const customer = customers.find((c) => c.id === selectedCustomerId);
      if (customer) {
        const country = paises.find((p) => p.nombre === customer.pais);
        if (country) {
          form.setValue('countryId', country.id, { shouldValidate: true });
        }
      }

      const relatedConsignatarios = consignatarios.filter((c) => c.customerId === selectedCustomerId);
      setFilteredConsignatarios(relatedConsignatarios);

      const relatedMarcaciones = marcaciones.filter((m) => m.cliente === selectedCustomerId);
      setFilteredMarcaciones(relatedMarcaciones);

      const initialValues = getInitialFormValues();
      if (initialValues.customerId !== selectedCustomerId) {
        form.setValue('consignatarioId', '');
        form.setValue('reference', relatedMarcaciones.length === 1 ? relatedMarcaciones[0].numeroMarcacion : '');
      }
    } else {
      setFilteredConsignatarios([]);
      setFilteredMarcaciones([]);
      form.setValue('consignatarioId', '');
      form.setValue('reference', '');
    }
  }, [selectedCustomerId, customers, paises, consignatarios, marcaciones, form]);


  const handleAddLineItem = () => {
    appendLineItem({
        id: uuidv4(),
        boxNumber: (lineItems.length > 0 ? Math.max(...lineItems.map(item => item.boxNumber)) : 0) + 1,
        boxType: 'hb',
        numberOfBunches: 1,
        bunches: [{
            id: uuidv4(),
            productoId: '',
            product: '',
            variety: '',
            color: '',
            length: 70,
            stemsPerBunch: 25,
            bunchesPerBox: 1,
            purchasePrice: 0,
            salePrice: 0,
        }]
    })
  }

  const handleAddBunch = (lineItemIndex: number) => {
    const lineItem = form.getValues(`items.${lineItemIndex}`);
    const newBunches = [...(lineItem.bunches || []), {
        id: uuidv4(),
        productoId: '',
        product: '',
        variety: '',
        color: '',
        length: 70,
        stemsPerBunch: 25,
        bunchesPerBox: 0, // Default new sub-rows to 0
        purchasePrice: 0,
        salePrice: 0,
    }];
    update(lineItemIndex, { ...lineItem, bunches: newBunches });
  };

  const handleRemoveBunch = (lineItemIndex: number, bunchIndex: number) => {
      const lineItem = form.getValues(`items.${lineItemIndex}`);
      if (lineItem.bunches.length <= 1) {
          removeLineItem(lineItemIndex);
      } else {
          const newBunches = lineItem.bunches.filter((_, i) => i !== bunchIndex);
          update(lineItemIndex, { ...lineItem, bunches: newBunches });
      }
  };

  const handleProductChange = (lineItemIndex: number, bunchIndex: number, productName: string) => {
    const productDetails = uniqueProducts.find(p => p.name === productName);
    if (productDetails) {
        form.setValue(`items.${lineItemIndex}.bunches.${bunchIndex}.productoId`, productDetails.id);
        form.setValue(`items.${lineItemIndex}.bunches.${bunchIndex}.salePrice`, productDetails.price);
        form.setValue(`items.${lineItemIndex}.bunches.${bunchIndex}.variety`, '');
        form.setValue(`items.${lineItemIndex}.bunches.${bunchIndex}.color`, '');
    }
  };


  async function onSubmit(values: InvoiceFormValues) {
    setIsSubmitting(true);
  
    const processedInvoice: Omit<Invoice, 'id'> = {
      ...values,
      consignatarioId: values.consignatarioId || '',
      reference: values.reference || '',
      farmDepartureDate: values.farmDepartureDate.toISOString(),
      flightDate: values.flightDate.toISOString(),
      status: 'Pending',
    };
  
    try {
      await addInvoice(processedInvoice);
      await refreshData();
      toast({
        title: t('invoices.new.toast.successTitle'),
        description: t('invoices.new.toast.successDescription'),
      });
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      router.push('/invoices');
    } catch (error) {
      console.error('Error creating invoice:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({
        title: t('invoices.new.toast.errorTitle'),
        description: t('invoices.new.toast.errorDescription', { error: errorMessage }),
        variant: 'destructive',
        duration: 10000,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isMounted) {
    return null;
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight font-headline">{t('invoices.new.title')}</h2>
        <p className="text-muted-foreground">{t('invoices.new.description')}</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>{t('invoices.new.detailsTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               <FormField
                control={form.control}
                name="invoiceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('invoices.new.invoiceNumber')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('invoices.new.invoiceNumberPlaceholder')} {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="farmDepartureDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t('invoices.new.farmDepartureDate')}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant={'outline'} className={cn('w-full justify-start text-left font-normal', !field.value && 'text-muted-foreground')}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(toDate(field.value), 'PPP') : <span>{t('invoices.new.selectDate')}</span>}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date('1900-01-01')} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="flightDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t('invoices.new.flightDate')}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant={'outline'} className={cn('w-full justify-start text-left font-normal', !field.value && 'text-muted-foreground')}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(toDate(field.value), 'PPP') : <span>{t('invoices.new.selectDate')}</span>}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date('1900-01-01')} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sellerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('invoices.new.seller')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('invoices.new.sellerPlaceholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vendedores.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('invoices.new.customer')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('invoices.new.customerPlaceholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="consignatarioId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('invoices.new.consignee')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ''} disabled={!selectedCustomerId || filteredConsignatarios.length === 0}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={!selectedCustomerId ? t('invoices.new.selectCustomerFirst') : t('invoices.new.consigneePlaceholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredConsignatarios.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.nombreConsignatario}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="farmId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('invoices.new.farm')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('invoices.new.farmPlaceholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {fincas.map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="carrierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('invoices.new.carrier')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('invoices.new.carrierPlaceholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {cargueras.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.nombreCarguera}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="countryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('invoices.new.country')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ''} disabled={!!selectedCustomerId}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('invoices.new.countryPlaceholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paises.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('invoices.new.reference')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ''} disabled={!selectedCustomerId || filteredMarcaciones.length === 0}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={!selectedCustomerId ? t('invoices.new.selectCustomerFirst') : filteredMarcaciones.length === 0 ? t('invoices.new.noMarkings') : t('invoices.new.markingPlaceholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredMarcaciones.map((m) => (
                          <SelectItem key={m.id} value={m.numeroMarcacion}>
                            {m.numeroMarcacion}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="masterAWB"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('invoices.new.masterAWB')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('invoices.new.masterAWBPlaceholder')} {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="houseAWB"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('invoices.new.houseAWB')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('invoices.new.houseAWBPlaceholder')} {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{t('invoices.new.itemsTitle')}</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={handleAddLineItem}>
                  <PlusCircle className="mr-2 h-4 w-4" /> {t('invoices.new.addItem')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="min-w-[120px]">Nº Caja</TableHead>
                                <TableHead className="min-w-[120px]">Tipo Caja</TableHead>
                                <TableHead className="min-w-[120px]"># Ramos</TableHead>
                                <TableHead className="min-w-[150px]">Producto</TableHead>
                                <TableHead className="min-w-[150px]">Variedad</TableHead>
                                <TableHead className="min-w-[150px]">Color</TableHead>
                                <TableHead className="min-w-[120px]">Longitud</TableHead>
                                <TableHead className="min-w-[120px]">Tallos/Ramo</TableHead>
                                <TableHead className="min-w-[120px]">Ramos/Caja</TableHead>
                                <TableHead className="min-w-[120px]">P. Compra</TableHead>
                                <TableHead className="min-w-[120px]">P. Venta</TableHead>
                                <TableHead className="min-w-[120px]">Total Tallos</TableHead>
                                <TableHead className="min-w-[120px]">Total</TableHead>
                                <TableHead className="min-w-[140px]">Diferencia (%)</TableHead>
                                <TableHead className="min-w-[120px]">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {lineItems.map((lineItem, lineItemIndex) => (
                                <React.Fragment key={lineItem.id}>
                                    {Array.isArray(lineItem.bunches) && lineItem.bunches.map((bunch, bunchIndex) => {
                                        const bunchPath = `items.${lineItemIndex}.bunches.${bunchIndex}` as const;
                                        
                                        const salePrice = form.watch(`${bunchPath}.salePrice`) || 0;
                                        const purchasePrice = form.watch(`${bunchPath}.purchasePrice`) || 0;
                                        const stemsPerBunch = form.watch(`${bunchPath}.stemsPerBunch`) || 0;
                                        const bunchesPerBox = form.watch(`${bunchPath}.bunchesPerBox`) || 0;
                                        
                                        const totalStems = stemsPerBunch * bunchesPerBox;
                                        const totalValue = totalStems * salePrice;
                                        
                                        let differencePercent = '0 %';
                                        if (purchasePrice > 0) {
                                            differencePercent = (((salePrice - purchasePrice) / purchasePrice) * 100).toFixed(2) + ' %';
                                        } else if (salePrice > 0) {
                                            differencePercent = '∞ %';
                                        }

                                        const selectedProduct = form.watch(`${bunchPath}.product`);
                                        const selectedVariety = form.watch(`${bunchPath}.variety`);
                                        const varieties = getVarietiesForProduct(selectedProduct);
                                        const colors = getColorsForVariety(selectedProduct, selectedVariety);

                                        return (
                                            <TableRow key={bunch.id}>
                                                <TableCell className="min-w-[120px]">
                                                    {bunchIndex === 0 ? <FormField control={form.control} name={`items.${lineItemIndex}.boxNumber`} render={({ field }) => <Input type="number" {...field} value={field.value ?? 0} />} /> : null}
                                                </TableCell>
                                                <TableCell className="min-w-[120px]">
                                                     {bunchIndex === 0 ? (
                                                        <FormField control={form.control} name={`items.${lineItemIndex}.boxType`} render={({ field }) => (
                                                                <Select onValueChange={field.onChange} value={field.value ?? ''}>
                                                                    <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                                                    <SelectContent>
                                                                        <SelectItem value="hb">HB</SelectItem>
                                                                        <SelectItem value="qb">QB</SelectItem>
                                                                        <SelectItem value="eb">EB</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            )} />
                                                        ) : null}
                                                </TableCell>
                                                <TableCell className="min-w-[120px]">
                                                    {bunchIndex === 0 ? <FormField control={form.control} name={`items.${lineItemIndex}.numberOfBunches`} render={({ field }) => <Input type="number" {...field} value={field.value ?? 0} />} /> : null}
                                                </TableCell>
                                                <TableCell className="min-w-[150px]"><FormField control={form.control} name={`${bunchPath}.product`} render={({ field }) => (
                                                    <Select onValueChange={(value) => { field.onChange(value); handleProductChange(lineItemIndex, bunchIndex, value); }} value={field.value ?? ''}>
                                                        <FormControl><SelectTrigger><SelectValue placeholder="Producto" /></SelectTrigger></FormControl>
                                                        <SelectContent>{uniqueProducts.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}</SelectContent>
                                                    </Select>
                                                )} /></TableCell>
                                                <TableCell className="min-w-[150px]"><FormField control={form.control} name={`${bunchPath}.variety`} render={({ field }) => (
                                                     <Select onValueChange={field.onChange} value={field.value ?? ''} disabled={!selectedProduct}>
                                                        <FormControl><SelectTrigger><SelectValue placeholder="Variedad" /></SelectTrigger></FormControl>
                                                        <SelectContent>{varieties.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                                                    </Select>
                                                )}/></TableCell>
                                                <TableCell className="min-w-[150px]"><FormField control={form.control} name={`${bunchPath}.color`} render={({ field }) => (
                                                     <Select onValueChange={field.onChange} value={field.value ?? ''} disabled={!selectedVariety}>
                                                        <FormControl><SelectTrigger><SelectValue placeholder="Color" /></SelectTrigger></FormControl>
                                                        <SelectContent>{colors.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                                    </Select>
                                                )}/></TableCell>
                                                <TableCell className="min-w-[120px]"><FormField control={form.control} name={`${bunchPath}.length`} render={({ field }) => <Input type="number" {...field} value={field.value ?? 0} />}/></TableCell>
                                                <TableCell className="min-w-[120px]"><FormField control={form.control} name={`${bunchPath}.stemsPerBunch`} render={({ field }) => <Input type="number" {...field} value={field.value ?? 0} />}/></TableCell>
                                                <TableCell className="min-w-[120px]"><FormField control={form.control} name={`${bunchPath}.bunchesPerBox`} render={({ field }) => <Input type="number" {...field} value={field.value ?? 0} />}/></TableCell>
                                                <TableCell className="min-w-[120px]"><FormField control={form.control} name={`${bunchPath}.purchasePrice`} render={({ field }) => <Input type="number" step="0.01" {...field} value={field.value ?? 0} />}/></TableCell>
                                                <TableCell className="min-w-[120px]"><FormField control={form.control} name={`${bunchPath}.salePrice`} render={({ field }) => <Input type="number" step="0.01" {...field} value={field.value ?? 0} />}/></TableCell>
                                                <TableCell className="min-w-[120px]"><Input readOnly disabled value={totalStems} className="bg-muted/50" /></TableCell>
                                                <TableCell className="min-w-[120px]"><Input readOnly disabled value={`$${totalValue.toFixed(2)}`} className="bg-muted/50" /></TableCell>
                                                <TableCell className="min-w-[140px]"><Input readOnly disabled value={differencePercent} className="bg-muted/50" /></TableCell>
                                                <TableCell className="min-w-[120px]">
                                                    <div className="flex items-center gap-1">
                                                        {bunchIndex === 0 && (
                                                            <Button type="button" variant="ghost" size="icon" onClick={() => handleAddBunch(lineItemIndex)}>
                                                                <PlusCircle className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveBunch(lineItemIndex, bunchIndex)}>
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    <TableRow>
                                       <TableCell colSpan={15} className="p-0">
                                           <div className="text-sm font-medium text-destructive px-2 py-1">
                                                <FormMessage>
                                                    {form.formState.errors.items?.[lineItemIndex]?.numberOfBunches?.message}
                                                </FormMessage>
                                            </div>
                                       </TableCell>
                                    </TableRow>
                                </React.Fragment>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <FormMessage>{form.formState.errors.items?.message}</FormMessage>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.push('/invoices')} disabled={isSubmitting}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? t('invoices.new.saving') : t('invoices.new.save')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
