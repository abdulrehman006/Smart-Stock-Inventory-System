import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Chart } from 'primereact/chart';
import { Button } from 'primereact/button';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

const dummyUsers = [
    { id: 1, name: 'John Doe', email: 'john.doe@example.com', role: 'Admin' },
    { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com', role: 'User' },
    { id: 3, name: 'Mike Johnson', email: 'mike.j@example.com', role: 'User' },
    { id: 4, name: 'Sarah Williams', email: 'sarah.w@example.com', role: 'Admin' },
];

const dummyRoles = [
    { name: 'Admin', count: 2 },
    { name: 'User', count: 2 },
];

const chartData = {
    labels: dummyRoles.map(role => role.name),
    datasets: [
        {
            data: dummyRoles.map(role => role.count),
            backgroundColor: ['#6366F1', '#10B981'],
            hoverOffset: 4,
        },
    ],
};

const chartOptions = {
    plugins: {
        legend: {
            labels: {
                color: '#333',
            },
        },
    },
};

export default function Dashboard() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6 bg-gray-50 rounded-xl">
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card title="Total Users" className="shadow-lg bg-white rounded-lg">
                        <p className="text-3xl font-bold text-blue-600">{dummyUsers.length}</p>
                        <p className="text-gray-600">Active Users</p>
                    </Card>
                    <Card title="Admin Roles" className="shadow-lg bg-white rounded-lg">
                        <p className="text-3xl font-bold text-green-600">{dummyRoles.find(r => r.name === 'Admin')?.count || 0}</p>
                        <p className="text-gray-600">Administrators</p>
                    </Card>
                    <Card title="User Roles" className="shadow-lg bg-white rounded-lg">
                        <p className="text-3xl font-bold text-purple-600">{dummyRoles.find(r => r.name === 'User')?.count || 0}</p>
                        <p className="text-gray-600">Regular Users</p>
                    </Card>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-lg shadow-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-800">User List</h2>
                        <Button
                            label="Add User"
                            icon="pi pi-plus"
                            className="p-button-primary p-button-sm"
                            onClick={() => alert('Navigate to Add User page')}
                        />
                    </div>
                    <DataTable value={dummyUsers} paginator rows={5} className="text-sm">
                        <Column field="id" header="ID" sortable />
                        <Column field="name" header="Name" sortable />
                        <Column field="email" header="Email" sortable />
                        <Column field="role" header="Role" sortable />
                        <Column
                            body={() => (
                                <Button
                                    icon="pi pi-ellipsis-v"
                                    className="p-button-text p-button-rounded p-button-secondary"
                                    onClick={() => alert('Open user actions')}
                                />
                            )}
                            header="Actions"
                        />
                    </DataTable>
                </div>

                {/* Role Distribution Chart */}
                <div className="bg-white rounded-lg shadow-lg p-4">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Role Distribution</h2>
                    <Chart type="doughnut" data={chartData} options={chartOptions} className="w-full h-64" />
                </div>
            </div>
        </AppLayout>
    );
}