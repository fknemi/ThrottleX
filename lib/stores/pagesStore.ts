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
        title: "Coffee Beans",
        route: "/link",
        protected: false

    },
    {
        title: "Ready To Brew",
        route: "/link",
        protected: false

    },
    {
        title: "Subscription",
        route: "/link",
        protected: false


    },
    {
        title: "Merchandise",
        route: "/link",
        protected: false


    },
 {
        title: "Shop all",
        route: "/link",
        protected: false
    },
{
        title: "Our Philosophy",
        route: "/link",
        protected: false
    },
{
        title: "Our Stores",
        route: "/link",
        protected: false
    },
{
        title: "A Coffee Waste Initiative",
        route: "/link",
        protected: false
    }

    ],
    updateLinks: (newLinks: Page[]) => set({ pages: newLinks }),
}));
