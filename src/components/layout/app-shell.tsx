
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
  Settings,
  Plus,
  Languages,
  LogOut,
  UserCircle,
  ShoppingCart,
  Receipt,
  ChevronDown,
} from 'lucide-react';
import { useTranslation } from '@/context/i18n-context';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
    { href: '/accounts-payable', label: t('sidebar.accountsPayable'), icon: Receipt },
    { href: '/invoices', label: t('sidebar.invoices'), icon: FileText },
    { href: '/customers', label: t('sidebar.customers'), icon: Users },
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
              <Button onClick={() => router.push('/purchases/new')} variant="outline">
                <ShoppingCart className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">{t('header.newPurchase')}</span>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost">
                    {t('header.masterTables')}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push('/productos')}>{t('productos.title')}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/fincas')}>{t('fincas.title')}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/customers')}>{t('customers.title')}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/consignatarios')}>{t('consignatarios.title')}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/vendedores')}>{t('vendedores.title')}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/marcacion')}>{t('marcacion.title')}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/pais')}>{t('pais.title')}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/provincias')}>{t('provincias.title')}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/dae')}>{t('dae.title')}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/cargueras')}>{t('cargueras.title')}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost">
                    {t('header.documents')}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push('/credit-notes')}>Notas de Crédito</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/debit-notes')}>Notas de Débito</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/account-statement')}>Estado de Cuenta Cliente</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/farm-account-statement')}>Estado de Cuenta Finca</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/payments')}>Registrar Pago</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/record-purchase-payment')}>Cuentas por Pagar</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Languages className="h-5 w-5" />
                    <span className="sr-only">{t('header.changeLanguage')}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setLocale('es')} disabled={locale === 'es'}>
                    Español
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocale('en')} disabled={locale === 'en'}>
                    English
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

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
