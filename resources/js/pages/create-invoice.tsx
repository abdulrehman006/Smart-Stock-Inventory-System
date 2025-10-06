import { Head, usePage, router } from "@inertiajs/react";
import { useState, useRef, useEffect } from "react";
import { toast } from 'sonner';
import AppLayout from "@/layouts/app-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { GripVerticalIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Customer = { id: number; name: string; email?: string; location: string; location_id: number };
type Product = { id: number; name: string; rate: number; description: string; quantity: number; category: string; item_type: number };
type Category = { id: number; name: string; products: Product[] };

type Sale = {
  id: number;
  bill_no: string;
  invoice_date: string | null;
  due_date: string | null;
  customer_id: number | null;
  location_id: number | null;
  message_invoice: string | null;
  message_statement: string | null;
  items: LineItem[];
};

type PageProps = {
  customers: Customer[];
  categories: Category[];
  sale?: Sale;
  lastInvoiceNo?: string;
};

type LineItem = {
  id: number;
  productId: number | null;
  qty: number;
  description: string;
  rate: number;
  name?: string;
  category?: string;
  isEditing?: boolean;
};

type Errors = {
  customer?: string;
  items?: string;
  server?: string;
};


export default function CreateInvoice() {
  const { customers, categories, sale, lastInvoiceNo } = usePage<PageProps>().props;

  // Initialize dates
  const today = new Date();
  const dueDateDefault = new Date(today);
  dueDateDefault.setDate(today.getDate() + 15);
  const initialBillNo = sale?.bill_no || (lastInvoiceNo ? String(Number(lastInvoiceNo) + 1) : "1006");

  const [billNo, setBillNo] = useState(initialBillNo);
  const [invoiceDate, setInvoiceDate] = useState<Date | null>(sale?.invoice_date ? new Date(sale.invoice_date) : today);
  const [dueDate, setDueDate] = useState<Date | null>(sale?.due_date ? new Date(sale.due_date) : dueDateDefault);
  const [customerId, setCustomerId] = useState<number | null>(sale?.customer_id || null);
  const [items, setItems] = useState<LineItem[]>(sale?.items.length ? sale.items : [
    { id: Date.now(), productId: null, qty: 1, description: "", rate: 0, name: "", isEditing: true },
    { id: Date.now() + 1, productId: null, qty: 1, description: "", rate: 0, name: "", isEditing: false },
  ]);
  const [msgInvoice, setMsgInvoice] = useState(sale?.message_invoice || "");
  const [msgStatement, setMsgStatement] = useState(sale?.message_statement || "");
  const [errors, setErrors] = useState<Errors>({});
  const tableRef = useRef<HTMLTableElement>(null);
  const [draggedItemId, setDraggedItemId] = useState<number | null>(null);

  const isEditing = !!sale?.id;

  const addLine = () =>
    setItems([
      ...items,
      { id: Date.now(), productId: null, qty: 1, description: "", rate: 0, name: "", isEditing: false },
    ]);

  const clearLines = () => setItems([
    { id: Date.now(), productId: null, qty: 1, description: "", rate: 0, name: "", isEditing: true },
    { id: Date.now() + 1, productId: null, qty: 1, description: "", rate: 0, name: "", isEditing: false },
  ]);

  const updateItem = (id: number, field: keyof LineItem, value: any) => {
    let finalValue = value;

    if (field === "qty") {
      const numericValue = Number(value);
      const item = items.find((i) => i.id === id);

      if (item && item.productId) {
        const product = findProduct(item.productId);
        if (product) {
          if (product.item_type === 2) {
            finalValue = 1;
            if (numericValue !== 1) {
              toast.error("Quantity for non-inventory items (item_type 2) is fixed at 1.");
            }
          } else {
            finalValue = numericValue;
            if (numericValue < 1) {
              finalValue = 1;
              toast.error("Quantity cannot be less than 1.");
            } else if (numericValue > product.quantity) {
              toast.warning(
                `You entered ${numericValue}, but only ${product.quantity} in stock.`
              );
              finalValue = product.quantity;
            }
          }
        } else {
          finalValue = numericValue >= 1 ? numericValue : 1;
        }
      } else {
        finalValue = numericValue >= 1 ? numericValue : 1;
      }
    }

    setItems(
      items.map((i) => (i.id === id ? { ...i, [field]: finalValue } : i))
    );
  };

  const removeLine = (id: number) => setItems(items.filter((i) => i.id !== id));

  const findProduct = (id: number | null): Product | undefined => {
    for (const cat of categories) {
      const product = cat.products.find((p) => p.id === id);
      if (product) return product;
    }
    return undefined;
  };

  const handleProductChange = (itemId: number, productId: number | null) => {
    if (productId === null || productId === 0) {
      setItems(items.map((item) =>
        item.id === itemId
          ? { ...item, productId: null, name: "", description: "", rate: 0, category: "", qty: 1 }
          : item
      ));
      return;
    }

    const isProductAlreadyAdded = items.some(
      (otherItem) => otherItem.productId === productId && otherItem.id !== itemId
    );
    if (isProductAlreadyAdded) {
      toast.error('This product is already added in another line item.');
      return;
    }

    const product = findProduct(productId);
    if (product) {
      setItems(items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              productId,
              name: product.name,
              description: product.description,
              rate: product.rate,
              category: product.category,
              qty: product.item_type === 2 ? 1 : product.quantity === 0 ? 0 : 1
            }
          : item
      ));
    } else {
      toast.error(`Product with ID ${productId} not found.`);
    }
  };

  const startEditing = (id: number, index: number) => {
    const updatedItems = items.map((item) =>
      item.id === id ? { ...item, isEditing: true } : { ...item, isEditing: false }
    );

    if (index === items.length - 1) {
      setItems([
        ...updatedItems,
        { id: Date.now(), productId: null, qty: 1, description: "", rate: 0, name: "", isEditing: false },
      ]);
    } else {
      setItems(updatedItems);
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, id: number) => {
    setDraggedItemId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent<HTMLTableRowElement>, dropId: number) => {
    e.preventDefault();
    if (draggedItemId === null || draggedItemId === dropId) return;

    const draggedIndex = items.findIndex((item) => item.id === draggedItemId);
    const dropIndex = items.findIndex((item) => item.id === dropId);

    const newItems = [...items];
    const [draggedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(dropIndex, 0, draggedItem);

    setItems(newItems);
    setDraggedItemId(null);
  };

  const submitInvoice = () => {
    setErrors({});

    let newErrors: Errors = {};
    if (!customerId) newErrors.customer = "Please select a customer";
    if (items.length === 0 || items.every((item) => !item.productId)) newErrors.items = "Please add at least one product";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Object.values(newErrors).forEach((error) => toast.error(error));
      return;
    }

    const now = new Date();
    const selectedCustomer = customers.find((c) => c.id === customerId);

    const invoiceData = {
      bill_no: billNo,
      invoice_date: invoiceDate ? invoiceDate.toISOString().split('T')[0] : null,
      sale_date: now.toISOString(),
      due_date: dueDate ? dueDate.toISOString().split('T')[0] : null,
      customer_id: customerId,
      location_id: selectedCustomer?.location_id ?? null,
      items: items
        .filter((item) => item.productId !== null)
        .map((item) => {
          const product = findProduct(item.productId);
          return {
            id: item.id,
            product_id: item.productId,
            quantity: item.qty,
            description: item.description,
            rate: item.rate,
          };
        }),
      message_invoice: msgInvoice,
      message_statement: msgStatement,
    } as unknown as Record<string, any>;

    if (isEditing) {
      router.put(`/sales/${sale!.id}`, invoiceData, {
        onSuccess: () => {
          setErrors({});
          toast.success('Invoice updated successfully!');
        },
        onError: (err) => {
          setErrors({ server: "Failed to update invoice. Please try again." });
          toast.error('Failed to update invoice. Please try again.');
          console.error("❌ Update error", err);
        },
      });
    } else {
      router.post('/sales/store', invoiceData, {
        onSuccess: () => {
          setItems([
            { id: Date.now(), productId: null, qty: 1, description: "", rate: 0, name: "", isEditing: true },
            { id: Date.now() + 1, productId: null, qty: 1, description: "", rate: 0, name: "", isEditing: false },
          ]);
          setCustomerId(null);
          setMsgInvoice("");
          setMsgStatement("");
          setBillNo((prev) => String(Number(prev) + 1));
          setErrors({});
          toast.success('Invoice created successfully!');
        },
        onError: (err) => {
          setErrors({ server: "Failed to create invoice. Please try again." });
          toast.error('Failed to create invoice. Please try again.');
          console.error("❌ Create error", err);
        },
      });
    }
  };

  const isSubmitButtonDisabled = !(
    customerId &&
    billNo &&
    invoiceDate &&
    dueDate &&
    items.some(item => item.productId !== null)
  );

  const calculateItemAmount = (item: LineItem): number => {
    if (!item.productId) return 0;
    const product = findProduct(item.productId);
    if (!product) return 0;
    const rate = Number(item.rate) || 0;
    const qty = Number(item.qty) || 0;
    return rate * qty;
  };

  const total = items.reduce((sum, item) => sum + calculateItemAmount(item), 0);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tableRef.current && !tableRef.current.contains(event.target as Node)) {
        setItems(items.map((item) => ({ ...item, isEditing: false })));
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [items]);

  const customerOptions = customers.map((c) => ({
    value: c.id.toString(),
    label: c.name,
  }));
  
