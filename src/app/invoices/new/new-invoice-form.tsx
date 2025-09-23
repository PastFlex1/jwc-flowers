
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, toDate, parseISO, addDays } from 'date-fns';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/i18n-context';

import { addInvoice, updateInvoice } from '@/services/invoices';
import type { Invoice, BunchItem, LineItem } from '@/lib/types';
import { useAppData } from '@/context/app-data-context';

const SESSION_STORAGE_KEY = 'newInvoiceFormData';

const bunchItemSchema = z.object({
  id: z.string(),
  productoId: z.string().min(1, 'Product is required.'),
  product: z.string().min(1, 'Product name is required'),
  variety: z.string().min(1, 'Variety is required.'),
  color: z.string(),
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
  numberOfBunches: z.coerce.number().min(0, '# Ramos must be >= 0'),
  bunches: z.array(bunchItemSchema).min(1, 'At least one bunch is required.'),
}).refine(data => {
    const totalBunchesInBox = data.bunches.reduce((acc, bunch) => acc + (bunch.bunchesPerBox || 0), 0);
    return totalBunchesInBox === data.numberOfBunches;
}, {
    message: "La suma de 'Ramos/Caja' debe ser igual al total de # Ramos.",
    path: ['numberOfBunches'],
});

const invoiceSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['sale', 'purchase', 'both'], { required_error: 'Debe seleccionar un tipo de factura.' }),
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

