'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
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
  Languages,
  LogOut,
  UserCircle,
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
import { useTranslation } from '@/context/i18n-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, setLocale, locale } = useTranslation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const navItems = [
    { href: '/invoices', label: t('sidebar.invoices'), icon: FileText },
    { href: '/customers', label: t('sidebar.customers'), icon: Users },
    { href: '/inventory', label: t('sidebar.inventory'), icon: Leaf },
  ];

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <Flower2 className="h-6 w-6 text-primary" />
            </Button>
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold font-headline">{t('sidebar.title')}</h2>
              <p className="text-sm text-muted-foreground">{t('sidebar.subtitle')}</p>
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
                <Link href={item.href} prefetch={true}>
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
                 <span className="font-medium">{t('sidebar.devMode')}</span>
                 <span className="text-xs text-muted-foreground">{t('sidebar.dbAccess')}</span>
              </div>
            </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="flex flex-col">
        <header className="app-shell-header flex h-16 shrink-0 items-center gap-4 border-b bg-background px-6">
           <SidebarTrigger className="md:hidden" />
           <div className="flex-1">
             {/* This can be a breadcrumb or page title */}
           </div>
           <div className="ml-auto flex items-center gap-4">
              <Button onClick={() => router.push('/invoices/new')}>
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">{t('header.newSale')}</span>
              </Button>
              <Menubar className="p-0 bg-transparent border-none">
                <MenubarMenu>
                  <MenubarTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Settings className="h-5 w-5" />
                      <span className="sr-only">{t('header.maintenance')}</span>
                    </Button>
                  </MenubarTrigger>
                  <MenubarContent align="end">
                    <MenubarLabel>{t('header.masterTables')}</MenubarLabel>
                    <MenubarSeparator />
                    <MenubarItem onClick={() => router.push('/productos')}>{t('productos.title')}</MenubarItem>
                    <MenubarItem onClick={() => router.push('/fincas')}>{t('fincas.title')}</MenubarItem>
                    <MenubarItem onClick={() => router.push('/customers')}>{t('customers.title')}</MenubarItem>
                    <MenubarItem onClick={() => router.push('/consignatarios')}>{t('consignatarios.title')}</MenubarItem>
                    <MenubarItem onClick={() => router.push('/vendedores')}>{t('vendedores.title')}</MenubarItem>
                    <MenubarItem onClick={() => router.push('/marcacion')}>{t('marcacion.title')}</MenubarItem>
                    <MenubarItem onClick={() => router.push('/pais')}>{t('pais.title')}</MenubarItem>
                    <MenubarItem onClick={() => router.push('/provincias')}>{t('provincias.title')}</MenubarItem>
                    <MenubarItem onClick={() => router.push('/dae')}>{t('dae.title')}</MenubarItem>
                    <MenubarItem onClick={() => router.push('/cargueras')}>{t('cargueras.title')}</MenubarItem>
                    <MenubarSeparator />
                    <MenubarLabel>{t('header.documents')}</MenubarLabel>
                     <MenubarSeparator />
                    <MenubarItem onClick={() => router.push('/credit-notes')}>Notas de Crédito</MenubarItem>
                    <MenubarItem onClick={() => router.push('/debit-notes')}>Notas de Débito</MenubarItem>
                    <MenubarItem onClick={() => router.push('/account-statement')}>Estado de Cuenta</MenubarItem>
                    <MenubarItem onClick={() => router.push('/payments')}>Registrar Pago</MenubarItem>
                  </MenubarContent>
                </MenubarMenu>
              </Menubar>
              <Menubar className="p-0 bg-transparent border-none">
                <MenubarMenu>
                  <MenubarTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Languages className="h-5 w-5" />
                      <span className="sr-only">{t('header.changeLanguage')}</span>
                    </Button>
                  </MenubarTrigger>
                  <MenubarContent align="end">
                    <MenubarItem onClick={() => setLocale('es')} disabled={locale === 'es'}>
                      Español
                    </MenubarItem>
                    <MenubarItem onClick={() => setLocale('en')} disabled={locale === 'en'}>
                      English
                    </MenubarItem>
                  </MenubarContent>
                </MenubarMenu>
              </Menubar>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                     <Avatar>
                        <AvatarFallback>
                           <UserCircle />
                        </AvatarFallback>
                      </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{user?.username}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
           </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
