'use client'

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, toDate } from 'date-fns';
import { CalendarIcon, Trash2, PlusCircle, GitFork, Loader2, CornerDownRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

import { addInvoice } from '@/services/invoices';
import type { Invoice, Consignatario } from '@/lib/types';
import { useAppData } from '@/context/app-data-context';

const lineItemSchema = z.object({
  id: z.string().optional(),
  boxType: z.enum(['qb', 'eb', 'hb'], { required_error: "Seleccione un tipo." }),
  boxCount: z.coerce.number().positive("Debe ser > 0"),
  boxNumber: z.string().optional(),
  bunchCount: z.coerce.number().min(0, "Debe ser >= 0"),
  bunchesPerBox: z.coerce.number().positive("Debe ser > 0"),
  product: z.string().min(1, "Producto requerido."),
  variety: z.string().min(1, "Variedad requerida."),
  length: z.coerce.number().positive("Debe ser > 0"),
  stemCount: z.coerce.number().positive("Debe ser > 0"),
  purchasePrice: z.coerce.number().min(0, "Debe ser >= 0"),
  salePrice: z.coerce.number().min(0, "Debe ser >= 0"),
  isSubItem: z.boolean().optional(),
});

const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Número de factura requerido."),
  farmDepartureDate: z.date({ required_error: "Fecha de salida requerida." }),
  flightDate: z.date({ required_error: "Fecha de vuelo requerida." }),
  sellerId: z.string().min(1, 'Seleccione un vendedor.'),
  customerId: z.string().min(1, 'Seleccione un cliente.'),
  consignatarioId: z.string().min(1, 'Seleccione un consignatario.'),
  farmId: z.string().min(1, 'Seleccione una finca.'),
  carrierId: z.string().min(1, 'Seleccione una carguera.'),
  countryId: z.string().min(1, 'Seleccione un país.'),
  reference: z.string().optional(),
  masterAWB: z.string().min(1, 'Guía Madre requerida.'),
  houseAWB: z.string().min(1, 'Guía Hija requerida.'),
  items: z.array(lineItemSchema).min(0),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export function NewInvoiceForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { customers, fincas, vendedores, cargueras, paises, consignatarios, productos } = useAppData();

  const [isHeaderSet, setIsHeaderSet] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filteredConsignatarios, setFilteredConsignatarios] = useState<Consignatario[]>([]);
  const [bunchWarnings, setBunchWarnings] = useState<Record<number, string | null>>({});

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      items: [],
      reference: '',
      invoiceNumber: '',
      consignatarioId: '',
    },
  });

  const { fields, append, remove, insert } = useFieldArray({
    control: form.control,
    name: 'items',
  });
  
  const selectedCustomerId = form.watch('customerId');
  const watchItems = form.watch('items');

  const productNames = useMemo(() => {
    if (!productos) return [];
    const names = productos.map(p => p.nombre);
    return [...new Set(names)];
  }, [productos]);

  const getVarietiesForProduct = useCallback((productName: string): string[] => {
      if (!productName || !productos) return [];
      const varieties = productos
          .filter(p => p.nombre === productName)
          .map(p => p.variedad);
      return [...new Set(varieties)];
  }, [productos]);

  useEffect(() => {
    if (selectedCustomerId) {
      const relatedConsignatarios = consignatarios.filter(c => c.customerId === selectedCustomerId);
      setFilteredConsignatarios(relatedConsignatarios);
      form.setValue('consignatarioId', '');
    } else {
      setFilteredConsignatarios([]);
    }
  }, [selectedCustomerId, consignatarios, form]);

  useEffect(() => {
    const subscription = form.watch((values, { name, type }) => {
        const items = values.items || [];
        const newWarnings: Record<number, string | null> = {};

        if (type === 'change' && name?.match(/^items\.\d+\.bunchesPerBox$/)) {
            const changedIndex = parseInt(name.split('.')[1], 10);
            const parentItem = items[changedIndex];
            if (!parentItem.isSubItem) {
                const parentBunchesPerBox = Number(parentItem.bunchesPerBox) || 0;
                for (let i = changedIndex + 1; i < items.length; i++) {
                    if (items[i].isSubItem) {
                        const currentSubItem = form.getValues(`items.${i}`);
                        form.setValue(`items.${i}`, {
                            ...currentSubItem,
                            bunchesPerBox: parentBunchesPerBox,
                            bunchCount: parentBunchesPerBox,
                        });
                    } else {
                        break;
                    }
                }
            }
        }

        items.forEach((item, index) => {
            if (!item.isSubItem) {
                let subItemsBunchSum = 0;
                let subItemCount = 0;
                
                for (let i = index + 1; i < items.length; i++) {
                    if (items[i]?.isSubItem) {
                        subItemsBunchSum += Number(items[i].bunchCount) || 0;
                        subItemCount++;
                    } else {
                        break;
                    }
                }

                if (subItemCount > 0) {
                    const parentBunchCount = Number(item.bunchCount) || 0;
                    if (subItemsBunchSum > parentBunchCount) {
                        newWarnings[index] = `Suma (${subItemsBunchSum}) excede total (${parentBunchCount}).`;
                    } else if (subItemsBunchSum < parentBunchCount) {
                        newWarnings[index] = `Suma (${subItemsBunchSum}) es menor al total (${parentBunchCount}).`;
                    }
                }
            }
        });
        setBunchWarnings(newWarnings);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const getCalculations = useCallback((item: any) => {
    const purchasePrice = Number(item.purchasePrice) || 0;
    const salePrice = Number(item.salePrice) || 0;
    const stemCount = Number(item.stemCount) || 0;
    const bunchCount = Number(item.bunchCount) || 0;
    const bunchesPerBox = Number(item.bunchesPerBox) || 0;

    const stemsPerBox = bunchesPerBox * stemCount;
    const totalStemsForLine = bunchCount * stemCount;
    const total = salePrice * totalStemsForLine;
    const difference = salePrice - purchasePrice;
    
    return { difference, total, totalStems: stemsPerBox };
  }, []);

  const totals = useMemo(() => {
    return watchItems.reduce((acc, item) => {
        const { total, totalStems } = getCalculations(item);
        if (!item.isSubItem) {
             acc.boxCount += Number(item.boxCount) || 0;
        }
        acc.bunchCount += Number(item.bunchCount) || 0;
        acc.bunchesPerBox += Number(item.bunchesPerBox) || 0;
        acc.totalStemsByBox += totalStems;
        acc.grandTotal += total;

        return acc;
    }, {
        boxCount: 0,
        bunchCount: 0,
        bunchesPerBox: 0,
        totalStemsByBox: 0,
        grandTotal: 0,
    });
  }, [watchItems, getCalculations]);


  async function handleHeaderSubmit() {
    const headerFields: (keyof InvoiceFormValues)[] = [
      'invoiceNumber',
      'farmDepartureDate', 'flightDate', 'sellerId', 'customerId', 
      'consignatarioId', 'farmId', 'carrierId', 'countryId', 
      'masterAWB', 'houseAWB'
    ];
    const result = await form.trigger(headerFields);
    if (result) {
      setIsHeaderSet(true);
    } else {
       toast({
        title: 'Error de Validación',
        description: 'Por favor, complete todos los campos del encabezado.',
        variant: 'destructive',
      });
    }
  }

  async function onSubmit(values: InvoiceFormValues) {
    if (values.items.length === 0) {
      toast({
        title: 'Factura Vacía',
        description: 'Por favor, añada al menos un ítem a la factura.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    const invoiceData: Omit<Invoice, 'id' | 'status'> = {
      ...values,
      farmDepartureDate: values.farmDepartureDate.toISOString(),
      flightDate: values.flightDate.toISOString(),
    };

    try {
      await addInvoice(invoiceData);
      toast({
        title: 'Factura Creada!',
        description: 'La nueva factura ha sido guardada exitosamente.',
      });
      router.push('/invoices');
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast({
        title: 'Error',
        description: 'No se pudo crear la factura. Verifique sus reglas de seguridad de Firestore.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const getDisplayIndex = (index: number) => {
      const items = form.getValues('items');
      if (!items || !items[index]) return (index + 1).toString();
      
      const currentItem = items[index];

      if (!currentItem.isSubItem) {
          const mainItemIndex = items.slice(0, index + 1).filter(item => !item.isSubItem).length;
          return mainItemIndex.toString();
      }

      let parentIndex = -1;
      for (let i = index - 1; i >= 0; i--) {
          if (!items[i].isSubItem) {
              parentIndex = i;
              break;
          }
      }
      
      if (parentIndex === -1) return `${index + 1}`;

      const mainParentIndex = items.slice(0, parentIndex + 1).filter(item => !item.isSubItem).length;
      const subItemIndexForParent = items.slice(parentIndex + 1, index + 1).filter(item => item.isSubItem).length;
      
      return `${mainParentIndex}.${subItemIndexForParent}`;
  };
  
  function handleAddSubItem(parentIndex: number) {
    const items = form.getValues('items');
    const parentItem = items[parentIndex];

    let subItemsForParentCount = 0;
    for (let i = parentIndex + 1; i < items.length; i++) {
      if (items[i].isSubItem) {
        subItemsForParentCount++;
      } else {
        break;
      }
    }

    if (subItemsForParentCount >= (parentItem.boxCount || 0)) {
      toast({
        title: 'Límite de Cajas Alcanzado',
        description: `No puede añadir más de ${parentItem.boxCount} sub-ítems para esta fila.`,
        variant: 'destructive',
      });
      return;
    }
    
    const mainParentDisplayIndex = getDisplayIndex(parentIndex);
    const newBoxNumber = `${mainParentDisplayIndex}-${subItemsForParentCount + 1}`;
    
    const subItemData: InvoiceFormValues['items'][number] = {
      ...parentItem,
      id: undefined, 
      isSubItem: true,
      boxCount: 1,
      boxNumber: newBoxNumber,
      bunchCount: Number(parentItem.bunchesPerBox) || 0,
      bunchesPerBox: Number(parentItem.bunchesPerBox) || 0,
    };
    
    const insertionIndex = parentIndex + 1 + subItemsForParentCount;

    insert(insertionIndex, subItemData);
    toast({
      title: 'Sub-ítem añadido',
      description: `Añadido debajo de la fila ${mainParentDisplayIndex}.`,
    });
  }

  return (
    <div className="space-y-6">
       <div>
          <h2 className="text-3xl font-bold tracking-tight font-headline">Nueva Venta</h2>
          <p className="text-muted-foreground">Crear una nueva factura de venta.</p>
        </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          <Card>
            <CardHeader>
              <CardTitle>Datos de la Factura</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FormField control={form.control} name="invoiceNumber" render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Factura</FormLabel>
                  <FormControl><Input placeholder="FACT-001" {...field} disabled={isHeaderSet} /></FormControl><FormMessage />
                </FormItem>
              )}/>
              <FormField control={form.control} name="farmDepartureDate" render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha Salida Finca</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant={"outline"} disabled={isHeaderSet} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                            {field.value ? format(toDate(field.value), "PPP") : <span>Seleccione fecha</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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
                    <FormLabel>Fecha Vuelo</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant={"outline"} disabled={isHeaderSet} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                            {field.value ? format(toDate(field.value), "PPP") : <span>Seleccione fecha</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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
                  <FormLabel>Vendedor</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isHeaderSet}>
                    <FormControl><SelectTrigger><SelectValue placeholder={"Seleccione un vendedor"} /></SelectTrigger></FormControl>
                    <SelectContent>{vendedores.map(v => (<SelectItem key={v.id} value={v.id}>{v.nombre}</SelectItem>))}</SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )}/>
              <FormField control={form.control} name="customerId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isHeaderSet}>
                    <FormControl><SelectTrigger><SelectValue placeholder={"Seleccione un cliente"} /></SelectTrigger></FormControl>
                    <SelectContent>{customers.map(c => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}</SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )}/>
              <FormField control={form.control} name="consignatarioId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Consignatario</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isHeaderSet || !selectedCustomerId || filteredConsignatarios.length === 0}>
                    <FormControl><SelectTrigger><SelectValue placeholder={!selectedCustomerId ? "Seleccione un cliente primero" : "Seleccione un consignatario"} /></SelectTrigger></FormControl>
                    <SelectContent>{filteredConsignatarios.map(c => (<SelectItem key={c.id} value={c.id}>{c.nombreConsignatario}</SelectItem>))}</SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )}/>
              <FormField control={form.control} name="farmId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Finca</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isHeaderSet}>
                    <FormControl><SelectTrigger><SelectValue placeholder={"Seleccione una finca"} /></SelectTrigger></FormControl>
                    <SelectContent>{fincas.map(f => (<SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>))}</SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )}/>
              <FormField control={form.control} name="carrierId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Carguera</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isHeaderSet}>
                    <FormControl><SelectTrigger><SelectValue placeholder={"Seleccione una carguera"} /></SelectTrigger></FormControl>
                    <SelectContent>{cargueras.map(c => (<SelectItem key={c.id} value={c.id}>{c.nombreCarguera}</SelectItem>))}</SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )}/>
              <FormField control={form.control} name="countryId" render={({ field }) => (
                <FormItem>
                  <FormLabel>País</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isHeaderSet}>
                    <FormControl><SelectTrigger><SelectValue placeholder={"Seleccione un país"} /></SelectTrigger></FormControl>
                    <SelectContent>{paises.map(p => (<SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>))}</SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )}/>
               <FormField control={form.control} name="reference" render={({ field }) => (
                <FormItem>
                  <FormLabel>Referencia (Mark)</FormLabel>
                  <FormControl><Input placeholder="Referencia" {...field} disabled={isHeaderSet} /></FormControl><FormMessage />
                </FormItem>
              )}/>
               <FormField control={form.control} name="masterAWB" render={({ field }) => (
                <FormItem>
                  <FormLabel>Guía Madre</FormLabel>
                  <FormControl><Input placeholder="Guía Madre" {...field} disabled={isHeaderSet} /></FormControl><FormMessage />
                </FormItem>
              )}/>
              <FormField control={form.control} name="houseAWB" render={({ field }) => (
                <FormItem>
                  <FormLabel>Guía Hija</FormLabel>
                  <FormControl><Input placeholder="Guía Hija" {...field} disabled={isHeaderSet} /></FormControl><FormMessage />
                </FormItem>
              )}/>
            </CardContent>
          </Card>

          {!isHeaderSet && (
             <div className="flex justify-end">
              <Button type="button" onClick={handleHeaderSubmit}>
                Crear Factura y Añadir Items
              </Button>
            </div>
          )}

          {isHeaderSet && (
            <Card>
              <CardHeader>
                <CardTitle>Items de la Factura</CardTitle>
                <CardDescription>Añada los productos a la factura.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">N°</TableHead>
                        <TableHead>Tipo Caja</TableHead>
                        <TableHead>N° Cajas</TableHead>
                        <TableHead>N° Bunches</TableHead>
                        <TableHead>Bunches/Caja</TableHead>
                        <TableHead>Producto</TableHead>
                        <TableHead>Variedad</TableHead>
                        <TableHead>Longitud</TableHead>
                        <TableHead>Tallos/Bunch</TableHead>
                        <TableHead>Total Tallos/Caja</TableHead>
                        <TableHead>P. Compra</TableHead>
                        <TableHead>P. Venta</TableHead>
                        <TableHead>Diferencia</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead className="w-[100px]">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.map((field, index) => {
                         const isSubItem = watchItems[index].isSubItem;
                         const displayIndex = getDisplayIndex(index);
                         const { difference, total, totalStems } = getCalculations(watchItems[index]);
                         const varietiesForProduct = getVarietiesForProduct(watchItems[index]?.product);

                         return (
                          <TableRow key={field.id} className={cn(isSubItem && "bg-accent/50")}>
                            <TableCell className="relative">
                                {isSubItem && (
                                    <div className="absolute left-2 top-1/2 -translate-y-1/2">
                                        <CornerDownRight className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                )}
                                <span className={cn(isSubItem && "pl-6")}>
                                    {displayIndex}
                                </span>
                            </TableCell>
                            <TableCell><FormField control={form.control} name={`items.${index}.boxType`} render={({ field }) => (
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubItem}>
                                  <FormControl><SelectTrigger className="min-w-[80px]"><SelectValue placeholder="Tipo" /></SelectTrigger></FormControl>
                                  <SelectContent><SelectItem value="qb">QB</SelectItem><SelectItem value="eb">EB</SelectItem><SelectItem value="hb">HB</SelectItem></SelectContent>
                                </Select>
                            )} /></TableCell>
                            <TableCell>
                              {isSubItem ? (
                                <FormField control={form.control} name={`items.${index}.boxNumber`} render={({ field }) => (
                                    <Input {...field} className="min-w-[80px]" disabled />
                                )} />
                              ) : (
                                <FormField control={form.control} name={`items.${index}.boxCount`} render={({ field }) => (
                                    <Input type="number" {...field} className="min-w-[80px]" />
                                )} />
                              )}
                            </TableCell>
                            <TableCell>
                              <FormField control={form.control} name={`items.${index}.bunchCount`} render={({ field }) => <Input type="number" {...field} className="min-w-[80px]" disabled={isSubItem} />} />
                              {!isSubItem && bunchWarnings[index] && (
                                <p className="text-xs text-destructive mt-1 w-[120px]">{bunchWarnings[index]}</p>
                              )}
                            </TableCell>
                            <TableCell><FormField control={form.control} name={`items.${index}.bunchesPerBox`} render={({ field }) => <Input type="number" {...field} className="min-w-[110px]" disabled={isSubItem} />} /></TableCell>
                            <TableCell>
                               <FormField control={form.control} name={`items.${index}.product`} render={({ field }) => (
                                  <Select 
                                    onValueChange={(value) => {
                                      field.onChange(value);
                                      form.setValue(`items.${index}.variety`, '');
                                    }} 
                                    value={field.value}
                                  >
                                    <FormControl><SelectTrigger className="min-w-[150px]"><SelectValue placeholder="Producto" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                      {productNames.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                              )} />
                            </TableCell>
                            <TableCell>
                              <FormField control={form.control} name={`items.${index}.variety`} render={({ field }) => (
                                  <Select 
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    disabled={!watchItems[index]?.product || varietiesForProduct.length === 0}
                                  >
                                    <FormControl><SelectTrigger className="min-w-[150px]"><SelectValue placeholder="Variedad" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                      {varietiesForProduct.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                              )} />
                            </TableCell>
                            <TableCell><FormField control={form.control} name={`items.${index}.length`} render={({ field }) => <Input type="number" {...field} className="min-w-[80px]"/>} /></TableCell>
                            <TableCell><FormField control={form.control} name={`items.${index}.stemCount`} render={({ field }) => <Input type="number" {...field} className="min-w-[80px]"/>} /></TableCell>
                            <TableCell className="min-w-[100px]">{totalStems}</TableCell>
                            <TableCell><FormField control={form.control} name={`items.${index}.purchasePrice`} render={({ field }) => <Input type="number" step="0.01" {...field} className="min-w-[100px]"/>} /></TableCell>
                            <TableCell><FormField control={form.control} name={`items.${index}.salePrice`} render={({ field }) => <Input type="number" step="0.01" {...field} className="min-w-[100px]"/>} /></TableCell>
                            <TableCell className="min-w-[100px]">${difference.toFixed(2)}</TableCell>
                            <TableCell className="min-w-[100px]">${total.toFixed(2)}</TableCell>
                            <TableCell className="flex items-center gap-1">
                              {!isSubItem && (
                                <Button type="button" variant="ghost" size="icon" onClick={() => handleAddSubItem(index)} title="Crear sub-fila">
                                  <GitFork className="h-4 w-4" />
                                </Button>
                              )}
                              <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                    <TableFooter>
                      <TableRow className="border-t-2 border-border bg-muted/50 font-bold hover:bg-muted/50">
                        <TableCell colSpan={2} className="text-right">TOTALES</TableCell>
                        <TableCell>
                          <Input value={totals.boxCount} disabled className="min-w-[80px] bg-muted font-bold text-center" />
                        </TableCell>
                        <TableCell>
                           <Input value={totals.bunchCount} disabled className="min-w-[80px] bg-muted font-bold text-center" />
                        </TableCell>
                        <TableCell>
                          <Input value={totals.bunchesPerBox} disabled className="min-w-[110px] bg-muted font-bold text-center" />
                        </TableCell>
                        <TableCell colSpan={4}></TableCell>
                        <TableCell>
                          <Input value={totals.totalStemsByBox} disabled className="min-w-[100px] bg-muted font-bold text-center" />
                        </TableCell>
                        <TableCell colSpan={3}></TableCell>
                        <TableCell>
                          <Input value={`$${totals.grandTotal.toFixed(2)}`} disabled className="min-w-[100px] bg-muted font-bold text-right" />
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
                <div className="mt-6 flex justify-end">
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ boxType: 'qb', boxCount: 1, bunchCount: 1, bunchesPerBox: 1, product: '', variety: '', length: 70, stemCount: 25, purchasePrice: 0, salePrice: 0, isSubItem: false, boxNumber: '' })}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Añadir Item
                    </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {isHeaderSet && (
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.push('/invoices')} disabled={isSubmitting}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Guardando Factura...' : 'Guardar Factura'}
              </Button>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}
