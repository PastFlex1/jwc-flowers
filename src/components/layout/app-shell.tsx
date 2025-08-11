
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
  ChevronRight,
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
import { cn } from '@/lib/utils';

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

        <SidebarMenu className="flex-grow">
          <div className="px-4 py-2">
            <h3 className="mb-2 px-2 text-lg font-semibold tracking-tight">{t('sidebar.main')}</h3>
            <div className="space-y-1">
               {mainNavItems.map((item) => (
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
            </div>
          </div>
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
           <div className="flex-1 flex items-center gap-2">
              <Button onClick={() => router.push('/invoices/new')}>
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">{t('header.newSale')}</span>
              </Button>
              <Button onClick={() => router.push('/purchases/new')} variant="outline">
                <ShoppingCart className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">{t('header.newPurchase')}</span>
              </Button>
           </div>
           <div className="ml-auto flex items-center gap-2">
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost">
                    {t('header.documents')}
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
                  <Button variant="ghost">
                    {t('header.masterTables')}
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
