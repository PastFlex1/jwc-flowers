'use client'

import { useState, useEffect, useMemo } from 'react';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/context/i18n-context';

import { addInvoice } from '@/services/invoices';
import type { Invoice, Consignatario, Marcacion, LineItem } from '@/lib/types';
import { useAppData } from '@/context/app-data-context';

const SESSION_STORAGE_KEY = 'newInvoiceFormData';


const bunchItemSchema = z.object({
  id: z.string(),
  product: z.string().min(1, "Product is required."),
  variety: z.string().min(1, "Variety is required."),
  length: z.coerce.number().positive("Must be > 0"),
  stemsPerBunch: z.coerce.number().positive("Must be > 0"),
  bunches: z.coerce.number().min(1, "Must be > 0"),
  purchasePrice: z.coerce.number().min(0, "Must be >= 0"),
  salePrice: z.coerce.number().min(0, "Must be >= 0"),
});

const lineItemSchema = z.object({
  id: z.string(),
  boxType: z.enum(['qb', 'eb', 'hb'], { required_error: "Select a type." }),
  boxNumber: z.coerce.number().min(1, "Must be > 0"),
  nci: z.string().optional(),
  ncf: z.string().optional(),
  bunches: z.array(bunchItemSchema).min(1, "Each box must have at least one bunch."),
});

