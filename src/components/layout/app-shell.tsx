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
  SidebarRail,
  useSidebar,
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
  Receipt,
  ChevronDown,
  Package,
  Building,
  User,
  Tags,
  MapPin,
  FileArchive,
  Ship,
  Notebook,
  CreditCard,
  Banknote,
  Archive,
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

function AppShellHeader() {
  const { state } = useSidebar();
  return (
    <SidebarHeader className="p-4">
      <Button
        variant="ghost"
        className="flex h-auto w-full items-center justify-start gap-2 p-0 hover:bg-transparent"
        asChild
      >
        <Link href="/">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
            <Flower2 className="h-6 w-6 text-primary" />
            </div>
            <div className="flex flex-col items-start gap-px overflow-hidden whitespace-nowrap transition-all duration-300 group-data-[collapsible=icon]:-ml-12 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0">
            <h2 className="text-lg font-semibold font-headline">JCW FLOWERS</h2>
            <p className="text-sm text-muted-foreground">Para Floristas</p>
            </div>
        </Link>
      </Button>
    </SidebarHeader>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, setLocale, locale } = useTranslation();
  const { user, logout } = useAuth();
  
  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const mainNavItems = [
    { href: '/invoices', label: t('sidebar.invoices'), icon: FileText },
    { href: '/accounts-payable', label: t('sidebar.accountsPayable'), icon: Receipt },
  ];

  const documentLinks = [
    { href: '/credit-notes', label: 'Notas de Crédito', icon: FileText },
    { href: '/debit-notes', label: 'Notas de Débito', icon: FileText },
    { href: '/account-statement', label: 'Estado de Cuenta Cliente', icon: Users },
    { href: '/farm-account-statement', label: 'Estado de Cuenta Finca', icon: Building },
    { href: '/historical-account-statement', label: 'Estado de Cuenta Histórico', icon: Archive },
    { href: '/payments', label: 'Registrar Pago', icon: Banknote },
    { href: '/record-purchase-payment', label: 'Registrar Pago Compra', icon: CreditCard },
  ];

  const masterTableLinks = [
      { href: '/productos', label: t('productos.title'), icon: Package },
      { href: '/fincas', label: t('fincas.title'), icon: Building },
      { href: '/customers', label: t('customers.title'), icon: Users },
      { href: '/consignatarios', label: t('consignatarios.title'), icon: User },
      { href: '/vendedores', label: t('vendedores.title'), icon: UserCircle },
      { href: '/marcacion', label: t('marcacion.title'), icon: Tags },
      { href: '/pais', label: t('pais.title'), icon: MapPin },
      { href: '/provincias', label: t('provincias.title'), icon: MapPin },
      { href: '/dae', label: t('dae.title'), icon: FileArchive },
      { href: '/cargueras', label: t('cargueras.title'), icon: Ship },
  ];


  return (
    <SidebarProvider>
      <Sidebar>
        <AppShellHeader />

        <SidebarMenu className="flex-grow">
          <div className="px-4 py-2">
            <h3 className="mb-2 px-2 text-lg font-semibold tracking-tight transition-all duration-300 group-data-[collapsible=icon]:-ml-12 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0">{t('sidebar.main')}</h3>
            <div className="space-y-1">
               {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.href)}
                    className="gap-3"
                    tooltip={item.label}
                  >
                    <Link href={item.href} prefetch={true}>
                      <item.icon className="h-5 w-5" />
                      <span className='transition-all duration-300 group-data-[collapsible=icon]:-ml-12 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0'>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </div>
          </div>
        </SidebarMenu>

        <SidebarFooter className="p-4 mt-auto transition-all duration-300 group-data-[collapsible=icon]:-ml-12 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0">
           <div className="flex items-center gap-3 w-full px-2 h-12">
              <div className="flex flex-col items-start">
                 <span className="font-medium">{t('sidebar.devMode')}</span>
                 <span className="text-xs text-muted-foreground">{t('sidebar.dbAccess')}</span>
              </div>
            </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="flex flex-col">
        <header className="app-shell-header flex h-16 shrink-0 items-center gap-4 border-b bg-background px-6">
           <div className="flex-1 flex items-center gap-2">
              <Button onClick={() => router.push('/invoices/new')}>
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Nueva Factura</span>
              </Button>
           </div>
           <div className="ml-auto flex items-center gap-2">
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className='px-2 sm:px-4'>
                    <span className='hidden sm:inline'>{t('header.documents')}</span>
                    <Notebook className='sm:hidden h-5 w-5'/>
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {documentLinks.map(link => (
                    <DropdownMenuItem key={link.href} onClick={() => router.push(link.href)}>
                      <link.icon className="mr-2 h-4 w-4" />
                      <span>{link.label}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className='px-2 sm:px-4'>
                    <span className='hidden sm:inline'>{t('header.masterTables')}</span>
                    <Settings className='sm:hidden h-5 w-5'/>
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                   {masterTableLinks.map(link => (
                    <DropdownMenuItem key={link.href} onClick={() => router.push(link.href)}>
                      <link.icon className="mr-2 h-4 w-4" />
                      <span>{link.label}</span>
                    </DropdownMenuItem>
                  ))}
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