// Helper function to generate flat Combobox options for products
const getProductOptions = (categories: Category[]) => {
  return categories
    .filter((cat) => cat.products.length > 0)
    .flatMap((cat) =>
      cat.products.map((p) => ({
        value: p.id.toString(),
        label: `${cat.name}: ${p.name}`,
      }))
    );
};

  return (
    <AppLayout>
      <Head title={isEditing ? `Edit Invoice ${billNo}` : `Invoice ${billNo}`} />

      <div className="p-6 space-y-2">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold">{isEditing ? 'Edit Invoice' : 'Invoice'}</h1>
          <div className="text-right">
            <div className="uppercase text-xs">Balance Due</div>
            <div className="text-2xl font-bold">PKR {total.toFixed(2)}</div>
          </div>
        </div>

        <Card className="p-6 space-y-2">
          <div className="grid grid-cols-12 gap-y-0">
            <div className="col-span-3">
              <label className="block text-sm font-medium text-gray-700">Customer</label>
              <Select
                value={customerId?.toString() ?? ""}
                onValueChange={(value) => setCustomerId(value ? parseInt(value) : null)}
              >
                <SelectTrigger className={errors.customer ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select a customer..." />
                </SelectTrigger>
                <SelectContent>
                  {customerOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.customer && (
                <p className="mt-1 text-sm text-red-600">{errors.customer}</p>
              )}
            </div>
            <div />
          </div>

          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-3">
              <label className="block text-sm font-medium text-gray-700">Billing address</label>
              <Textarea
                rows={3}
                value={customerId ? `${customers.find((c) => c.id === customerId)?.name || ""}\n${customers.find((c) => c.id === customerId)?.location || ""}` : ""}
                readOnly
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 h-24"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Invoice date</label>
              <Input
                type="date"
                value={invoiceDate ? invoiceDate.toISOString().split('T')[0] : ''}
                onChange={(e) => setInvoiceDate(e.target.value ? new Date(e.target.value) : null)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Due date</label>
              <Input
                type="date"
                value={dueDate ? dueDate.toISOString().split('T')[0] : ''}
                onChange={(e) => setDueDate(e.target.value ? new Date(e.target.value) : null)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="col-span-3" />
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Invoice no.</label>
              <Input
                type="text"
                value={billNo}
                onChange={(e) => setBillNo(e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-right"
              />
            </div>
          </div>

          <div className="relative">
            {errors.items && (
              <p className="text-sm text-red-600">{errors.items}</p>
            )}
            <table ref={tableRef} className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className="bg-white">
                  <th className="w-8 p-2 text-left border border-gray-300"></th>
                  <th className="w-10 p-2 text-left border border-gray-300">#</th>
                  <th className="w-64 p-2 text-left border border-gray-300">Product/Service</th>
                  <th className="p-2 text-left border border-gray-300">Description</th>
                  <th className="w-16 p-2 text-center border border-gray-300">Qty</th>
                  <th className="w-20 p-2 text-center border border-gray-300">Rate</th>
                  <th className="w-24 p-2 text-center border border-gray-300">Amount</th>
                  <th className="w-10 p-2 text-center border border-gray-300">Delete</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item.id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, item.id)}
                    className={`border-b border-gray-300 ${index % 2 === 0 ? 'bg-gray-50' : ''} cursor-move hover:bg-gray-100`}
                    onClick={() => startEditing(item.id, index)}
                  >
                    <td className="p-2 border border-gray-300 text-center">
                      <GripVerticalIcon
                        className="h-4 w-4 text-gray-500 hover:text-gray-700 cursor-move"
                        aria-label="Drag to reorder"
                        onMouseDown={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="p-2 text-center border border-gray-300">{index + 1}</td>
                    <td className={`${item.isEditing ? 'p-0 overflow-hidden' : 'p-2'} border border-gray-300`}>
                      {item.isEditing ? (
                        <Select
                          value={item.productId?.toString() ?? ""}
                          onValueChange={(value) => {
                            const productId = value ? Number(value) : null;
                            handleProductChange(item.id, productId);
                          }}
                        >
                          <SelectTrigger className={`w-full h-8 ${errors.items ? 'border-red-500' : ''}`}>
                            <SelectValue placeholder="Select a product..." />
                          </SelectTrigger>
                          <SelectContent>
                            {getProductOptions(categories).map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="block w-full p-2 text-gray-900 text-sm h-8 leading-8">
                          {item.productId !== null && item.productId !== 0 ? (
                            <>
                              <strong>{item.category || "Unknown Category"}</strong>: {item.name || " "}
                            </>
                          ) : (
                            " "
                          )}
                        </span>
                      )}
                    </td>
                    <td className={`${item.isEditing ? 'p-0' : 'p-2'} border border-gray-300`}>
                      {item.isEditing ? (
                        <Input
                          value={item.description}
                          onChange={(e) => updateItem(item.id, "description", e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 h-8"
                        />
                      ) : (
                        <span className="block w-full p-2 text-gray-900 text-sm h-8 leading-8">{item.description || " "}</span>
                      )}
                    </td>
                    <td className={`${item.isEditing ? 'p-0 text-center' : 'p-2 text-center'} border border-gray-300`}>
                      {item.isEditing ? (
                        <div className="flex flex-col items-center p-2">
                          <Input
                            type="number"
                            value={item.qty}
                            min={item.productId && findProduct(item.productId)?.item_type === 2 ? 1 : 0}
                            max={item.productId && findProduct(item.productId)?.item_type !== 2 ? findProduct(item.productId)?.quantity : 1}
                            onChange={(e) => updateItem(item.id, "qty", Number(e.target.value))}
                            className="w-16 p-2 border border-gray-300 rounded-md text-center focus:ring-indigo-500 focus:border-indigo-500 h-8"
                            disabled={item.productId !== null && findProduct(item.productId)?.item_type === 2}
                          />
                          {item.productId && findProduct(item.productId)?.item_type !== 2 && item.qty > (findProduct(item.productId)?.quantity || 0) && (
                            toast.error('Quantity exceeds available stock!')
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-900">{item.qty}</span>
                      )}
                    </td>
                    <td className={`${item.isEditing ? 'p-0 text-center' : 'p-2 text-center'} border border-gray-300`}>
                      {item.isEditing ? (
                        <Input
                          type="number"
                          value={item.rate}
                          onChange={(e) => updateItem(item.id, "rate", Number(e.target.value))}
                          className="w-20 p-2 border border-gray-300 rounded-md text-center focus:ring-indigo-500 focus:border-indigo-500 h-8"
                        />
                      ) : (
                        <span className="text-gray-900">{item.rate}</span>
                      )}
                    </td>
                    <td className="p-2 text-center border border-gray-300">
                      {calculateItemAmount(item).toFixed(2)}
                    </td>
                    <td className="p-2 text-center border border-gray-300">
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); removeLine(item.id); }}>
                        🗑️
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-x-2">
            <Button onClick={addLine} className="mt-4">
              Add lines
            </Button>
            <Button variant="outline" onClick={clearLines} className="mt-4">
              Clear all lines
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-6 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Message on invoice</label>
              <Textarea
                rows={2}
                value={msgInvoice}
                onChange={(e) => setMsgInvoice(e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 h-20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Message on statement</label>
              <Textarea
                rows={2}
                value={msgStatement}
                onChange={(e) => setMsgStatement(e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 h-20"
              />
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <div className="space-y-1 text-right">
              <div>
                Total: <strong className="text-lg font-semibold">PKR {total.toFixed(2)}</strong>
              </div>
              <div>
                Balance due: <strong className="text-lg font-semibold">PKR {total.toFixed(2)}</strong>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              onClick={submitInvoice}
              disabled={isSubmitButtonDisabled}
              className={`px-4 py-2 rounded-md text-sm ${isSubmitButtonDisabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-gray-800'} text-white`}
            >
              {isEditing ? 'Update Invoice' : 'Create Invoice'}
            </Button>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}