const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required."),
  farmDepartureDate: z.date({ required_error: "Departure date is required." }),
  flightDate: z.date({ required_error: "Flight date is required." }),
  sellerId: z.string().min(1, 'Select a seller.'),
  customerId: z.string().min(1, 'Select a customer.'),
  consignatarioId: z.string().optional(),
  farmId: z.string().min(1, 'Select a farm.'),
  carrierId: z.string().min(1, 'Select a carrier.'),
  countryId: z.string().min(1, 'Select a country.'),
  reference: z.string().optional(),
  masterAWB: z.string().min(1, 'Master AWB is required.'),
  houseAWB: z.string().min(1, 'House AWB is required.'),
  items: z.array(lineItemSchema).min(1, "At least one item is required."),
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
            console.error("Failed to parse form data from session storage", e);
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
  const [filteredConsignatarios, setFilteredConsignatarios] = useState<Consignatario[]>([]);
  const [filteredMarcaciones, setFilteredMarcaciones] = useState<Marcacion[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    mode: 'onChange',
    defaultValues: {
      items: [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'items',
  });
  
  const selectedCustomerId = form.watch('customerId');
  const watchItems = form.watch('items');
  
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


  const productTypes = useMemo(() => {
    if (!productos) return [];
    const types = productos.map(p => p.tipo);
    return [...new Set(types)];
  }, [productos]);

  const getVarietiesForProduct = (productType: string): string[] => {
      if (!productType || !productos) return [];
      const varieties = productos
          .filter(p => p.tipo === productType)
          .map(p => p.variedad);
      return [...new Set(varieties)];
  };

  useEffect(() => {
    if (selectedCustomerId) {
      const customer = customers.find(c => c.id === selectedCustomerId);
      if (customer) {
        const country = paises.find(p => p.nombre === customer.pais);
        if (country) {
          form.setValue('countryId', country.id, { shouldValidate: true });
        }
      }

      const relatedConsignatarios = consignatarios.filter(c => c.customerId === selectedCustomerId);
      setFilteredConsignatarios(relatedConsignatarios);
      
      const relatedMarcaciones = marcaciones.filter(m => m.cliente === selectedCustomerId);
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
  
  const totals = useMemo(() => {
    let totalFob = 0;
    let totalBoxes = watchItems?.length || 0;
    let totalBunches = 0;
    let totalStems = 0;
    
    watchItems?.forEach(item => {
      item.bunches.forEach(bunch => {
        const bunchesCount = Number(bunch.bunches) || 0;
        const stemsPerBunch = Number(bunch.stemsPerBunch) || 0;
        const salePrice = Number(bunch.salePrice) || 0;
        
        totalBunches += bunchesCount;
        const stemsInBunch = bunchesCount * stemsPerBunch;
        totalStems += stemsInBunch;
        totalFob += stemsInBunch * salePrice;
      });
    });

    return { totalFob, totalBoxes, totalBunches, totalStems };
  }, [watchItems]);

  const handleAddBox = () => {
    append({
      id: uuidv4(),
      boxType: 'hb',
      boxNumber: fields.length + 1,
      nci: '',
      ncf: '',
      bunches: [],
    });
  }

  const handleAddBunch = (boxIndex: number) => {
    const currentItem = form.getValues(`items.${boxIndex}`);
    const updatedBunches = [...currentItem.bunches, {
        id: uuidv4(),
        product: '',
        variety: '',
        length: 70,
        stemsPerBunch: 25,
        bunches: 1,
        purchasePrice: 0,
        salePrice: 0,
    }];
    update(boxIndex, { ...currentItem, bunches: updatedBunches });
  }

  const handleRemoveBunch = (boxIndex: number, bunchIndex: number) => {
     const currentItem = form.getValues(`items.${boxIndex}`);
     const updatedBunches = currentItem.bunches.filter((_, i) => i !== bunchIndex);
     update(boxIndex, { ...currentItem, bunches: updatedBunches });
  }
  
  async function onSubmit(values: InvoiceFormValues) {
    setIsSubmitting(true);

    const processedInvoice: Omit<Invoice, 'id'> = {
      ...values,
      consignatarioId: values.consignatarioId || '',
      reference: values.reference || '',
      farmDepartureDate: values.farmDepartureDate.toISOString(),
      flightDate: values.flightDate.toISOString(),
      status: 'Pending',
      items: values.items.map(item => ({
        ...item,
        nci: item.nci || '',
        ncf: item.ncf || '',
        bunches: item.bunches.map(bunch => ({
            ...bunch,
            purchasePrice: bunch.purchasePrice || 0,
            salePrice: bunch.salePrice || 0,
        }))
      })),
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
      console.error("Error creating invoice:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
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
            </Header>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FormField control={form.control} name="invoiceNumber" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('invoices.new.invoiceNumber')}</FormLabel>
                  <FormControl><Input placeholder={t('invoices.new.invoiceNumberPlaceholder')} {...field} value={field.value ?? ''} /></FormControl><FormMessage />
                </FormItem>
              )}/>
              <FormField control={form.control} name="farmDepartureDate" render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t('invoices.new.farmDepartureDate')}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(toDate(field.value), "PPP") : <span>{t('invoices.new.selectDate')}</span>}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
              )}/>
               <FormField control={form.control} name="flightDate" render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t('invoices.new.flightDate')}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(toDate(field.value), "PPP") : <span>{t('invoices.new.selectDate')}</span>}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date("1900-01-01")} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
              )}/>
              <FormField control={form.control} name="sellerId" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('invoices.new.seller')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ''}>
                    <FormControl><SelectTrigger><SelectValue placeholder={t('invoices.new.sellerPlaceholder')} /></SelectTrigger></FormControl>
                    <SelectContent>{vendedores.map(v => (<SelectItem key={v.id} value={v.id}>{v.nombre}</SelectItem>))}</SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )}/>
              <FormField control={form.control} name="customerId" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('invoices.new.customer')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ''}>
                    <FormControl><SelectTrigger><SelectValue placeholder={t('invoices.new.customerPlaceholder')} /></SelectTrigger></FormControl>
                    <SelectContent>{customers.map(c => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}</SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )}/>
              <FormField control={form.control} name="consignatarioId" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('invoices.new.consignee')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ''} disabled={!selectedCustomerId || filteredConsignatarios.length === 0}>
                    <FormControl><SelectTrigger><SelectValue placeholder={!selectedCustomerId ? t('invoices.new.selectCustomerFirst') : t('invoices.new.consigneePlaceholder')} /></SelectTrigger></FormControl>
                    <SelectContent>{filteredConsignatarios.map(c => (<SelectItem key={c.id} value={c.id}>{c.nombreConsignatario}</SelectItem>))}</SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )}/>
              <FormField control={form.control} name="farmId" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('invoices.new.farm')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ''}>
                    <FormControl><SelectTrigger><SelectValue placeholder={t('invoices.new.farmPlaceholder')} /></SelectTrigger></FormControl>
                    <SelectContent>{fincas.map(f => (<SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>))}</SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )}/>
              <FormField control={form.control} name="carrierId" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('invoices.new.carrier')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ''}>
                    <FormControl><SelectTrigger><SelectValue placeholder={t('invoices.new.carrierPlaceholder')} /></SelectTrigger></FormControl>
                    <SelectContent>{cargueras.map(c => (<SelectItem key={c.id} value={c.id}>{c.nombreCarguera}</SelectItem>))}</SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )}/>
              <FormField control={form.control} name="countryId" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('invoices.new.country')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ''} disabled={!!selectedCustomerId}>
                    <FormControl><SelectTrigger><SelectValue placeholder={t('invoices.new.countryPlaceholder')} /></SelectTrigger></FormControl>
                    <SelectContent>{paises.map(p => (<SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>))}</SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )}/>
               <FormField control={form.control} name="reference" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('invoices.new.reference')}</FormLabel>
                   <Select 
                      onValueChange={field.onChange} 
                      value={field.value ?? ''} 
                      disabled={!selectedCustomerId || filteredMarcaciones.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue 
                            placeholder={
                              !selectedCustomerId 
                                ? t('invoices.new.selectCustomerFirst')
                                : filteredMarcaciones.length === 0 
                                  ? t('invoices.new.noMarkings')
                                  : t('invoices.new.markingPlaceholder')
                            } 
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredMarcaciones.map(m => (
                          <SelectItem key={m.id} value={m.numeroMarcacion}>
                            {m.numeroMarcacion}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  <FormMessage />
                </FormItem>
              )}/>
               <FormField control={form.control} name="masterAWB" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('invoices.new.masterAWB')}</FormLabel>
                  <FormControl><Input placeholder={t('invoices.new.masterAWBPlaceholder')} {...field} value={field.value ?? ''} /></FormControl><FormMessage />
                </FormItem>
              )}/>
              <FormField control={form.control} name="houseAWB" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('invoices.new.houseAWB')}</FormLabel>
                  <FormControl><Input placeholder={t('invoices.new.houseAWBPlaceholder')} {...field} value={field.value ?? ''} /></FormControl><FormMessage />
                </FormItem>
              )}/>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>{t('invoices.new.itemsTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              {fields.map((field, boxIndex) => (
                <div key={field.id} className="p-4 border rounded-lg mb-4 space-y-4 bg-muted/20">
                  <div className="flex items-end gap-4 flex-wrap">
                    <FormField control={form.control} name={`items.${boxIndex}.boxNumber`} render={({ field }) => <FormItem><FormLabel>Box #</FormLabel><FormControl><Input type="number" {...field} className="w-24" /></FormControl></FormItem>} />
                    <FormField control={form.control} name={`items.${boxIndex}.boxType`} render={({ field }) => <FormItem><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="w-28"><SelectValue placeholder="Type" /></SelectTrigger></FormControl><SelectContent><SelectItem value="qb">QB</SelectItem><SelectItem value="eb">EB</SelectItem><SelectItem value="hb">HB</SelectItem></SelectContent></Select></FormItem>} />
                    <FormField control={form.control} name={`items.${boxIndex}.nci`} render={({ field }) => <FormItem><FormLabel>NCI</FormLabel><FormControl><Input {...field} value={field.value ?? ''} className="w-24" /></FormControl></FormItem>} />
                    <FormField control={form.control} name={`items.${boxIndex}.ncf`} render={({ field }) => <FormItem><FormLabel>NCF</FormLabel><FormControl><Input {...field} value={field.value ?? ''} className="w-24" /></FormControl></FormItem>} />
                    <div className="ml-auto flex items-center gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => handleAddBunch(boxIndex)}><PlusCircle className="mr-2 h-4 w-4"/> Add Bunch</Button>
                        <Button type="button" variant="destructive" size="icon" onClick={() => remove(boxIndex)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  
                  <div className="pl-4 border-l-2 border-primary/50">
                    <Controller
                        control={form.control}
                        name={`items.${boxIndex}.bunches`}
                        render={({ field }) => (
                            <useFieldArray
                                control={form.control}
                                name={`items.${boxIndex}.bunches`}
                                render={({ fields: bunchFields, append: appendBunch, remove: removeBunch, update: updateBunch }) => (
                                    <>
                                        {bunchFields.map((bunchField, bunchIndex) => {
                                            const currentProductType = form.watch(`items.${boxIndex}.bunches.${bunchIndex}.product`);
                                            const varieties = getVarietiesForProduct(currentProductType);
                                            return (
                                                <div key={bunchField.id} className="flex items-center gap-2 py-2 border-b border-dashed">
                                                    <FormField control={form.control} name={`items.${boxIndex}.bunches.${bunchIndex}.product`} render={({ field }) => (<Select onValueChange={(v) => { field.onChange(v); form.setValue(`items.${boxIndex}.bunches.${bunchIndex}.variety`, ''); }} value={field.value}><FormControl><SelectTrigger className="w-32"><SelectValue placeholder="Product" /></SelectTrigger></FormControl><SelectContent>{productTypes.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select>)}/>
                                                    <FormField control={form.control} name={`items.${boxIndex}.bunches.${bunchIndex}.variety`} render={({ field }) => (<Select onValueChange={field.onChange} value={field.value} disabled={!currentProductType || varieties.length === 0}><FormControl><SelectTrigger className="w-32"><SelectValue placeholder="Variety" /></SelectTrigger></FormControl><SelectContent>{varieties.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select>)} />
                                                    <FormField control={form.control} name={`items.${boxIndex}.bunches.${bunchIndex}.length`} render={({ field }) => <Input type="number" placeholder="L" {...field} className="w-16" />} />
                                                    <FormField control={form.control} name={`items.${boxIndex}.bunches.${bunchIndex}.stemsPerBunch`} render={({ field }) => <Input type="number" placeholder="Stems" {...field} className="w-20" />} />
                                                    <FormField control={form.control} name={`items.${boxIndex}.bunches.${bunchIndex}.bunches`} render={({ field }) => <Input type="number" placeholder="Bunches" {...field} className="w-20" />} />
                                                    <FormField control={form.control} name={`items.${boxIndex}.bunches.${bunchIndex}.purchasePrice`} render={({ field }) => <Input type="number" step="0.01" placeholder="Cost" {...field} className="w-20" />} />
                                                    <FormField control={form.control} name={`items.${boxIndex}.bunches.${bunchIndex}.salePrice`} render={({ field }) => <Input type="number" step="0.01" placeholder="Price" {...field} className="w-20" />} />
                                                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveBunch(boxIndex, bunchIndex)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                </div>
                                            );
                                        })}
                                    </>
                                )}
                            />
                        )}
                    />
                     <FormMessage>{form.formState.errors.items?.[boxIndex]?.bunches?.message}</FormMessage>
                  </div>
                </div>
              ))}
              <div className="mt-6 flex justify-end">
                  <Button type="button" variant="outline" size="sm" onClick={handleAddBox}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Box
                  </Button>
              </div>
              <FormMessage>{form.formState.errors.items?.message}</FormMessage>
            </CardContent>
             <CardContent>
                <Table>
                    <TableFooter>
                      <TableRow className="border-t-2 border-border bg-muted/50 font-bold hover:bg-muted/50">
                        <TableCell>Boxes: {totals.totalBoxes}</TableCell>
                        <TableCell>Bunches: {totals.totalBunches}</TableCell>
                        <TableCell>Stems: {totals.totalStems}</TableCell>
                        <TableCell className="text-right text-lg">TOTAL FOB</TableCell>
                        <TableCell className="text-lg text-right font-bold pr-4">${(totals.totalFob || 0).toFixed(2)}</TableCell>
                      </TableRow>
                    </TableFooter>
                </Table>
             </CardContent>
          </Card>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.push('/invoices')} disabled={isSubmitting}>{t('common.cancel')}</Button>
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
