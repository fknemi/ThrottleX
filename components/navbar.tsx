"use client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import AuthButtons from "@/components/auth-buttons";
import { Session } from "@/lib/auth";
import { authClient } from "@/lib/auth-client";
import Logo from "./Logo";
import { pagesStore, Page } from "@/lib/stores/pagesStore";
import { v4 as uuidv4 } from "uuid";
import { X, Dot } from "lucide-react";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

export default function Navbar() {
    const { pages } = pagesStore();
    const pathname = usePathname();
    const [showMobileNav, setShowMobileNav] = useState(false);

    useEffect(() => {
        setShowMobileNav(false);
    }, [pathname]);
    const { data, isPending } = authClient.useSession();
    if (isPending) return <div>Loading...</div>;

    const session = data as Session;
    function toggleMobileNav() {
        setShowMobileNav(!showMobileNav);
    }
    return (
        <nav className="flex flex-row justify-between lg:justify-evenly items-center w-full border-2 py-2 px-4 -z-30">
            <Logo />
            <button onClick={toggleMobileNav} className="md:hidden">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 9 9"
                >
                    <g
                        id="Group_12096"
                        data-name="Group 12096"
                        transform="translate(-1221 -24)"
                    >
                        <circle
                            id="Ellipse_68"
                            data-name="Ellipse 68"
                            cx="1.5"
                            cy="1.5"
                            r="1.5"
                            transform="translate(1221 24)"
                            fill="var(--color-black-primary)"
                        ></circle>
                        <circle
                            id="Ellipse_71"
                            data-name="Ellipse 71"
                            cx="1.5"
                            cy="1.5"
                            r="1.5"
                            transform="translate(1221 30)"
                            fill="var(--color-black-primary)"
                        ></circle>
                        <circle
                            id="Ellipse_69"
                            data-name="Ellipse 69"
                            cx="1.5"
                            cy="1.5"
                            r="1.5"
                            transform="translate(1227 24)"
                            fill="var(--color-black-primary)"
                        ></circle>
                        <circle
                            id="Ellipse_70"
                            data-name="Ellipse 70"
                            cx="1.5"
                            cy="1.5"
                            r="1.5"
                            transform="translate(1227 30)"
                            fill="var(--color-black-primary)"
                        ></circle>
                    </g>
                </svg>
            </button>
            <AnimatePresence>
                {showMobileNav && (
                    <MobileNav
                        session={session}
                        pages={pages}
                        toggleMobileNav={toggleMobileNav}
                    />
                )}
            </AnimatePresence>
            <div className="flex-row items-center justify-center gap-4 bg-black-primary text-white rounded-full py-2 px-4 backdrop-blur-md hidden md:flex">
                {

!session ? 
                    pages.slice(0,5).map((page) => {
                    if(session && !page.protected){return null}
                    return (

                        <Link
                            key={uuidv4()}
                            href={page.route}
                            className="font-medium font-sans flex flex-row align-center items-center"
                        >
                            {page.route === pathname && (
                                <Dot size={32} strokeWidth={1.5} />
                            )}
                            <span className="ml-[-2px]">{page.title}</span>
                        </Link>
                    );
                })
: (
                pages.slice(5,8).map((page) => {
                    if(session && !page.protected){return null}
                    return (

                        <Link
                            key={uuidv4()}
                            href={page.route}
                            className="font-medium font-sans flex flex-row align-center items-center"
                        >
                            {page.route === pathname && (
                                <Dot size={32} strokeWidth={1.5} />
                            )}
                            <span className="ml-[-2px]">{page.title}</span>
                        </Link>
                    );
                })

)

                }
                <NavigationMenu>
                    <NavigationMenuList>
                        <NavigationMenuItem>
                            <NavigationMenuTrigger className="text-white !bg-transparent font-sans font-medium text-md">
                                Features
                            </NavigationMenuTrigger>
                            <NavigationMenuContent>
                                <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                                    <ListItem
                                        href="/features/analytics"
                                        title="Analytics"
                                    >
                                        Track and monitor API usage with
                                        real-time insights.
                                    </ListItem>
                                    <ListItem
                                        href="/features/api-monitoring"
                                        title="API Monitoring"
                                    >
                                        Keep track of API performance and
                                        uptime.
                                    </ListItem>
                                    <ListItem
                                        href="/features/api-proxy"
                                        title="API Proxy"
                                    >
                                        Securely manage API requests with a
                                        proxy layer.
                                    </ListItem>
                                    <ListItem
                                        href="/features/api-rate-limiting"
                                        title="API Rate Limiting"
                                    >
                                        Control the number of requests per user
                                        or IP.
                                    </ListItem>
                                    <ListItem
                                        href="/features/api-throttling"
                                        title="API Throttling"
                                    >
                                        Smooth out traffic spikes with request
                                        throttling.
                                    </ListItem>
                                </ul>
                            </NavigationMenuContent>
                        </NavigationMenuItem>
                    </NavigationMenuList>
                </NavigationMenu>
            </div>
            <AuthButtons session={session} className="hidden md:flex" />
        </nav>
    );
}

function MobileNav({
    session,
    pages,
    toggleMobileNav,
}: {
    session: Session;
    pages: Page[];
    toggleMobileNav: () => void;
}) {
    return (
        <motion.div
            className={cn(
                "absolute top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[95vw] h-[90vh] bg-white/50 rounded-md border-2 border-black-primary/20 flex flex-col justify-between z-50 backdrop-blur-md md:hidden"
            )}
            initial={{ left: "-100vw", opacity: 0 }}
            animate={{
                left: "50%",
                opacity: 1,
                transition: {
                    left: {
                        type: "spring",
                        damping: 30,
                        stiffness: 100,
                        duration: 0.5,
                    },
                    opacity: { duration: 0.2 },
                },
            }}
            exit={{
                opacity: 0,
                transition: { duration: 0.3 },
            }}
        >
            <span className="flex justify-end p-4" onClick={toggleMobileNav}>
                <X size={24} />
            </span>
            <section className="flex flex-col gap-4 justify-center items-start pl-4 text-4xl font-sans font-bold mt-[-4rem]">
            {!session ? (
    pages.slice(0, 5).map(({ title, route }) => {
        return (
            <Link key={uuidv4()} href={route}>
                {title}
            </Link>
        );
    })
) : (
    pages.slice(5, 8).map(({ title, route }) => {
        return (
            <Link key={uuidv4()} href={route}>
                {title}
            </Link>
        );
    })
)}
                    </section>

                        <section className="flex justify-start items-end p-4">
                <AuthButtons
                    session={session}
                    className="md:flex w-full md:w-fit"
                />
            </section>
        </motion.div>
    );
}

const ListItem = React.forwardRef<
    React.ComponentRef<"a">,
    React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
    return (
        <li>
            <NavigationMenuLink asChild>
                <a
                    ref={ref}
                    className={cn(
                        "leading-none no-underline outline-none transition-colors",
                        className
                    )}
                    {...props}
                >
                    <div className="text-sm font-medium leading-none">
                        {title}
                    </div>
                    <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                        {children}
                    </p>
                </a>
            </NavigationMenuLink>
        </li>
    );
});
ListItem.displayName = "ListItem";
