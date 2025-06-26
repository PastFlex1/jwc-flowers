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
  Boxes,
  Settings,
  CircleUser,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useAuth } from '@/context/auth-context';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from '@/components/ui/menubar';

const navItems = [
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/inventory', label: 'Inventory', icon: Boxes },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
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
                isActive={pathname === item.href}
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="justify-start gap-3 w-full px-2 h-12">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://placehold.co/40x40.png" alt="User" data-ai-hint="profile user" />
                  <AvatarFallback>A</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                   <span className="font-medium">Usuario Anónimo</span>
                   <span className="text-xs text-muted-foreground truncate max-w-[120px]">{user?.uid}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Usuario Anónimo</p>
                  <p className="text-xs leading-none text-muted-foreground truncate">
                    {user?.uid}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>
                <CircleUser className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out &amp; Reconnect</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-background px-6">
           <SidebarTrigger className="md:hidden" />
           <h1 className="text-xl font-bold whitespace-nowrap">JCW FLOWERS</h1>
           <Menubar className="p-0 bg-transparent border-none">
            <MenubarMenu>
              <MenubarTrigger>Archivo</MenubarTrigger>
              <MenubarContent>
                <MenubarItem onClick={() => router.push('/fincas')}>Fincas</MenubarItem>
                <MenubarItem onClick={() => router.push('/customers')}>Clientes</MenubarItem>
                <MenubarItem onClick={() => router.push('/consignatarios')}>Consignatarios</MenubarItem>
                <MenubarItem onClick={() => router.push('/vendedores')}>Vendedores</MenubarItem>
                <MenubarItem onClick={() => router.push('/marcacion')}>Marcacion</MenubarItem>
                <MenubarItem onClick={() => router.push('/pais')}>Pais</MenubarItem>
                <MenubarItem onClick={() => router.push('/provincias')}>Provincias</MenubarItem>
                <MenubarItem onClick={() => router.push('/dae')}>Dae</MenubarItem>
                <MenubarItem onClick={() => router.push('/cargueras')}>Carguera</MenubarItem>
                <MenubarItem>Notas de credito</MenubarItem>
                <MenubarItem>Notas de debito</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger className="cursor-pointer" onClick={() => router.push('/invoices/new')}>
                Nueva Venta
              </MenubarTrigger>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger className="cursor-pointer" onClick={() => router.push('/inventory')}>
                Inventario
              </MenubarTrigger>
            </MenubarMenu>
           </Menubar>
        </header>
        <main className="p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