export type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export function NewInvoiceForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { customers, fincas, vendedores, cargueras, paises, consignatarios, productos, marcaciones, invoices, refreshData, isAppDataLoading } = useAppData();
  const { t } = useTranslation();

  const editId = searchParams.get('edit');
  const duplicateId = searchParams.get('duplicate');
  const idToLoad = editId || duplicateId;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filteredConsignatarios, setFilteredConsignatarios] = useState<typeof consignatarios>([]);
  const [filteredMarcaciones, setFilteredMarcaciones] = useState<typeof marcaciones>([]);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    mode: 'onBlur',
  });

  useEffect(() => {
    if (isAppDataLoading || !idToLoad) return;
  
    const invoiceToLoad = invoices.find(inv => inv.id === idToLoad);
  
    if (invoiceToLoad) {
      const dataToLoad = {
        ...invoiceToLoad,
        id: duplicateId ? undefined : invoiceToLoad.id,
        invoiceNumber: duplicateId ? '' : invoiceToLoad.invoiceNumber,
        farmDepartureDate: invoiceToLoad.farmDepartureDate ? parseISO(invoiceToLoad.farmDepartureDate) : new Date(),
        flightDate: invoiceToLoad.flightDate ? parseISO(invoiceToLoad.flightDate) : new Date(),
        items: invoiceToLoad.items.map(item => ({
          ...item,
          id: uuidv4(),
          bunches: item.bunches.map(bunch => ({
            ...bunch,
            id: uuidv4(),
          })),
        })),
      };
      form.reset(dataToLoad);
    } else if (!isAppDataLoading) {
      // If we've finished loading but found no invoice, maybe show a toast and redirect.
      // For now, just log it. This might happen with a stale URL.
      console.warn(`Invoice with id ${idToLoad} not found.`);
    }
  }, [idToLoad, duplicateId, isAppDataLoading, invoices, form]);


  useEffect(() => {
    if (!idToLoad && !isAppDataLoading) {
      const savedData = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                if (parsed.farmDepartureDate) parsed.farmDepartureDate = parseISO(parsed.farmDepartureDate);
                if (parsed.flightDate) parsed.flightDate = parseISO(parsed.flightDate);
                form.reset(parsed);
            } catch (e) {
                console.error("Could not parse saved form data:", e);
                form.reset({});
            }
        }
      const subscription = form.watch((value) => {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(value));
      });
      return () => subscription.unsubscribe();
    }
  }, [isAppDataLoading, form, idToLoad]);

  const farmDepartureDate = form.watch('farmDepartureDate');

  useEffect(() => {
    if (farmDepartureDate && form.formState.dirtyFields.farmDepartureDate) {
      const nextDay = addDays(new Date(farmDepartureDate), 1);
      form.setValue('flightDate', nextDay, { shouldValidate: true });
    }
  }, [farmDepartureDate, form]);

  const { fields: lineItems, append: appendLineItem, remove: removeLineItem, update } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  let rowCounter = 0;

  const uniqueProducts = useMemo(() => {
    const unique = new Map<string, { id: string; price: number; tallosPorRamo: number }>();
    productos.filter(p => p.estado === 'Activo').forEach(p => {
        if (!unique.has(p.nombre)) {
            unique.set(p.nombre, { id: p.id, price: p.precio, tallosPorRamo: p.tallosPorRamo });
        }
    });
    return Array.from(unique.entries()).map(([name, data]) => ({ name, ...data }));
  }, [productos]);
  

  const getVarietiesForProduct = useCallback((productName: string) => {
    if (!productName) return [];
    return [...new Set(productos.filter(p => p.nombre === productName && p.estado === 'Activo').map(p => p.variedad))];
  }, [productos]);

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
      
      const currentConsignatario = form.getValues('consignatarioId');
      if (form.formState.dirtyFields.customerId) {
          form.setValue('consignatarioId', '');
          form.setValue('reference', '');
      }

    } else {
      setFilteredConsignatarios([]);
      setFilteredMarcaciones([]);
       if (form.formState.dirtyFields.customerId) {
        form.setValue('consignatarioId', '');
        form.setValue('reference', '');
      }
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
        bunchesPerBox: 0,
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
    const productInfo = productos.find(p => p.nombre === productName);
    if (productInfo) {
      form.setValue(`items.${lineItemIndex}.bunches.${bunchIndex}.productoId`, productInfo.id);
      form.setValue(`items.${lineItemIndex}.bunches.${bunchIndex}.stemsPerBunch`, productInfo.tallosPorRamo);
      form.setValue(`items.${lineItemIndex}.bunches.${bunchIndex}.variety`, '');
    }
  };


  async function onSubmit(values: InvoiceFormValues) {
    setIsSubmitting(true);
  
    const { id, ...dataToSubmit } = values;

    const invoiceData = {
      ...dataToSubmit,
      consignatarioId: values.consignatarioId || '',
      reference: values.reference || '',
      farmDepartureDate: values.farmDepartureDate.toISOString(),
      flightDate: values.flightDate.toISOString(),
      status: 'Pending',
      items: values.items as LineItem[],
    };

    try {
      if (editId) {
        await updateInvoice(editId, invoiceData);
        toast({
          title: "Factura Actualizada",
          description: "La factura ha sido actualizada correctamente.",
        });
      } else {
        await addInvoice(invoiceData as Omit<Invoice, 'id'>);
        toast({
          title: t('invoices.new.toast.successTitle'),
          description: t('invoices.new.toast.successDescription'),
        });
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }

      await refreshData();
      const destination = values.type === 'purchase' ? '/accounts-payable' : '/invoices';
      router.push(destination);

    } catch (error) {
      console.error('Error saving invoice:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({
        title: id ? 'Error al Actualizar' : t('invoices.new.toast.errorTitle'),
        description: `No se pudo guardar la factura: ${errorMessage}.`,
        variant: 'destructive',
        duration: 10000,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isAppDataLoading) {
    return (
        <div className="flex h-[80vh] w-full items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
                <p className="text-muted-foreground">Cargando datos de factura...</p>
            </div>
        </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight font-headline">{editId ? "Editar Factura" : "Nueva Factura"}</h2>
        <p className="text-muted-foreground">{editId ? "Modifique los detalles de la factura." : "Crear una nueva factura de venta o compra."}</p>
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
                name="type"
                render={({ field }) => (
                  <FormItem className="col-span-full">
                    <FormLabel>Tipo de Factura</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col md:flex-row gap-4"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="sale" />
                          </FormControl>
                          <FormLabel className="font-normal">Venta (Estado de Cuenta Cliente)</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="purchase" />
                          </FormControl>
                          <FormLabel className="font-normal">Compra (Estado de Cuenta Finca)</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="both" />
                          </FormControl>
                          <FormLabel className="font-normal">Ambos</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                                <TableHead className="w-16">N°</TableHead>
                                <TableHead className="w-24">Nº Caja</TableHead>
                                <TableHead className="w-32">Tipo Caja</TableHead>
                                <TableHead className="w-24"># Ramos</TableHead>
                                <TableHead className="min-w-[150px]">Variedad</TableHead>
                                <TableHead className="min-w-[150px]">Producto</TableHead>
                                <TableHead className="w-24">Long.</TableHead>
                                <TableHead className="w-24">Tallos/Ramo</TableHead>
                                <TableHead className="w-24">Ramos/Caja</TableHead>
                                <TableHead className="w-24">P. Compra</TableHead>
                                <TableHead className="w-24">P. Venta</TableHead>
                                <TableHead className="w-24">Total Tallos</TableHead>
                                <TableHead className="w-24">Total</TableHead>
                                <TableHead className="w-28">Diferencia (%)</TableHead>
                                <TableHead className="w-[100px]">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {lineItems.map((lineItem, lineItemIndex) => (
                                <React.Fragment key={lineItem.id}>
                                    {Array.isArray(lineItem.bunches) && lineItem.bunches.map((bunch, bunchIndex) => {
                                        rowCounter++;
                                        const bunchPath = `items.${lineItemIndex}.bunches.${bunchIndex}` as const;
                                        const lineItemPath = `items.${lineItemIndex}` as const;
                                        
                                        const salePrice = form.watch(`${bunchPath}.salePrice`) || 0;
                                        const purchasePrice = form.watch(`${bunchPath}.purchasePrice`) || 0;
                                        const stemsPerBunch = form.watch(`${bunchPath}.stemsPerBunch`) || 0;
                                        const bunchesPerBox = form.watch(`${bunchPath}.bunchesPerBox`) || 0;
                                        const boxNumber = form.watch(`${lineItemPath}.boxNumber`) || 0;

                                        const totalStems = stemsPerBunch * bunchesPerBox * boxNumber;
                                        const totalValue = (totalStems * salePrice).toFixed(2);
                                        
                                        let differencePercent = '0 %';
                                        if (purchasePrice > 0) {
                                            differencePercent = (((salePrice - purchasePrice) / purchasePrice) * 100).toFixed(2) + ' %';
                                        } else if (salePrice > 0) {
                                            differencePercent = '∞ %';
                                        }

                                        const selectedProduct = form.watch(`${bunchPath}.product`);
                                        const varieties = getVarietiesForProduct(selectedProduct);

                                        return (
                                            <TableRow key={bunch.id}>
                                                <TableCell className="align-top pt-2 font-medium">{rowCounter}</TableCell>
                                                <TableCell className="align-top pt-2">
                                                    {bunchIndex === 0 ? <FormField control={form.control} name={`items.${lineItemIndex}.boxNumber`} render={({ field }) => <Input type="number" {...field} value={field.value ?? 0} className="w-24 py-2" />} /> : null}
                                                </TableCell>
                                                <TableCell className="align-top pt-2">
                                                     {bunchIndex === 0 ? (
                                                        <FormField control={form.control} name={`items.${lineItemIndex}.boxType`} render={({ field }) => (
                                                                <Select onValueChange={field.onChange} value={field.value ?? ''}>
                                                                    <FormControl><SelectTrigger className="w-32 py-2"><SelectValue/></SelectTrigger></FormControl>
                                                                    <SelectContent>
                                                                        <SelectItem value="hb">HB</SelectItem>
                                                                        <SelectItem value="qb">QB</SelectItem>
                                                                        <SelectItem value="eb">EB</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            )} />
                                                        ) : null}
                                                </TableCell>
                                                <TableCell className="align-top pt-2">
                                                    {bunchIndex === 0 ? (
                                                        <FormField 
                                                            control={form.control} 
                                                            name={`items.${lineItemIndex}.numberOfBunches`} 
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormControl>
                                                                        <Input type="number" {...field} value={field.value ?? 0} className="w-24 py-2" />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    ) : null}
                                                </TableCell>
                                                <TableCell className="min-w-[150px]"><FormField control={form.control} name={`${bunchPath}.product`} render={({ field }) => (
                                                    <Select onValueChange={(value) => { field.onChange(value); handleProductChange(lineItemIndex, bunchIndex, value); }} value={field.value ?? ''}>
                                                        <FormControl><SelectTrigger className="py-2"><SelectValue placeholder="Variedad" /></SelectTrigger></FormControl>
                                                        <SelectContent>{uniqueProducts.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}</SelectContent>
                                                    </Select>
                                                )} /></TableCell>
                                                <TableCell className="min-w-[150px]"><FormField control={form.control} name={`${bunchPath}.variety`} render={({ field }) => (
                                                     <Select onValueChange={field.onChange} value={field.value ?? ''} disabled={!selectedProduct}>
                                                        <FormControl><SelectTrigger className="py-2"><SelectValue placeholder="Producto" /></SelectTrigger></FormControl>
                                                        <SelectContent>{varieties.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                                                    </Select>
                                                )}/></TableCell>
                                                <TableCell><FormField control={form.control} name={`${bunchPath}.length`} render={({ field }) => <Input type="number" {...field} value={field.value ?? 0} className="w-24 py-2"/>}/></TableCell>
                                                <TableCell><FormField control={form.control} name={`${bunchPath}.stemsPerBunch`} render={({ field }) => <Input type="number" {...field} value={field.value ?? 0} className="w-24 py-2"/>}/></TableCell>
                                                <TableCell><FormField control={form.control} name={`${bunchPath}.bunchesPerBox`} render={({ field }) => <Input type="number" {...field} onBlur={() => form.trigger(`items.${lineItemIndex}.numberOfBunches`)} value={field.value ?? 0} className="w-24 py-2"/>}/></TableCell>
                                                <TableCell><FormField control={form.control} name={`${bunchPath}.purchasePrice`} render={({ field }) => <Input type="number" step="0.01" {...field} value={field.value ?? 0} className="w-24 py-2"/>}/></TableCell>
                                                <TableCell><FormField control={form.control} name={`${bunchPath}.salePrice`} render={({ field }) => <Input type="number" step="0.01" {...field} value={field.value ?? 0} className="w-24 py-2"/>}/></TableCell>
                                                <TableCell><Input readOnly disabled value={totalStems} className="w-24 bg-muted/50 py-2" /></TableCell>
                                                <TableCell><Input readOnly disabled value={`$${totalValue}`} className="w-24 bg-muted/50 py-2" /></TableCell>
                                                <TableCell><Input readOnly disabled value={differencePercent} className="w-28 bg-muted/50 py-2" /></TableCell>
                                                <TableCell>
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
                                </React.Fragment>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <FormMessage>{form.formState.errors.items?.message || form.formState.errors.items?.root?.message}</FormMessage>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.push('/invoices')} disabled={isSubmitting}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? t('common.saving') : (editId ? 'Guardar Cambios' : t('invoices.new.save'))}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

    