

'use client'

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, toDate } from 'date-fns';
import { CalendarIcon, Trash2, PlusCircle, Loader2, AlertTriangle, CornerDownRight } from 'lucide-react';

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

import { addInvoice } from '@/services/invoices';
import type { Invoice, Consignatario, Marcacion } from '@/lib/types';
import { useAppData } from '@/context/app-data-context';

const lineItemSchema = z.object({
  id: z.string().optional(),
  boxType: z.enum(['qb', 'eb', 'hb'], { required_error: "Seleccione un tipo." }),
  boxCount: z.coerce.number().min(0, "Debe ser >= 0"),
  boxNumber: z.string().optional(),
  bunchCount: z.coerce.number().min(0, "Debe ser >= 0"),
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
  reference: z.string().min(1, "Referencia es requerida."),
  masterAWB: z.string().min(1, 'Guía Madre requerida.'),
  houseAWB: z.string().min(1, 'Guía Hija requerida.'),
  items: z.array(lineItemSchema).min(0),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export function NewInvoiceForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { customers, fincas, vendedores, cargueras, paises, consignatarios, productos, marcaciones } = useAppData();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filteredConsignatarios, setFilteredConsignatarios] = useState<Consignatario[]>([]);
  const [filteredMarcaciones, setFilteredMarcaciones] = useState<Marcacion[]>([]);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    mode: 'onChange',
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
  const isHeaderSet = watchItems.length > 0;

  const productTypes = useMemo(() => {
    if (!productos) return [];
    const types = productos.map(p => p.tipo);
    return [...new Set(types)];
  }, [productos]);

  const getVarietiesForProduct = useCallback((productType: string): string[] => {
      if (!productType || !productos) return [];
      const varieties = productos
          .filter(p => p.tipo === productType)
          .map(p => p.variedad);
      return [...new Set(varieties)];
  }, [productos]);

  useEffect(() => {
    if (selectedCustomerId) {
      const relatedConsignatarios = consignatarios.filter(c => c.customerId === selectedCustomerId);
      setFilteredConsignatarios(relatedConsignatarios);
      form.setValue('consignatarioId', '');
      
      const relatedMarcaciones = marcaciones.filter(m => m.cliente === selectedCustomerId);
      setFilteredMarcaciones(relatedMarcaciones);
      form.setValue('reference', '');
    } else {
      setFilteredConsignatarios([]);
      setFilteredMarcaciones([]);
      form.setValue('consignatarioId', '');
      form.setValue('reference', '');
    }
  }, [selectedCustomerId, consignatarios, marcaciones, form]);
  
  const handleAddSubItem = (parentIndex: number) => {
    insert(parentIndex + 1, {
      boxType: 'qb',
      boxCount: 1,
      bunchCount: 0,
      product: '',
      variety: '',
      length: 70,
      stemCount: 25,
      purchasePrice: 0,
      salePrice: 0,
      isSubItem: true,
    });
  };

  const getCalculations = useCallback((item: any) => {
    const salePrice = Number(item?.salePrice) || 0;
    const stemCount = Number(item?.stemCount) || 0;
    const bunchCount = Number(item?.bunchCount) || 0;

    const stemsPerBox = bunchCount * stemCount;
    const lineTotal = salePrice * stemsPerBox;
    
    return {
      stemsPerBox,
      lineTotal,
    };
  }, []);

  const totals = useMemo(() => {
    let totalBoxCount = 0;
    let totalBunches = 0;
    let totalStemsByBox = 0;
    let grandTotal = 0;
  
    watchItems.forEach((item) => {
      if (!item) return;
  
      const boxCount = Number(item.boxCount) || 0;
      const bunchCount = Number(item.bunchCount) || 0;
      const stemCount = Number(item.stemCount) || 0;
      const salePrice = Number(item.salePrice) || 0;
  
      if(!item.isSubItem) {
        totalBoxCount += boxCount;
      }
      
      totalBunches += bunchCount;
      
      const currentStems = bunchCount * stemCount;
      totalStemsByBox += currentStems;
      grandTotal += currentStems * salePrice;
    });
  
    return {
        totalBoxCount,
        totalBunches,
        totalStemsByBox,
        grandTotal,
    };
  }, [watchItems]);


  const handleAddItem = async () => {
     const headerFields: (keyof InvoiceFormValues)[] = [
      'invoiceNumber',
      'farmDepartureDate', 'flightDate', 'sellerId', 'customerId', 
      'consignatarioId', 'farmId', 'carrierId', 'countryId', 
      'masterAWB', 'houseAWB'
    ];
    const result = await form.trigger(headerFields);
    if (result) {
       append({ 
         boxType: 'qb', 
         boxCount: 1, 
         bunchCount: 0, 
         product: '', 
         variety: '', 
         length: 70, 
         stemCount: 25, 
         purchasePrice: 0, 
         salePrice: 0, 
         isSubItem: false, 
       });
    } else {
       toast({
        title: 'Error de Validación',
        description: 'Por favor, complete todos los campos del encabezado antes de añadir ítems.',
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
      items: values.items.map(item => ({...item, bunchesPerBox: item.bunchCount}))
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
                  <Select onValueChange={field.onChange} value={field.value || ''} disabled={isHeaderSet || !selectedCustomerId || filteredConsignatarios.length === 0}>
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
                   <Select 
                      onValueChange={field.onChange} 
                      value={field.value || ''} 
                      disabled={isHeaderSet || !selectedCustomerId || filteredMarcaciones.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue 
                            placeholder={
                              !selectedCustomerId 
                                ? "Seleccione un cliente primero" 
                                : filteredMarcaciones.length === 0 
                                  ? "El cliente no tiene marcaciones" 
                                  : "Seleccione una marcación"
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

          
            <Card>
              <CardHeader>
                <CardTitle>Items de la Factura</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">N°</TableHead>
                        <TableHead className="w-[130px]">Tipo Caja</TableHead>
                        <TableHead className="w-24">N° Cajas</TableHead>
                        <TableHead className="w-24">N° Bunches</TableHead>
                        <TableHead className="min-w-[160px]">Producto</TableHead>
                        <TableHead className="min-w-[160px]">Variedad</TableHead>
                        <TableHead className="w-24">Longitud</TableHead>
                        <TableHead className="w-24">Tallos/Bunch</TableHead>
                        <TableHead className="w-24">P. Compra</TableHead>
                        <TableHead className="w-24">P. Venta</TableHead>
                        <TableHead className="w-[160px]">Total Tallos/Caja</TableHead>
                        <TableHead className="w-[140px] text-right">Total</TableHead>
                        <TableHead className="w-[80px]">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.map((field, index) => {
                         const currentItem = watchItems[index];
                         const isSubItem = currentItem.isSubItem;
                         const { lineTotal, stemsPerBox } = getCalculations(currentItem);
                         const varietiesForProduct = getVarietiesForProduct(currentItem?.product);

                         return (
                          <TableRow key={field.id} className={cn(isSubItem && "bg-accent/50")}>
                            <TableCell className={cn("text-center font-medium", isSubItem && "pl-8")}>
                                {index + 1}
                            </TableCell>
                            <TableCell><FormField control={form.control} name={`items.${index}.boxType`} render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl><SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger></FormControl>
                                  <SelectContent><SelectItem value="qb">QB</SelectItem><SelectItem value="eb">EB</SelectItem><SelectItem value="hb">HB</SelectItem></SelectContent>
                                </Select>
                            )} /></TableCell>
                             <TableCell>
                                <FormField control={form.control} name={`items.${index}.boxCount`} render={({ field }) => (
                                    <Input type="number" {...field} className="w-20" />
                                )} />
                            </TableCell>
                            <TableCell>
                               <FormField control={form.control} name={`items.${index}.bunchCount`} render={({ field }) => (
                                    <Input type="number" {...field} className="w-20" />
                                  )} />
                            </TableCell>
                            <TableCell>
                               <FormField control={form.control} name={`items.${index}.product`} render={({ field }) => (
                                  <Select 
                                    onValueChange={(value) => {
                                      field.onChange(value);
                                      form.setValue(`items.${index}.variety`, '');
                                    }} 
                                    value={field.value}
                                  >
                                    <FormControl><SelectTrigger><SelectValue placeholder="Producto" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                      {productTypes.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                              )} />
                            </TableCell>
                            <TableCell>
                              <FormField control={form.control} name={`items.${index}.variety`} render={({ field }) => (
                                  <Select 
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    disabled={!currentItem?.product || varietiesForProduct.length === 0}
                                  >
                                    <FormControl><SelectTrigger><SelectValue placeholder="Variedad" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                      {varietiesForProduct.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                              )} />
                            </TableCell>
                            <TableCell><FormField control={form.control} name={`items.${index}.length`} render={({ field }) => <Input type="number" {...field} className="w-20" />} /></TableCell>
                            <TableCell><FormField control={form.control} name={`items.${index}.stemCount`} render={({ field }) => <Input type="number" {...field} className="w-20" />} /></TableCell>
                            <TableCell><FormField control={form.control} name={`items.${index}.purchasePrice`} render={({ field }) => <Input type="number" step="0.01" {...field} className="w-20" />} /></TableCell>
                            <TableCell><FormField control={form.control} name={`items.${index}.salePrice`} render={({ field }) => <Input type="number" step="0.01" {...field} className="w-20" />} /></TableCell>
                            <TableCell className="text-center font-medium">{stemsPerBox}</TableCell>
                            <TableCell className="font-semibold text-right pr-4">${lineTotal.toFixed(2)}</TableCell>
                            <TableCell className="flex items-center gap-1">
                              {!isSubItem && (
                                <Button type="button" variant="ghost" size="icon" title="Añadir Sub-ítem" onClick={() => handleAddSubItem(index)}>
                                  <CornerDownRight className="h-4 w-4" />
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
                        <TableCell className="text-center">
                          {totals.totalBoxCount || 0}
                        </TableCell>
                         <TableCell className="text-center">
                           {totals.totalBunches || 0}
                        </TableCell>
                        <TableCell colSpan={6}></TableCell>
                         <TableCell className="text-center">
                          {totals.totalStemsByBox || 0}
                        </TableCell>
                        <TableCell className="text-right pr-4 font-bold text-lg">
                           ${(totals.grandTotal || 0).toFixed(2)}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
                <div className="mt-6 flex justify-end">
                    <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Añadir Item
                    </Button>
                </div>
              </CardContent>
            </Card>
          
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
