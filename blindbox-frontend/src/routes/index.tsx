// index.tsx
import { createBrowserRouter } from 'react-router-dom';
import Layout from '../components/Layout';
import HomePage from '../pages/Home';
import LoginPage from '../pages/Login';
import RegisterPage from '../pages/Register';
import BlindBoxPage from '../pages/BlindBox';
import OrderPage from '../pages/Order';
import BlindBoxDrawPage from '../pages/BlindBoxDrawPage';
import InventoryPage from '../pages/InventoryPage';
import ShowList from "../pages/ShowList";
import ShowDetail from "../pages/ShowDetail";

export default createBrowserRouter([
    {
        path: '/',
        element: <Layout />,
        children: [
            { index: true, element: <HomePage /> },
            { path: 'login', element: <LoginPage /> },
            { path: 'register', element: <RegisterPage /> },
            {
                path: 'blindbox',
                element: <BlindBoxPage />,
                children: [
                    {
                        path: 'draw/:id',
                        element: <BlindBoxDrawPage />
                    }
                ]
            },
            { path: 'orders', element: <OrderPage /> },
            { path: 'inventory', element: <InventoryPage /> },
            { path: 'shows', element: <ShowList /> },
            { path: 'shows/:id', element: <ShowDetail /> },
        ]
    }
]);