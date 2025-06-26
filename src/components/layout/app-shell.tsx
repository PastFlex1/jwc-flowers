'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarInset,
  SidebarFooter,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  Flower2,
  FileText,
  Users,
  Leaf,
  Database,
  Settings,
  Plus,
} from 'lucide-react';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from '@/components/ui/menubar';

const navItems = [
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/inventory', label: 'Inventory', icon: Leaf },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <Flower2 className="h-6 w-6 text-primary" />
            </Button>
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold font-headline">JCW FLOWERS</h2>
              <p className="text-sm text-muted-foreground">For Florists</p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(item.href)}
                className="gap-3"
              >
                <Link href={item.href}>
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        <SidebarFooter className="p-4 mt-auto">
           <div className="flex items-center gap-3 w-full px-2 h-12">
              <Database className="h-6 w-6 text-muted-foreground" />
              <div className="flex flex-col items-start">
                 <span className="font-medium">Modo Desarrollo</span>
                 <span className="text-xs text-muted-foreground">Acceso Directo a DB</span>
              </div>
            </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-16 items-center gap-4 border-b bg-background px-6">
           <SidebarTrigger className="md:hidden" />
           <div className="flex-1">
             {/* This can be a breadcrumb or page title */}
           </div>
           <div className="ml-auto flex items-center gap-2">
              <Button onClick={() => router.push('/invoices/new')}>
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Nueva Venta</span>
              </Button>
              <Menubar className="p-0 bg-transparent border-none">
                <MenubarMenu>
                  <MenubarTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Settings className="h-5 w-5" />
                      <span className="sr-only">Mantenimiento</span>
                    </Button>
                  </MenubarTrigger>
                  <MenubarContent align="end">
                    <MenubarLabel>Tablas Maestras</MenubarLabel>
                    <MenubarSeparator />
                    <MenubarItem onClick={() => router.push('/fincas')}>Fincas</MenubarItem>
                    <MenubarItem onClick={() => router.push('/customers')}>Clientes</MenubarItem>
                    <MenubarItem onClick={() => router.push('/consignatarios')}>Consignatarios</MenubarItem>
                    <MenubarItem onClick={() => router.push('/vendedores')}>Vendedores</MenubarItem>
                    <MenubarItem onClick={() => router.push('/marcacion')}>Marcacion</MenubarItem>
                    <MenubarItem onClick={() => router.push('/pais')}>Pais</MenubarItem>
                    <MenubarItem onClick={() => router.push('/provincias')}>Provincias</MenubarItem>
                    <MenubarItem onClick={() => router.push('/dae')}>Dae</MenubarItem>
                    <MenubarItem onClick={() => router.push('/cargueras')}>Carguera</MenubarItem>
                    <MenubarSeparator />
                    <MenubarLabel>Documentos</MenubarLabel>
                     <MenubarSeparator />
                    <MenubarItem>Notas de crédito</MenubarItem>
                    <MenubarItem>Notas de débito</MenubarItem>
                  </MenubarContent>
                </MenubarMenu>
              </Menubar>
           </div>
        </header>
        <main className="p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
