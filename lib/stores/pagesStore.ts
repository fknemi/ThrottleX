import { create } from 'zustand';
export interface Page {
    title: string;
    route: string;
    protected: boolean;
}

// Define the type for the store state
interface PagesStoreState {
    pages: Page[];
    updateLinks: (newLinks: Page[]) => void;
}
export const pagesStore = create<PagesStoreState>((set) => ({
    pages: [{
        title: "Home",
        route: "/",
        protected: false

    },
    {
        title: "Documentation",
        route: "/documentation",
        protected: false

    },
    {
        title: "Customers",
        route: "/customers",
        protected: false

    },
    {
        title: "Company",
        route: "/company",
        protected: false


    },
    {
        title: "Pricing",
        route: "/pricing",
        protected: false
    },
    {
        title: "Dashboard",
        route: "/dashboard",
        protected: true
    },

    {
        title: "Routes",
        route: "/routes",
        protected: true
    },
{
        title: "Services",
        route: "/services",
        protected: true
    },

{
        title: "API Keys",
        route: "/keys",
        protected: true
    },









 

    ],
    updateLinks: (newLinks: Page[]) => set({ pages: newLinks }),
}));
