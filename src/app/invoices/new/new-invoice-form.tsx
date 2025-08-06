
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
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
import type { Invoice, LineItem as LineItemType, Producto } from '@/lib/types';
import { useAppData } from '@/context/app-data-context';

const SESSION_STORAGE_KEY = 'newInvoiceFormData';

const lineItemSchema = z.object({
  id: z.string(),
  boxType: z.enum(['qb', 'eb', 'hb'], { required_error: 'Select a type.' }),
  boxNumber: z.coerce.number().min(1, 'Must be > 0'),
  productoId: z.string().min(1, 'Product is required.'),
  nombreFlor: z.string().min(1, 'Product name is required'),
  color: z.string().min(1, 'Color is required.'),
  variedad: z.string().min(1, 'Variety is required.'),
  length: z.coerce.number().positive('Must be > 0'),
  stemsPerBunch: z.coerce.number().positive('Must be > 0'),
  bunches: z.coerce.number().min(1, 'Must be > 0'),
  purchasePrice: z.coerce.number().min(0, 'Must be >= 0'),
  salePrice: z.coerce.number().min(0, 'Must be >= 0'),
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

  const [availableVarieties, setAvailableVarieties] = useState<Record<number, string[]>>({});
  const [availableColors, setAvailableColors] = useState<Record<number, string[]>>({});

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    mode: 'onBlur',
    defaultValues: {
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const selectedCustomerId = form.watch('customerId');
  const watchItems = form.watch('items');
  
  const uniqueProductNames = useMemo(() => {
    return [...new Set(productos.filter(p => p.estado === 'Activo').map(p => p.nombre))];
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

  const handleAddItem = () => {
    const newItemId = uuidv4();
    append({
      id: newItemId,
      boxNumber: fields.length + 1,
      boxType: 'hb',
      productoId: '',
      nombreFlor: '',
      variedad: '',
      color: '',
      length: 70,
      stemsPerBunch: 25,
      bunches: 1,
      purchasePrice: 0,
      salePrice: 0,
    });
    setAvailableVarieties(prev => ({...prev, [fields.length]: []}));
    setAvailableColors(prev => ({...prev, [fields.length]: []}));
  };

 const updatePriceIfNeeded = useCallback((index: number) => {
    const { nombreFlor, variedad, color } = form.getValues(`items.${index}`);
    if (nombreFlor && variedad && color) {
      const product = productos.find(p => 
        p.nombre === nombreFlor && 
        p.variedad === variedad && 
        p.nombreColor === color
      );
      if (product) {
        form.setValue(`items.${index}.salePrice`, product.precio);
        form.setValue(`items.${index}.productoId`, product.id);
      }
    }
  }, [productos, form]);

  const handleProductChange = useCallback((index: number, productName: string) => {
    const activeProductsForName = productos.filter(p => p.estado === 'Activo' && p.nombre === productName);
    const uniqueVarieties = [...new Set(activeProductsForName.map(p => p.variedad))];
    const uniqueColors = [...new Set(activeProductsForName.map(p => p.nombreColor))];

    setAvailableVarieties(prev => ({ ...prev, [index]: uniqueVarieties }));
    setAvailableColors(prev => ({ ...prev, [index]: uniqueColors }));
    
    form.setValue(`items.${index}.variedad`, '');
    form.setValue(`items.${index}.color`, '');
    form.setValue(`items.${index}.salePrice`, 0);

  }, [productos, form]);


  
  async function onSubmit(values: InvoiceFormValues) {
    setIsSubmitting(true);
  
    const processedInvoice: Omit<Invoice, 'id'> = {
      ...values,
      consignatarioId: values.consignatarioId || '',
      reference: values.reference || '',
      farmDepartureDate: values.farmDepartureDate.toISOString(),
      flightDate: values.flightDate.toISOString(),
      status: 'Pending',
      items: values.items.map(item => {
        const productInfo = productos.find(p => p.nombre === item.nombreFlor && p.variedad === item.variedad && p.nombreColor === item.color);
        return {
          id: item.id,
          boxType: item.boxType,
          boxNumber: item.boxNumber,
          bunches: [{
            id: uuidv4(), 
            productoId: productInfo?.id || item.productoId,
            product: item.nombreFlor,
            color: item.color,
            variety: item.variedad,
            length: item.length,
            stemsPerBunch: item.stemsPerBunch,
            bunches: item.bunches,
            purchasePrice: item.purchasePrice,
            salePrice: item.salePrice,
          }]
        }
      }),
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
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Añadir Fila
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N°</TableHead>
                      <TableHead>N° de Cajas</TableHead>
                      <TableHead>Tipo de Caja</TableHead>
                      <TableHead>Nombre Flor</TableHead>
                      <TableHead>Variedad</TableHead>
                      <TableHead>Color</TableHead>
                      <TableHead>Longitud</TableHead>
                      <TableHead>N° Tallos</TableHead>
                      <TableHead>N° Bunches</TableHead>
                      <TableHead>Total Bunches</TableHead>
                      <TableHead>Precio Compra</TableHead>
                      <TableHead>Precio Venta</TableHead>
                      <TableHead>Total Tallos</TableHead>
                      <TableHead>Diferencia</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => {
                       const bunches = Number(watchItems[index]?.bunches) || 0;
                       const stemsPerBunch = Number(watchItems[index]?.stemsPerBunch) || 0;
                       const salePrice = Number(watchItems[index]?.salePrice) || 0;
                       const purchasePrice = Number(watchItems[index]?.purchasePrice) || 0;

                       const totalBunches = bunches;
                       const totalStems = stemsPerBunch * totalBunches;
                       const difference = salePrice - purchasePrice;
                       const total = totalStems * salePrice;

                      return (
                        <TableRow key={field.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`items.${index}.boxNumber`}
                              render={({ field }) => <Input type="number" {...field} className="w-20" />}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`items.${index}.boxType`}
                              render={({ field }) => (
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="w-24">
                                      <SelectValue placeholder="Tipo" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="hb">HB</SelectItem>
                                    <SelectItem value="qb">QB</SelectItem>
                                    <SelectItem value="eb">EB</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                                control={form.control}
                                name={`items.${index}.nombreFlor`}
                                render={({ field }) => (
                                    <Select
                                      onValueChange={(value) => {
                                        field.onChange(value);
                                        handleProductChange(index, value);
                                      }}
                                      value={field.value}
                                    >
                                      <FormControl>
                                          <SelectTrigger className="w-36">
                                            <SelectValue placeholder="Flor" />
                                          </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                          {uniqueProductNames.map((name) => (
                                            <SelectItem key={name} value={name}>{name}</SelectItem>
                                          ))}
                                      </SelectContent>
                                    </Select>
                                )}
                            />
                          </TableCell>
                           <TableCell>
                            <FormField
                              control={form.control}
                              name={`items.${index}.variedad`}
                              render={({ field }) => (
                                <Select 
                                  onValueChange={(value) => {
                                    field.onChange(value);
                                    updatePriceIfNeeded(index);
                                  }}
                                  value={field.value}
                                  disabled={!watchItems[index]?.nombreFlor}
                                >
                                  <FormControl>
                                    <SelectTrigger className="w-36">
                                      <SelectValue placeholder="Variedad" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {(availableVarieties[index] || []).map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`items.${index}.color`}
                              render={({ field }) => (
                                <Select 
                                  onValueChange={(value) => {
                                    field.onChange(value);
                                    updatePriceIfNeeded(index);
                                  }}
                                  value={field.value}
                                  disabled={!watchItems[index]?.nombreFlor}
                                >
                                  <FormControl>
                                    <SelectTrigger className="w-36">
                                      <SelectValue placeholder="Color" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                     {(availableColors[index] || []).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField control={form.control} name={`items.${index}.length`} render={({ field }) => <Input type="number" {...field} className="w-20" />} />
                          </TableCell>
                          <TableCell>
                            <FormField control={form.control} name={`items.${index}.stemsPerBunch`} render={({ field }) => <Input type="number" {...field} className="w-20" />} />
                          </TableCell>
                          <TableCell>
                            <FormField control={form.control} name={`items.${index}.bunches`} render={({ field }) => <Input type="number" {...field} className="w-20" />} />
                          </TableCell>
                          <TableCell>
                            <Input type="number" readOnly disabled value={totalBunches} className="w-20 bg-muted/50" />
                          </TableCell>
                          <TableCell>
                            <FormField control={form.control} name={`items.${index}.purchasePrice`} render={({ field }) => <Input type="number" step="0.01" {...field} className="w-24" />} />
                          </TableCell>
                          <TableCell>
                            <FormField control={form.control} name={`items.${index}.salePrice`} render={({ field }) => <Input type="number" step="0.01" {...field} className="w-24" />} />
                          </TableCell>
                          <TableCell>
                            <Input type="number" readOnly disabled value={totalStems} className="w-20 bg-muted/50" />
                          </TableCell>
                          <TableCell>
                            <Input type="text" readOnly disabled value={difference.toFixed(2)} className="w-24 bg-muted/50" />
                          </TableCell>
                          <TableCell>
                            <Input type="text" readOnly disabled value={total.toFixed(2)} className="w-24 bg-muted/50" />
                          </TableCell>
                          <TableCell>
                            <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <FormMessage>{form.formState.errors.items?.message}</FormMessage>
              <FormMessage>{(form.formState.errors.items as any)?.root?.message}</FormMessage>
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
